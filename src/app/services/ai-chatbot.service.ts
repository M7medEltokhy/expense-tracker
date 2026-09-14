import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Expense, ExpenseCategory } from '../models/expense.model';

export interface ExpenseSummary {
  expenseCount: number;
  totalSpending: number;
  byCategory: Partial<Record<ExpenseCategory, number>>;
  largestExpense: Expense | null;
  smallestExpense: Expense | null;
  dateRange: { earliest: string; latest: string } | null;
  /** the 10 most recent expenses, newest first - keeps the payload small
   *  while still giving the agent something concrete for "recent spending" */
  recentExpenses: Expense[];
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  /** raw list, in case the agent needs to look at an individual expense */
  expenses: Expense[];
  /** pre-computed aggregates so the agent doesn't have to (and can't get
   *  wrong) do its own arithmetic over the raw list */
  summary: ExpenseSummary;
}

export interface ChatResponse {
  reply: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class AiChatbotService {
  private http = inject(HttpClient);

  // one session id per browser session, sent with every message so the n8n
  // workflow can keep track of conversational context if it wants to
  private sessionId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  sendMessage(message: string, expenses: Expense[]): void {
    const trimmed = message.trim();
    if (!trimmed) return;

    this.messages.update((msgs) => [...msgs, { role: 'user', text: trimmed }]);
    this.loading.set(true);
    this.error.set(null);

    const body: ChatRequest = {
      message: trimmed,
      sessionId: this.sessionId,
      expenses,
      summary: this.buildSummary(expenses),
    };

    this.http
      .post<ChatResponse>(environment.aiAgentWebhookUrl, body)
      .pipe(
        catchError(() => {
          this.error.set(
            'The AI assistant is unavailable right now. Make sure the n8n workflow is running and the webhook URL is correct.'
          );
          this.loading.set(false);
          return of(null);
        })
      )
      .subscribe((response) => {
        this.loading.set(false);
        if (response?.reply) {
          this.messages.update((msgs) => [...msgs, { role: 'ai', text: response.reply }]);
        } else if (!this.error()) {
          this.error.set('No response received from the AI assistant.');
        }
      });
  }

  /** computes reliable aggregates locally so the AI Agent grounds its
   *  answers in exact numbers instead of doing (and possibly getting wrong)
   *  its own arithmetic over a raw list */
  private buildSummary(expenses: Expense[]): ExpenseSummary {
    if (expenses.length === 0) {
      return {
        expenseCount: 0,
        totalSpending: 0,
        byCategory: {},
        largestExpense: null,
        smallestExpense: null,
        dateRange: null,
        recentExpenses: [],
      };
    }

    const byCategory: Partial<Record<ExpenseCategory, number>> = {};
    let total = 0;
    let largest = expenses[0];
    let smallest = expenses[0];

    for (const e of expenses) {
      total += e.amount;
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
      if (e.amount > largest.amount) largest = e;
      if (e.amount < smallest.amount) smallest = e;
    }

    const sortedByDate = [...expenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      expenseCount: expenses.length,
      totalSpending: Math.round(total * 100) / 100,
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([k, v]) => [k, Math.round((v as number) * 100) / 100])
      ) as Partial<Record<ExpenseCategory, number>>,
      largestExpense: largest,
      smallestExpense: smallest,
      dateRange: {
        earliest: sortedByDate[0].date,
        latest: sortedByDate[sortedByDate.length - 1].date,
      },
      recentExpenses: [...sortedByDate].reverse().slice(0, 10),
    };
  }
}
