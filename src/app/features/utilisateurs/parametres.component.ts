import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UtilisateurService } from '../../core/services/utilisateur.service';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="header">
        <h1>Paramètres</h1>
        <p class="subtitle">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      <div class="content-grid">
        <section class="card">
          <div class="card-header">
            <h3>Mon Profil</h3>
          </div>
          <div class="profile-form" *ngIf="profile(); else loading">
            <div class="form-group">
              <label>Nom</label>
              <input type="text" [(ngModel)]="profile().nom" placeholder="Votre nom">
            </div>
            <div class="form-group">
              <label>Prénom</label>
              <input type="text" [(ngModel)]="profile().prenom" placeholder="Votre prénom">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="profile().email" placeholder="votre@email.com">
            </div>
            <div class="form-group">
              <label>Téléphone</label>
              <input type="text" [(ngModel)]="profile().telephone" disabled>
              <small>Le numéro de téléphone ne peut pas être modifié.</small>
            </div>
            <div class="form-actions">
              <button class="btn-primary" (click)="saveProfile()" [disabled]="saving()">
                {{ saving() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <h3>Sécurité</h3>
          </div>
          <div class="security-info">
            <p>Votre compte est protégé par votre email et votre mot de passe.</p>
            <div class="form-group">
              <label>Nouveau mot de passe (optionnel)</label>
              <input type="password" [(ngModel)]="newPassword" placeholder="Laissez vide pour ne pas changer">
            </div>
            <div class="form-actions">
              <button class="btn-secondary" (click)="updatePassword()" [disabled]="saving()">
                Mettre à jour le mot de passe
              </button>
            </div>
          </div>
          
          <div class="divider"></div>

          <div class="2fa-section">
            <h4>Authentification à double facteur (2FA)</h4>
            
            <div *ngIf="!profile()?.two_factor_enabled && !show2FASetup()">
               <p class="text-muted">Renforcez la sécurité de votre compte en activant le 2FA via une application (Google Authenticator, Authy, etc.).</p>
               <button class="btn-primary" (click)="start2FASetup()" [disabled]="settingUp2FA()">
                 {{ settingUp2FA() ? 'Chargement...' : 'Activer le 2FA' }}
               </button>
            </div>
            
            <div *ngIf="show2FASetup()" class="setup-2fa">
               <p>1. Scannez ce QR Code :</p>
               <div class="qr-wrapper">
                  <img [src]="qrCodeUrl" alt="QR Code 2FA">
               </div>
               <p>2. Entrez le code de 6 chiffres pour confirmer :</p>
               <div class="form-group">
                 <input type="text" [(ngModel)]="confirm2FACode" placeholder="000000" maxlength="6" style="text-align: center; font-size: 1.25rem; letter-spacing: 0.25rem;">
               </div>
               <div class="form-actions" style="display: flex; gap: 0.5rem;">
                 <button class="btn-primary" (click)="enable2FA()" [disabled]="confirm2FACode.length < 6 || settingUp2FA()">
                   {{ settingUp2FA() ? 'Validation...' : 'Confirmer et Activer' }}
                 </button>
                 <button class="btn-secondary" (click)="show2FASetup.set(false)" [disabled]="settingUp2FA()">Annuler</button>
               </div>
            </div>

            <div *ngIf="profile()?.two_factor_enabled">
               <div class="active-2fa">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  2FA Activé
               </div>
               <p class="text-muted">Votre compte est sécurisé par une double authentification.</p>
               <button class="btn-danger" (click)="disable2FA()">Désactiver le 2FA</button>
            </div>
          </div>
        </section>
      </div>

      <ng-template #loading>
        <p>Chargement du profil...</p>
      </ng-template>
    </app-layout>
  `,
  styles: [`
    .header { margin-bottom: 2rem; }
    .subtitle { color: #64748b; margin-top: 0.25rem; }
    
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; }
    .card-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #f1f5f9; }
    
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 500; color: #475569; margin-bottom: 0.5rem; }
    .form-group input { width: 100%; padding: 0.625rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
    .form-group input:focus { border-color: #3b82f6; }
    .form-group input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
    .form-group small { color: #94a3b8; font-size: 0.75rem; margin-top: 0.25rem; display: block; }
    
    .form-actions { margin-top: 1.5rem; }
    .btn-primary { background: #2563eb; color: white; border: none; padding: 0.625rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .btn-secondary { background: white; color: #1e293b; border: 1px solid #e2e8f0; padding: 0.625rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-secondary:hover { background: #f8fafc; }

    .btn-danger { background: #fee2e2; color: #dc2626; border: none; padding: 0.625rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-danger:hover { background: #fecaca; }

    .divider { height: 1px; background: #f1f5f9; margin: 2rem 0; }
    .text-muted { color: #64748b; font-size: 0.875rem; margin-bottom: 1.25rem; }
    .active-2fa { display: flex; align-items: center; gap: 0.5rem; color: #10b981; font-weight: 600; margin-bottom: 0.5rem; }
    .qr-wrapper { background: white; padding: 1rem; display: inline-block; border: 1px solid #e2e8f0; border-radius: 8px; margin: 1rem 0; }
    .qr-wrapper img { width: 160px; height: 160px; display: block; }
    h4 { margin: 0 0 1rem 0; font-size: 1rem; color: #1e293b; }
  `]
})
export class ParametresComponent implements OnInit {
  private authService = inject(AuthService);
  private utilisateurService = inject(UtilisateurService);
  private toastService = inject(ToastService);

  profile = signal<any>(null);
  saving = signal<boolean>(false);
  newPassword = '';

  // 2FA
  show2FASetup = signal(false);
  settingUp2FA = signal(false);
  qrCodeUrl = '';
  confirm2FACode = '';

  ngOnInit() {
    const user = this.authService.user();
    if (user) {
      this.profile.set({ ...user });
    }
  }

  saveProfile() {
    if (!this.profile()) return;
    this.saving.set(true);
    const { id, nom, prenom, email } = this.profile();
    this.utilisateurService.updateUtilisateur(id, { nom, prenom, email }).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        this.authService.updateUser(res);
        this.toastService.success('Profil mis à jour avec succès');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error('Erreur lors de la mise à jour');
      }
    });
  }

  updatePassword() {
    if (!this.newPassword) return;
    this.saving.set(true);
    const { id } = this.profile();
    this.utilisateurService.updateUtilisateur(id, { password: this.newPassword }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.newPassword = '';
        this.toastService.success('Mot de passe mis à jour');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error('Erreur lors de la mise à jour du mot de passe');
      }
    });
  }

  // ── 2FA METHODS ──
  start2FASetup() {
    if (this.settingUp2FA()) return;
    this.settingUp2FA.set(true);
    this.authService.setup2FA().subscribe({
      next: (res) => {
        this.qrCodeUrl = res.uri;
        this.show2FASetup.set(true);
        this.settingUp2FA.set(false);
      },
      error: (err) => {
        this.settingUp2FA.set(false);
        if (err.status === 429) {
          this.toastService.warning('Trop de tentatives. Veuillez attendre une minute avant de réessayer.', 'Limite atteinte');
        } else {
          this.toastService.error('Erreur lors de la configuration du 2FA');
        }
      }
    });
  }

  enable2FA() {
    if (this.settingUp2FA()) return;
    this.settingUp2FA.set(true);
    this.authService.enable2FA(this.confirm2FACode).subscribe({
      next: () => {
        this.settingUp2FA.set(false);
        this.show2FASetup.set(false);
        this.profile.update(p => ({ ...p, two_factor_enabled: true }));
        this.authService.updateUser({ ...this.authService.user()!, two_factor_enabled: true });
        this.toastService.success('2FA activé !');
      },
      error: (err) => {
        this.settingUp2FA.set(false);
        if (err.status === 429) {
          this.toastService.warning('Trop de tentatives de validation. Veuillez patienter.', 'Limite atteinte');
        } else {
          this.toastService.error('Code invalide ou erreur de serveur');
        }
      }
    });
  }

  disable2FA() {
    if (confirm('Voulez-vous vraiment désactiver le 2FA ?')) {
      this.utilisateurService.updateUtilisateur(this.profile().id, { two_factor_enabled: false }).subscribe(() => {
        this.profile.update(p => ({ ...p, two_factor_enabled: false }));
        this.authService.updateUser({ ...this.authService.user()!, two_factor_enabled: false });
        this.toastService.info('2FA désactivé');
      });
    }
  }
}
