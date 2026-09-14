import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatbotService } from '../../services/ai-chatbot.service';
import { ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
})
export class ChatbotComponent {
  chatService = inject(AiChatbotService);
  private expenseService = inject(ExpenseService);

  draft = signal('');

  send(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.chatService.sendMessage(text, this.expenseService.expenses());
    this.draft.set('');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}
