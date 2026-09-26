import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { UserProfile } from '../core/user';
import { ProfileForm } from '../shared/profile-form/profile-form';

@Component({
  selector: 'app-onboarding',
  imports: [ProfileForm],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Onboarding {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected async save(profile: UserProfile): Promise<void> {
    this.pending.set(true);
    this.formError.set(null);
    try {
      await this.auth.updateProfile(profile);
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
