export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Other',
];

export interface Expense {
  id: number | string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO date string, e.g. "2026-08-10"
  note?: string;
}
