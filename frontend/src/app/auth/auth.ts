import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

export type AuthMode = 'sign-in' | 'sign-up';

type FieldName = 'firstName' | 'lastName' | 'email' | 'password';

const NAME_FIELDS = ['firstName', 'lastName'] as const;

const ERROR_MESSAGES: Record<FieldName, Record<string, string>> = {
  firstName: { required: 'First name is required.' },
  lastName: { required: 'Last name is required.' },
  email: { required: 'Email is required.', email: 'Enter a valid email address.' },
  password: { required: 'Password is required.', minlength: 'Use at least 8 characters.' },
};

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mode = signal<AuthMode>('sign-in');
  protected readonly showPassword = signal(false);
  protected readonly attempted = signal(false);
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly isSignUp = computed(() => this.mode() === 'sign-up');

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: [{ value: '', disabled: true }, Validators.required],
    lastName: [{ value: '', disabled: true }, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected setMode(mode: AuthMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.attempted.set(false);
    this.formError.set(null);
    this.form.controls.password.reset();
    // Name fields only exist (and validate) when creating an account.
    for (const name of NAME_FIELDS) {
      const control = this.form.controls[name];
      if (mode === 'sign-up') control.enable();
      else control.disable();
    }
  }

  protected toggleMode(): void {
    this.setMode(this.isSignUp() ? 'sign-in' : 'sign-up');
  }

  protected hasError(name: FieldName): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.attempted());
  }

  protected errorFor(name: FieldName): string {
    const errors = this.form.controls[name].errors;
    if (!errors) return '';
    return ERROR_MESSAGES[name][Object.keys(errors)[0]] ?? 'Invalid value.';
  }

  protected async submit(): Promise<void> {
    this.attempted.set(true);
    this.formError.set(null);
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password } = this.form.getRawValue();
    this.pending.set(true);
    try {
      if (this.isSignUp()) {
        await this.auth.signUp({ firstName, lastName, email, password });
        await this.router.navigateByUrl('/onboarding');
      } else {
        await this.auth.signIn({ email, password });
        await this.router.navigateByUrl('/dashboard');
      }
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      this.pending.set(false);
    }
  }
}
