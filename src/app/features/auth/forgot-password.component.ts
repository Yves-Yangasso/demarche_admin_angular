import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="brand">
           <h1>CivicTrack</h1>
        </div>
        
        <div *ngIf="!sent()">
          <h2>Mot de passe oublié ?</h2>
          <p class="subtitle">Entrez votre email pour recevoir un lien de réinitialisation.</p>

          <form (submit)="onSubmit()">
            <div class="form-group">
              <label>Adresse email</label>
              <input type="email" [(ngModel)]="email" name="email" placeholder="votre@email.com" required class="form-control">
            </div>
            
            <button type="submit" [disabled]="loading() || !email" class="btn-primary">
              {{ loading() ? 'Envoi...' : 'Envoyer le lien' }}
            </button>
          </form>
        </div>

        <div *ngIf="sent()" class="fade-in">
           <div class="success-icon">✓</div>
           <h2>Email envoyé</h2>
           <p class="subtitle">Si un compte est associé à <strong>{{ email }}</strong>, vous recevrez un lien d'ici quelques instants.</p>
           <a routerLink="/login" class="btn-secondary">Retour à la connexion</a>
        </div>

        <div class="auth-footer">
           <a routerLink="/login">Retour à la connexion</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; }
    .auth-card { background: white; padding: 2.5rem; border-radius: 12px; border: 1px solid #e2e8f0; width: 100%; max-width: 400px; text-align: center; }
    h1 { color: #2563eb; font-size: 1.5rem; margin-bottom: 2rem; }
    h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    .subtitle { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
    .form-group { text-align: left; margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; }
    .btn-primary { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-secondary { display: block; width: 100%; padding: 0.75rem; background: #f1f5f9; color: #475569; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 1rem; }
    .auth-footer { margin-top: 2rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
    .auth-footer a { font-size: 0.875rem; color: #2563eb; text-decoration: none; }
    .success-icon { width: 60px; height: 60px; background: #f0fdf4; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 1.5rem; }
  `]
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  email = '';
  loading = signal(false);
  sent = signal(false);

  onSubmit() {
    this.loading.set(true);
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.loading.set(false);
        // On montre quand même le message de succès par sécurité (anti-énumération)
        this.sent.set(true);
      }
    });
  }
}
