import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../../services/expense.service';
import { CategoryIconPipe } from '../../pipes/category-icon.pipe';
import { HighlightOverBudgetDirective } from '../../directives/highlight-over-budget.directive';
import { EXPENSE_CATEGORIES, Expense, ExpenseCategory } from '../../models/expense.model';

type CategoryFilter = 'All' | ExpenseCategory;
type SortBy = 'date' | 'amount';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, CategoryIconPipe, HighlightOverBudgetDirective],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.css',
})
export class ExpenseListComponent {
  expenseService = inject(ExpenseService);

  categories = EXPENSE_CATEGORIES;

  categoryFilter = signal<CategoryFilter>('All');
  search = signal('');
  sortBy = signal<SortBy>('date');
  sortDir = signal<SortDir>('desc');

  // bonus: adjustable over-budget threshold from the UI
  overBudgetThreshold = signal(100);

  filteredExpenses = computed(() => {
    let list = this.expenseService.expenses();

    const cat = this.categoryFilter();
    if (cat !== 'All') {
      list = list.filter((e) => e.category === cat);
    }

    const term = this.search().trim().toLowerCase();
    if (term) {
      list = list.filter((e) => (e.note ?? '').toLowerCase().includes(term));
    }

    const by = this.sortBy();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (by === 'amount') {
        return (a.amount - b.amount) * dir;
      }
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
    });

    return list;
  });

  total = computed(() => this.filteredExpenses().reduce((sum, e) => sum + e.amount, 0));

  // bonus: per-category subtotal for the currently filtered list
  categorySubtotals = computed(() => {
    const totals = new Map<ExpenseCategory, number>();
    for (const e of this.filteredExpenses()) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }
    return totals;
  });

  onCategoryChange(value: string): void {
    this.categoryFilter.set(value as CategoryFilter);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onSortByChange(value: string): void {
    this.sortBy.set(value as SortBy);
  }

  toggleSortDir(): void {
    this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
  }

  onThresholdChange(value: string): void {
    const n = Number(value);
    this.overBudgetThreshold.set(Number.isFinite(n) && n >= 0 ? n : 100);
  }

  edit(expense: Expense): void {
    this.expenseService.startEdit(expense.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(expense: Expense): void {
    const confirmed = confirm(`Delete this ${expense.category} expense of ${expense.amount}?`);
    if (confirmed) {
      this.expenseService.deleteExpense(expense.id);
    }
  }
}
