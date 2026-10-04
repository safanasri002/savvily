export type TransactionType = 'expense' | 'income';

export type Category =
  | 'housing'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'health'
  | 'leisure'
  | 'bills'
  | 'salary'
  | 'other';

export const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'housing', label: 'Housing', color: '#6366f1' },
  { value: 'food', label: 'Food & groceries', color: '#f59e0b' },
  { value: 'transport', label: 'Transport', color: '#0ea5e9' },
  { value: 'shopping', label: 'Shopping', color: '#ec4899' },
  { value: 'health', label: 'Health', color: '#10b981' },
  { value: 'leisure', label: 'Leisure', color: '#8b5cf6' },
  { value: 'bills', label: 'Bills & subscriptions', color: '#ef4444' },
  { value: 'salary', label: 'Salary', color: '#22c55e' },
  { value: 'other', label: 'Other', color: '#94a3b8' },
];

export function categoryInfo(category: Category) {
  return CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[CATEGORIES.length - 1];
}

export interface Transaction {
  id: string;
  label: string;
  category: Category;
  type: TransactionType;
  amount: number;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  /** ISO date, `YYYY-MM-DD`, or null when open-ended. */
  deadline: string | null;
}

export type Priority = 'high' | 'medium' | 'low';

export interface WishItem {
  id: string;
  name: string;
  price: number;
  priority: Priority;
  bought: boolean;
}

export interface FinanceData {
  transactions: Transaction[];
  goals: Goal[];
  wishlist: WishItem[];
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return currency.format(amount);
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const EMPTY_FINANCE_DATA: FinanceData = { transactions: [], goals: [], wishlist: [] };
