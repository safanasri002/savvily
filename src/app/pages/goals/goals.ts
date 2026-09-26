import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-goals',
  template: `
    <header class="page-header">
      <h1 class="page-title">Goals &amp; Wishlist</h1>
      <p class="page-subtitle">Set savings goals and plan the products you want to buy.</p>
    </header>

    <div class="empty-state">
      <p class="empty-state-title">No goals yet</p>
      <p class="empty-state-text">Your savings goals and desired products will appear here.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Goals {}
