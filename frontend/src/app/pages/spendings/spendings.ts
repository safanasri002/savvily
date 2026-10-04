import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CATEGORIES,
  Category,
  TransactionType,
  categoryInfo,
  formatMoney,
  isoDate,
} from '../../core/finance';
import { FinanceService } from '../../core/finance.service';

type TypeFilter = 'all' | TransactionType;

@Component({
  selector: 'app-spendings',
  imports: [ReactiveFormsModule],
  templateUrl: './spendings.html',
  styleUrl: './spendings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spendings {
  private readonly finance = inject(FinanceService);

  protected readonly categories = CATEGORIES;
  protected readonly money = formatMoney;
  protected readonly category = categoryInfo;

  protected readonly showForm = signal(false);
  protected readonly attempted = signal(false);

  protected readonly search = signal('');
  protected readonly typeFilter = signal<TypeFilter>('all');
  protected readonly categoryFilter = signal<Category | 'all'>('all');
  protected readonly monthFilter = signal<string>('all');

  protected readonly form = inject(NonNullableFormBuilder).group({
    label: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: ['expense' as TransactionType],
    category: ['food' as Category, Validators.required],
    date: [isoDate(new Date()), Validators.required],
  });

  /** Months that have transactions, newest first, as `YYYY-MM`. */
  protected readonly months = computed(() => {
    const keys = new Set(this.finance.transactions().map((t) => t.date.slice(0, 7)));
    return [...keys].sort().reverse().map((value) => ({
      value,
      label: new Date(value + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }));
  });

  protected readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    const category = this.categoryFilter();
    const month = this.monthFilter();
    return this.finance.transactions().filter(
      (t) =>
        (type === 'all' || t.type === type) &&
        (category === 'all' || t.category === category) &&
        (month === 'all' || t.date.startsWith(month)) &&
        (!query || t.label.toLowerCase().includes(query)),
    );
  });

  protected readonly totalIncome = computed(() =>
    this.filtered().filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
  );
  protected readonly totalExpenses = computed(() =>
    this.filtered().filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
  );

  protected hasError(name: 'label' | 'amount' | 'date'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.attempted());
  }

  protected setType(type: TransactionType): void {
    this.form.patchValue({ type, category: type === 'income' ? 'salary' : 'food' });
  }

  protected add(): void {
    this.attempted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.finance.addTransaction({ ...value, label: value.label.trim(), amount: Number(value.amount) });
    this.form.reset();
    this.attempted.set(false);
    this.showForm.set(false);
  }

  protected remove(id: string): void {
    this.finance.removeTransaction(id);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.typeFilter.set('all');
    this.categoryFilter.set('all');
    this.monthFilter.set('all');
  }

  protected formatDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  protected valueOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
