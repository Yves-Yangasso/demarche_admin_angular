import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ia-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="chat-page-container">
        <div class="chat-sidebar">
          <div class="sidebar-header">
            <h2>Assistant IA</h2>
            <p>Historique des sessions</p>
          </div>
          <div class="history-list">
            <div class="history-item active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>Session actuelle</span>
            </div>
            <div class="history-item empty">
              <p>Aucun historique récent</p>
            </div>
          </div>
          <button class="new-chat-btn" (click)="resetChat()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle discussion
          </button>
        </div>

        <div class="chat-main">
          <div class="chat-header">
            <div class="bot-info">
              <div class="bot-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div>
                <h3>SunuDëkk GPT</h3>
                <span class="status">En ligne</span>
              </div>
            </div>
          </div>

          <div class="chat-messages" #scrollContainer [scrollTop]="scrollContainer.scrollHeight">
            <div class="message-wrapper" *ngFor="let m of messages()" [class.user]="m.role === 'user'">
              <div class="avatar" *ngIf="m.role === 'bot'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/></svg>
              </div>
              <div class="msg-bubble shadow-sm">
                {{ m.text }}
              </div>
            </div>
            <div class="message-wrapper bot" *ngIf="isTyping()">
              <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/></svg>
              </div>
              <div class="msg-bubble typing">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          </div>

          <div class="chat-input-area">
            <div class="input-container">
              <textarea 
                [(ngModel)]="userInput" 
                (keydown.enter)="$event.preventDefault(); send()" 
                placeholder="Posez une question sur les dossiers, demandez un rapport ou effectuez une recherche..."
                rows="1"
              ></textarea>
              <button class="send-btn" (click)="send()" [disabled]="!userInput.trim() || isTyping()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <p class="disclaimer">L'IA peut faire des erreurs. Vérifiez les informations importantes.</p>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .chat-page-container { 
      display: grid; 
      grid-template-columns: 280px 1fr; 
      height: calc(100vh - 120px); 
      background: white; 
      border-radius: 16px; 
      border: 1px solid #e2e8f0; 
      overflow: hidden; 
    }

    .chat-sidebar { 
      background: #f8fafc; 
      border-right: 1px solid #e2e8f0; 
      display: flex; 
      flex-direction: column; 
      padding: 1.5rem; 
    }
    .sidebar-header h2 { font-size: 1.25rem; margin: 0; color: #0f172a; }
    .sidebar-header p { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
    
    .history-list { flex: 1; margin-top: 2rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .history-item { 
      display: flex; 
      align-items: center; 
      gap: 0.75rem; 
      padding: 0.75rem; 
      border-radius: 8px; 
      font-size: 0.875rem; 
      color: #475569; 
      cursor: pointer;
      transition: background 0.2s;
    }
    .history-item:hover { background: #f1f5f9; }
    .history-item.active { background: #eff6ff; color: #2563eb; font-weight: 500; }
    .history-item.empty { cursor: default; padding: 1rem; text-align: center; color: #94a3b8; }
    .history-item.empty:hover { background: none; }

    .new-chat-btn { 
      margin-top: auto; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 0.5rem; 
      padding: 0.75rem; 
      background: #2563eb; 
      color: white; 
      border: none; 
      border-radius: 8px; 
      font-weight: 600; 
      cursor: pointer; 
      transition: background 0.2s;
    }
    .new-chat-btn:hover { background: #1d4ed8; }

    .chat-main { display: flex; flex-direction: column; background: white; }
    .chat-header { 
      padding: 1rem 2rem; 
      border-bottom: 1px solid #f1f5f9; 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
    }
    .bot-info { display: flex; align-items: center; gap: 1rem; }
    .bot-avatar { 
      width: 40px; height: 40px; background: #f5f3ff; color: #8b5cf6; 
      border-radius: 10px; display: flex; align-items: center; justify-content: center; 
    }
    .bot-info h3 { margin: 0; font-size: 1rem; color: #0f172a; }
    .status { font-size: 0.75rem; color: #10b981; display: flex; align-items: center; gap: 0.25rem; }
    .status::before { content: ''; width: 6px; height: 6px; background: #10b981; border-radius: 50%; }

    .chat-messages { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; background: #ffffff; }
    .message-wrapper { display: flex; gap: 1rem; max-width: 80%; }
    .message-wrapper.user { align-self: flex-end; flex-direction: row-reverse; }
    .avatar { width: 32px; height: 32px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; }
    
    .msg-bubble { 
      padding: 1rem 1.25rem; border-radius: 12px; font-size: 0.9375rem; line-height: 1.5; color: #334155; 
      background: #f8fafc; border: 1px solid #f1f5f9;
    }
    .user .msg-bubble { background: #2563eb; color: white; border: none; }

    .typing span { animation: blink 1.4s infinite both; }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }

    .chat-input-area { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; }
    .input-container { 
      display: flex; gap: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; 
      border-radius: 12px; padding: 0.75rem; transition: border-color 0.2s;
    }
    .input-container:focus-within { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
    textarea { flex: 1; background: none; border: none; outline: none; padding: 0.5rem; font-size: 0.9375rem; resize: none; font-family: inherit; }
    .send-btn { 
      width: 40px; height: 40px; border-radius: 8px; background: #2563eb; color: white; 
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; 
      transition: background 0.2s;
    }
    .send-btn:hover { background: #1d4ed8; }
    .send-btn:disabled { opacity: 0.5; background: #94a3b8; }
    .disclaimer { text-align: center; font-size: 0.75rem; color: #94a3b8; margin-top: 0.75rem; }
  `]
})
export class IaChatPageComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  isTyping = signal(false);
  messages = signal<{role: 'user' | 'bot', text: string}[]>([
    {role: 'bot', text: 'Bonjour ! Je suis l\'assistant intelligent de SunuDëkk. Je suis là pour vous aider dans vos rapports, vos recherches de dossiers et vos tâches quotidiennes. Comment puis-je vous assister ?'}
  ]);
  userInput = '';

  isAdmin() {
    const user = this.auth.user();
    return user?.role === 'admin' || user?.role === 'agent';
  }

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
        this.messages.update(m => [...m, {role: 'bot', text: 'Désolé, une erreur est survenue lors de la communication avec l\'assistant.'}]);
        this.isTyping.set(false);
      }
    });
  }

  resetChat() {
    this.messages.set([
      {role: 'bot', text: 'Nouvelle session démarrée. En quoi puis-je vous être utile ?'}
    ]);
  }
}
