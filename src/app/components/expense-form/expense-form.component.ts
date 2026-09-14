import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../../models/expense.model';

/** custom validator: rejects any date later than today */
function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selected = new Date(control.value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return selected > today ? { futureDate: true } : null;
}

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.css',
})
export class ExpenseFormComponent {
  private fb = inject(FormBuilder);
  expenseService = inject(ExpenseService);

  categories = EXPENSE_CATEGORIES;

  form = this.fb.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    category: this.fb.control<ExpenseCategory | null>(null, Validators.required),
    date: this.fb.control<string | null>(null, [Validators.required, notFutureDateValidator]),
    note: this.fb.control<string>('', Validators.maxLength(200)),
  });

  constructor() {
    // whenever editingId changes to a real id, load that expense into the form
    effect(() => {
      const id = this.expenseService.editingId();
      if (id !== null) {
        const expense = this.expenseService.expenses().find((e) => e.id === id);
        if (expense) {
          this.form.patchValue({
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            note: expense.note ?? '',
          });
        }
      }
    });
  }

  get isEditing(): boolean {
    return this.expenseService.editingId() !== null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      amount: Number(value.amount),
      category: value.category as ExpenseCategory,
      date: value.date as string,
      note: value.note?.trim() ? value.note.trim() : undefined,
    };

    const editingId = this.expenseService.editingId();
    if (editingId !== null) {
      this.expenseService.updateExpense(editingId, payload);
      this.expenseService.cancelEdit();
    } else {
      this.expenseService.addExpense(payload);
    }
    this.form.reset();
  }

  cancelEdit(): void {
    this.expenseService.cancelEdit();
    this.form.reset();
  }
}
