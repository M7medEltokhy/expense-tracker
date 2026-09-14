import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Expense } from '../models/expense.model';

const API_URL = 'http://localhost:3000/expenses';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);

  expenses = signal<Expense[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  /** all-time total across every expense, regardless of any list filters */
  total = computed(() => this.expenses().reduce((sum, e) => sum + e.amount, 0));

  /** id of the expense currently loaded into the form for editing, or null */
  editingId = signal<number | string | null>(null);

  loadExpenses(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Expense[]>(API_URL).subscribe({
      next: (data) => {
        // don't coerce id type here - newer json-server versions generate
        // alphanumeric string ids (e.g. "k3j8f2"), Number(...) on those is NaN.
        // Just keep whatever type json-server gave us.
        this.expenses.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          'Could not load expenses. Make sure json-server is running on http://localhost:3000'
        );
        this.loading.set(false);
      },
    });
  }

  addExpense(expense: Omit<Expense, 'id'>): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.post<Expense>(API_URL, expense).subscribe({
      next: () => this.loadExpenses(),
      error: () => {
        this.error.set('Could not add the expense. Please try again.');
        this.loading.set(false);
      },
    });
  }

  updateExpense(id: number | string, expense: Omit<Expense, 'id'>): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.put<Expense>(`${API_URL}/${id}`, expense).subscribe({
      next: () => this.loadExpenses(),
      error: () => {
        this.error.set('Could not update the expense. Please try again.');
        this.loading.set(false);
      },
    });
  }

  deleteExpense(id: number | string): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.delete(`${API_URL}/${id}`).subscribe({
      next: () => this.loadExpenses(),
      error: () => {
        this.error.set('Could not delete the expense. Please try again.');
        this.loading.set(false);
      },
    });
  }

  startEdit(id: number | string): void {
    this.editingId.set(id);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }
}
