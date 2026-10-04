import { Injectable, computed, inject, linkedSignal } from '@angular/core';
import { AuthService } from './auth.service';
import { EMPTY_FINANCE_DATA, FinanceData, Goal, Transaction, WishItem } from './finance';
import { readJson, writeJson } from './storage';

const FINANCE_KEY_PREFIX = 'savvily.finance.';

/**
 * Spendings, goals and wishlist of the signed-in user.
 * Static front: starts empty and is persisted in localStorage, one entry per user.
 */
@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly auth = inject(AuthService);
  private readonly userId = computed(() => this.auth.currentUser()?.id ?? null);

  /** Reloads whenever the signed-in user changes. */
  private readonly data = linkedSignal<FinanceData>(() => {
    const id = this.userId();
    return (id && readJson<FinanceData>(FINANCE_KEY_PREFIX + id)) || EMPTY_FINANCE_DATA;
  });

  /** Newest first. */
  readonly transactions = computed(() =>
    [...this.data().transactions].sort((a, b) => b.date.localeCompare(a.date)),
  );
  readonly goals = computed(() => this.data().goals);
  readonly wishlist = computed(() => this.data().wishlist);

  addTransaction(transaction: Omit<Transaction, 'id'>): void {
    this.update((d) => ({
      ...d,
      transactions: [...d.transactions, { ...transaction, id: crypto.randomUUID() }],
    }));
  }

  removeTransaction(id: string): void {
    this.update((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
  }

  addGoal(goal: Omit<Goal, 'id'>): void {
    this.update((d) => ({ ...d, goals: [...d.goals, { ...goal, id: crypto.randomUUID() }] }));
  }

  /** Adds (or, with a negative amount, withdraws) money from a goal, clamped to [0, target]. */
  contribute(id: string, amount: number): void {
    this.update((d) => ({
      ...d,
      goals: d.goals.map((g) =>
        g.id === id ? { ...g, saved: Math.min(g.target, Math.max(0, g.saved + amount)) } : g,
      ),
    }));
  }

  removeGoal(id: string): void {
    this.update((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }

  addWish(item: Omit<WishItem, 'id' | 'bought'>): void {
    this.update((d) => ({
      ...d,
      wishlist: [...d.wishlist, { ...item, id: crypto.randomUUID(), bought: false }],
    }));
  }

  toggleBought(id: string): void {
    this.update((d) => ({
      ...d,
      wishlist: d.wishlist.map((w) => (w.id === id ? { ...w, bought: !w.bought } : w)),
    }));
  }

  removeWish(id: string): void {
    this.update((d) => ({ ...d, wishlist: d.wishlist.filter((w) => w.id !== id) }));
  }

  private update(fn: (data: FinanceData) => FinanceData): void {
    this.data.update(fn);
    const id = this.userId();
    if (id) writeJson(FINANCE_KEY_PREFIX + id, this.data());
  }
}
