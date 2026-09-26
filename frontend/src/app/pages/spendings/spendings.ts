import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spendings',
  template: `
    <header class="page-header">
      <h1 class="page-title">Spendings</h1>
      <p class="page-subtitle">Track where your money goes, by category and date.</p>
    </header>

    <div class="empty-state">
      <p class="empty-state-title">No spendings yet</p>
      <p class="empty-state-text">Your expenses and income will be listed here.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spendings {}
