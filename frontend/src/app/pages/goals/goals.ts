import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Goal, Priority, formatMoney } from '../../core/finance';
import { FinanceService } from '../../core/finance.service';

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

@Component({
  selector: 'app-goals',
  imports: [ReactiveFormsModule],
  templateUrl: './goals.html',
  styleUrl: './goals.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Goals {
  private readonly finance = inject(FinanceService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly money = formatMoney;
  protected readonly goals = this.finance.goals;

  /** Items still to buy first (by priority), bought ones last. */
  protected readonly wishlist = computed(() =>
    [...this.finance.wishlist()].sort(
      (a, b) => Number(a.bought) - Number(b.bought) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    ),
  );

  protected readonly totalSaved = computed(() => this.goals().reduce((acc, g) => acc + g.saved, 0));
  protected readonly totalTarget = computed(() => this.goals().reduce((acc, g) => acc + g.target, 0));
  protected readonly wishlistLeft = computed(() =>
    this.finance.wishlist().filter((w) => !w.bought).reduce((acc, w) => acc + w.price, 0),
  );

  protected readonly showGoalForm = signal(false);
  protected readonly showWishForm = signal(false);
  /** Amount typed in each goal's "add money" input, by goal id. */
  protected readonly contributions = signal<Record<string, number>>({});

  protected readonly goalForm = this.fb.group({
    name: ['', Validators.required],
    target: [0, [Validators.required, Validators.min(1)]],
    saved: [0, [Validators.min(0)]],
    deadline: [''],
  });

  protected readonly wishForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(1)]],
    priority: ['medium' as Priority],
  });

  protected percent(goal: Goal): number {
    return goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
  }

  protected deadlineLabel(goal: Goal): string {
    if (!goal.deadline) return 'No deadline';
    const deadline = new Date(goal.deadline + 'T00:00:00');
    const months = Math.max(
      0,
      (deadline.getFullYear() - new Date().getFullYear()) * 12 + deadline.getMonth() - new Date().getMonth(),
    );
    const date = deadline.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const left = goal.target - goal.saved;
    if (left <= 0 || months === 0) return `By ${date}`;
    return `By ${date} · ${formatMoney(Math.ceil(left / months))}/mo needed`;
  }

  protected setContribution(id: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.contributions.update((c) => ({ ...c, [id]: value }));
  }

  protected contribute(goal: Goal, sign: 1 | -1): void {
    const amount = this.contributions()[goal.id] ?? 0;
    if (amount <= 0) return;
    this.finance.contribute(goal.id, sign * amount);
    this.contributions.update((c) => ({ ...c, [goal.id]: 0 }));
  }

  protected removeGoal(id: string): void {
    this.finance.removeGoal(id);
  }

  protected addGoal(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }
    const { name, target, saved, deadline } = this.goalForm.getRawValue();
    this.finance.addGoal({
      name: name.trim(),
      target: Number(target),
      saved: Math.min(Number(target), Number(saved)),
      deadline: deadline || null,
    });
    this.goalForm.reset();
    this.showGoalForm.set(false);
  }

  protected addWish(): void {
    if (this.wishForm.invalid) {
      this.wishForm.markAllAsTouched();
      return;
    }
    const { name, price, priority } = this.wishForm.getRawValue();
    this.finance.addWish({ name: name.trim(), price: Number(price), priority });
    this.wishForm.reset();
    this.showWishForm.set(false);
  }

  protected toggleBought(id: string): void {
    this.finance.toggleBought(id);
  }

  protected removeWish(id: string): void {
    this.finance.removeWish(id);
  }
}
