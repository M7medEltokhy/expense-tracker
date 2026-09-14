# Expense Tracker

A small personal finance app built with **Angular** and a local **json-server**
REST API. It supports full create/edit/delete for expenses, live
filtering/searching/sorting, and a natural-language **AI chatbot** (powered by
an n8n AI Agent workflow) that can answer questions about your spending.

<img width="1919" height="932" alt="Expense Tracker - main view" src="https://github.com/user-attachments/assets/52b0ebd0-81f8-4882-9dc5-5f9e9a4ba4bd" />


---

## Features

### Expense management (CRUD)
- Add an expense with amount, category, date, and an optional note
- Edit any expense — the same form is reused, and switches into "Editing"
  mode with a pre-filled form and a Cancel option
- Delete an expense, with a confirmation prompt first
- All data is persisted through a local REST API (json-server), not just
  in memory

### Reactive form & validation
- Built with Angular's `FormBuilder` / `ReactiveFormsModule`
- **Amount**: required, must be greater than 0
- **Category**: required, one of 6 fixed categories
- **Date**: required, and cannot be a future date (custom validator)
- **Note**: optional, capped at 200 characters
- Submit button is disabled while the form is invalid, with visible error
  messages under each touched, invalid field

### Filter, search & sort
- Filter the list by category
- Search by text within the note field
- Sort by date or amount, ascending or descending
- A running total (and a per-category subtotal breakdown) updates live and
  always reflects the *currently visible/filtered* expenses, not the full
  list
- Empty-state message when no expenses match the current filters

### Custom pipe
- `categoryIcon` — prefixes a category name with an emoji
  (e.g. `Food` → `🍔 Food`)

### Custom directive
- `appHighlightOverBudget` — flags any expense row whose amount exceeds a
  threshold (default 100, adjustable from the UI) with a highlighted
  background and accent border

### AI chatbot
- A standalone chat component (separate from the form and list) with
  message history, a text input, a Send button, and a visible "typing"
  state
- Sends messages to an **n8n Webhook** that triggers an AI Agent workflow
- The agent is given both the raw expense list and a pre-computed summary
  (total spend, per-category totals, largest/smallest expense, date range,
  recent expenses) so it answers with real numbers instead of guessing
- Handles unreachable/erroring webhooks gracefully with an inline error
  message instead of hanging
- Supports natural-language questions like:
  - "What's my total spending?"
  - "How much did I spend by category?"
  - "Which expense was the largest?"
  - "Show my Food expenses" / "What did I spend between Aug 1 and Aug 15?"
  - "Help me understand my recent spending"

<img width="1919" height="886" alt="Expense Tracker - chatbot" src="https://github.com/user-attachments/assets/53d30d49-07fb-478b-9932-8c612d1285d6" />



---

## Tech stack

- Angular 22 (standalone components, signals, new `@if`/`@for` control flow)
- Angular Reactive Forms
- Angular `HttpClient`
- json-server (local REST API for expenses)
- n8n (AI Agent workflow for the chatbot, connected via webhook)

---

## Project structure

```
expense-tracker/
├── db.json                              # json-server data file
├── README.md
└── src/
    ├── styles.css                       # global design tokens, fonts, reset
    ├── environments/
    │   └── environment.ts               # aiAgentWebhookUrl config
    └── app/
        ├── app.ts / app.html / app.css  # root layout
        ├── app.config.ts                # providers (incl. provideHttpClient)
        ├── models/
        │   └── expense.model.ts         # Expense, ExpenseCategory
        ├── services/
        │   ├── expense.service.ts       # CRUD against json-server + signals
        │   └── ai-chatbot.service.ts    # posts to the n8n webhook
        ├── pipes/
        │   └── category-icon.pipe.ts
        ├── directives/
        │   └── highlight-over-budget.directive.ts
        └── components/
            ├── expense-form/            # reactive form, handles add + edit
            ├── expense-list/            # filters, sorting, total, ledger
            └── chatbot/                 # chat UI, independent component
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Angular CLI](https://angular.dev/tools/cli): `npm install -g @angular/cli`
- [json-server](https://github.com/typicode/json-server): `npm install -g json-server`
- An [n8n](https://n8n.io/) instance (cloud or self-hosted) for the chatbot

---

## Step-by-step: run the app

### 1. Install dependencies
```bash
npm install
```

### 2. Start the backend (json-server)
In one terminal, from the project root:
```bash
json-server --watch db.json --port 3000
```
This serves the API at `http://localhost:3000/expenses` with full
GET/POST/PUT/DELETE support, persisted to `db.json`.

> Keep this terminal running the whole time you're working on the app.

### 3. Start the Angular app
In a second terminal:
```bash
ng serve
```
Open `http://localhost:4200` in your browser. You should be able to add,
edit, delete, filter, search, and sort expenses.

---

## Data model

```typescript
export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Other';

export interface Expense {
  id: number | string;
  amount: number;
  category: ExpenseCategory;
  date: string;   // ISO date string, e.g. "2026-08-10"
  note?: string;
}
```

> `id` is typed as `number | string` because different json-server versions
> generate ids differently (some numeric, some alphanumeric strings) — the
> app never assumes one or the other.
