import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-wrapper" [class.open]="isOpen()">
      <button class="chat-toggle" (click)="toggle()">
        <svg *ngIf="!isOpen()" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <svg *ngIf="isOpen()" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div class="chat-window card" *ngIf="isOpen()">
        <div class="chat-header">
          <h3>Assistant IA {{ isAdmin() ? 'Admin' : 'Citoyen' }}</h3>
          <p>Propulsé par Groq</p>
        </div>

        <div class="chat-messages" #scrollMe [scrollTop]="scrollMe.scrollHeight">
          <div class="message" *ngFor="let m of messages()" [class.bot]="m.role === 'bot'" [class.user]="m.role === 'user'">
            <div class="msg-bubble">{{ m.text }}</div>
          </div>
          <div class="message bot loading" *ngIf="isTyping()">
            <div class="msg-bubble">...</div>
          </div>
        </div>

        <div class="chat-input">
          <input type="text" [(ngModel)]="userInput" (keyup.enter)="send()" placeholder="Posez votre question...">
          <button (click)="send()" [disabled]="!userInput.trim() || isTyping()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-wrapper { position: fixed; bottom: 2rem; right: 2rem; z-index: 1000; }
    .chat-toggle { width: 56px; height: 56px; border-radius: 50%; background: var(--primary-color); color: white; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
    .chat-toggle:hover { transform: scale(1.05); }

    .chat-window { position: absolute; bottom: 4.5rem; right: 0; width: 350px; height: 500px; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
    .chat-header { padding: 1rem; background: var(--primary-color); color: white; border-radius: 12px 12px 0 0; }
    .chat-header h3 { margin: 0; font-size: 1rem; }
    .chat-header p { margin: 0.25rem 0 0; font-size: 0.75rem; opacity: 0.8; }

    .chat-messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; background: #f8fafc; }
    .message { max-width: 85%; }
    .message.user { align-self: flex-end; }
    .message.bot { align-self: flex-start; }
    .msg-bubble { padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.875rem; line-height: 1.4; }
    .user .msg-bubble { background: var(--primary-color); color: white; border-bottom-right-radius: 2px; }
    .bot .msg-bubble { background: white; color: #1e293b; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; }

    .chat-input { padding: 1rem; display: flex; gap: 0.5rem; border-top: 1px solid #e2e8f0; background: white; border-radius: 0 0 12px 12px; }
    .chat-input input { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.75rem; outline: none; }
    .chat-input button { background: none; border: none; color: var(--primary-color); cursor: pointer; }
    .chat-input button:disabled { opacity: 0.3; }
  `]
})
export class AiChatComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  isOpen = signal(false);
  isTyping = signal(false);
  messages = signal<{role: 'user' | 'bot', text: string}[]>([
    {role: 'bot', text: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?'}
  ]);
  userInput = '';

  isAdmin() {
    const user = this.auth.user();
    return user?.role === 'admin' || user?.role === 'agent';
  }

  toggle() { this.isOpen.set(!this.isOpen()); }

  send() {
    if (!this.userInput.trim()) return;
    
    const text = this.userInput;
    this.messages.update(m => [...m, {role: 'user', text}]);
    this.userInput = '';
    this.isTyping.set(true);

    const endpoint = this.isAdmin() ? '/api/ia/chat-admin' : '/api/ia/chat-citoyen';
    this.http.post<any>(endpoint, { query: text }).subscribe({
      next: (res) => {
        this.messages.update(m => [...m, {role: 'bot', text: res.reponse}]);
        this.isTyping.set(false);
      },
      error: () => {
        this.messages.update(m => [...m, {role: 'bot', text: 'Désolé, une erreur est survenue.'}]);
        this.isTyping.set(false);
      }
    });
  }
}
