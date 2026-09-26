import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <header class="page-header">
      <h1 class="page-title">{{ greeting() }}, {{ auth.currentUser()?.firstName }}</h1>
      <p class="page-subtitle">Here's an overview of your finances.</p>
    </header>

    @if (!auth.profileComplete()) {
      <aside class="notice">
        <div>
          <p class="notice-title">Finish setting up your profile</p>
          <p class="notice-text">Add your profession and salary so Savvily can tailor your budget.</p>
        </div>
        <a class="btn-secondary" routerLink="/profile">Complete profile</a>
      </aside>
    }

    <div class="empty-state">
      <p class="empty-state-title">No data yet</p>
      <p class="empty-state-text">Your spending chart and recent transactions will appear here.</p>
    </div>
  `,
  styles: `
    .notice {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px 20px;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
    }
    .notice-title { margin: 0; font-weight: 500; }
    .notice-text { margin: 0; color: var(--text-muted); font-size: 13.5px; }
    .notice .btn-secondary { flex-shrink: 0; height: 34px; font-size: 13px; }
    @media (max-width: 560px) {
      .notice { flex-direction: column; align-items: stretch; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly auth = inject(AuthService);

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });
}
