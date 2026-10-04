import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { UserProfile } from '../../core/user';
import { ProfileForm } from '../../shared/profile-form/profile-form';

@Component({
  selector: 'app-profile',
  imports: [ProfileForm],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.currentUser;
  protected readonly profile = computed<UserProfile | null>(() => {
    const user = this.user();
    return user
      ? {
          profession: user.profession,
          maritalStatus: user.maritalStatus,
          kids: user.kids,
          birthday: user.birthday,
          salary: user.salary,
        }
      : null;
  });

  protected readonly pending = signal(false);
  protected readonly saved = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected async save(profile: UserProfile): Promise<void> {
    this.pending.set(true);
    this.saved.set(false);
    this.formError.set(null);
    try {
      await this.auth.updateProfile(profile);
      this.saved.set(true);
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Could not save your profile.');
    } finally {
      this.pending.set(false);
    }
  }
}
