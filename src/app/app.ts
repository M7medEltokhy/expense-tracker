import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { ExpenseService } from './services/expense.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ExpenseFormComponent, ExpenseListComponent, ChatbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  expenseService = inject(ExpenseService);

  ngOnInit(): void {
    this.expenseService.loadExpenses();
  }
}
