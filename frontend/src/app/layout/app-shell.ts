import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Sign } from '../service/sign';

interface NavItem {
  label: string;
  path: string;
}

/** Authenticated layout: top navbar + routed page. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  private readonly auth = inject(Sign);
  private readonly router = inject(Router);

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Spendings', path: '/spendings' },
    { label: 'Goals & Wishlist', path: '/goals' },
  ];

  protected readonly user = this.auth.currentUser;
  protected readonly initials = computed(() => {
    const user = this.user();
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  });

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/auth');
  }
}
