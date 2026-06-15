import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="brand">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <h1>SunuDëkk</h1>
        </div>
        <p class="subtitle">Espace d'administration</p>

        <form *ngIf="!show2FA()" (submit)="onSubmit($event)">
          <div class="form-group">
            <label>Adresse email</label>
            <div class="input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <input type="email" [(ngModel)]="email" name="email" placeholder="agent@collectivite.sn" required>
            </div>
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label>Mot de passe</label>
              <a routerLink="/forgot-password" style="font-size: 0.75rem; color: #2563eb; text-decoration: none; margin-bottom: 0.5rem;">Oublié ?</a>
            </div>
            <div class="input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required>
            </div>
          </div>
          
          <button type="submit" [disabled]="loading()" class="btn-login">
            <span *ngIf="!loading()">Se connecter</span>
            <svg *ngIf="loading()" class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
          </button>
        </form>

        <div *ngIf="show2FA()" class="fade-in">
          <div style="text-align: center; margin-bottom: 2rem;">
            <div style="width: 60px; height: 60px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #2563eb;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700;">Vérification 2FA</h2>
            <p style="color: #64748b; font-size: 0.875rem;">Entrez le code généré par votre application.</p>
          </div>

          <div class="form-group">
            <label>Code de vérification</label>
            <input type="text" [(ngModel)]="otpCode" name="otpCode" placeholder="000000" maxlength="6" style="text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; padding-left: 1rem;" (keyup.enter)="onVerify2FA()">
          </div>

          <button (click)="onVerify2FA()" [disabled]="loading() || otpCode.length < 6" class="btn-login">
            <span *ngIf="!loading()">Vérifier et se connecter</span>
          </button>

          <button (click)="show2FA.set(false)" style="width: 100%; margin-top: 1rem; border: none; background: none; color: #64748b; font-size: 0.875rem; cursor: pointer;">Retour au login</button>
        </div>
          
        <p class="error" *ngIf="error()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {{ error() }}
        </p>
        
        <div class="login-footer">
          <p>Le portail citoyen est disponible sur mobile.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f8fafc;
      color: #1e293b;
    }
    .login-card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      width: 100%;
      max-width: 440px;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .logo-svg { color: #2563eb; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; font-size: 0.875rem; margin-bottom: 2.5rem; text-align: center; }
    
    .form-group { text-align: left; margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.5rem; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.025em; }
    
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.875rem; color: #94a3b8; }
    input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s ease;
    }
    input:focus { border-color: #2563eb; }

    .btn-login {
      width: 100%;
      padding: 0.75rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      margin-top: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: background 0.15s ease;
    }
    .btn-login:hover { background: #1d4ed8; }
    .btn-login:disabled { background: #94a3b8; cursor: not-allowed; }

    .error { 
      color: #dc2626; 
      margin-top: 1.25rem; 
      font-size: 0.8125rem; 
      display: flex; 
      align-items: center; 
      gap: 0.5rem; 
      background: #fef2f2;
      padding: 0.625rem;
      border-radius: 6px;
    }

    .login-footer {
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #f1f5f9;
      text-align: center;
    }
    .login-footer p { font-size: 0.8125rem; color: #94a3b8; margin: 0; }

    .spinner { animation: rotate 2s linear infinite; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class LoginComponent {
  loading = signal(false);
  error = signal<string | null>(null);
  show2FA = signal(false);

  email = '';
  password = '';
  otpCode = '';
  userIdFor2FA: number | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.email, this.password).subscribe({
      next: (res: any) => {
        if (res.two_factor_required) {
          this.show2FA.set(true);
          this.userIdFor2FA = res.user_id;
          this.loading.set(false);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Identifiants invalides ou accès refusé');
        this.loading.set(false);
      }
    });
  }

  onVerify2FA() {
    if (this.otpCode.length < 6 || !this.userIdFor2FA) return;
    this.loading.set(true);
    this.error.set(null);

    this.authService.verify2FA(this.userIdFor2FA, this.otpCode).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Code invalide');
        this.loading.set(false);
      }
    });
  }
}
