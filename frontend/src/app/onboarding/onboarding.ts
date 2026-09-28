import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileForm, ProfileFormValue } from '../shared/profile-form/profile-form';
import { Sign } from '../service/sign';

@Component({
  selector: 'app-onboarding',
  imports: [ProfileForm],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Onboarding {
  private readonly auth = inject(Sign);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected async save(profile: ProfileFormValue): Promise<void> {
    this.pending.set(true);
    this.formError.set(null);
    try {
      const queryParams = this.route.snapshot.queryParamMap;
      const firstname = queryParams.get('firstName')?.trim() ?? '';
      const lastname = queryParams.get('lastName')?.trim() ?? '';
      const userEmail = queryParams.get('email')?.trim() ?? '';
      const userPassword = queryParams.get('password') ?? '';

      if (!firstname || !lastname || !userEmail || !userPassword) {
        throw new Error('Signup details are missing. Please return and complete the signup form.');
      }

      await this.auth.signUp({
        firstname,
        lastname,
        email: userEmail,
        password: userPassword,
        ...profile,
        kids: profile.kids ?? 0,
      });
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Could not save your profile.');
    } finally {
      this.pending.set(false);
    }
  }

  protected skip(): void {
    void this.router.navigateByUrl('/dashboard');
  }
}
