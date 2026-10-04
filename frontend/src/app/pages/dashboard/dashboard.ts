import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CATEGORIES, categoryInfo, formatMoney, isoDate } from '../../core/finance';
import { FinanceService } from '../../core/finance.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
  private readonly finance = inject(FinanceService);

  protected readonly money = formatMoney;
  protected readonly category = categoryInfo;

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  protected readonly monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  private readonly thisMonth = computed(() => {
    const prefix = isoDate(new Date()).slice(0, 7);
    return this.finance.transactions().filter((t) => t.date.startsWith(prefix));
  });

  protected readonly income = computed(() => sum(this.thisMonth().filter((t) => t.type === 'income')));
  protected readonly expenses = computed(() => sum(this.thisMonth().filter((t) => t.type === 'expense')));
  protected readonly balance = computed(() => this.income() - this.expenses());
  protected readonly savingsRate = computed(() => {
    const income = this.income();
    return income > 0 ? Math.round((this.balance() / income) * 100) : 0;
  });

  protected readonly totalSaved = computed(() => this.finance.goals().reduce((acc, g) => acc + g.saved, 0));

  /** Expense totals per category for this month, largest first. */
  protected readonly byCategory = computed(() => {
    const expenses = this.thisMonth().filter((t) => t.type === 'expense');
    const total = sum(expenses);
    return CATEGORIES.map((c) => {
      const amount = sum(expenses.filter((t) => t.category === c.value));
      return { ...c, amount, share: total > 0 ? (amount / total) * 100 : 0 };
    })
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  });

  protected readonly recent = computed(() => this.finance.transactions().slice(0, 6));
  protected readonly goals = computed(() => this.finance.goals().slice(0, 3));

  protected percent(saved: number, target: number): number {
    return target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  }

  protected shortDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function sum(items: { amount: number }[]): number {
  return items.reduce((acc, t) => acc + t.amount, 0);
}
