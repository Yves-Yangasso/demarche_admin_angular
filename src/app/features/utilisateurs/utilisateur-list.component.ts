import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-utilisateur-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="header">
        <div>
          <h1>{{ isSuperAdmin() ? 'Gestion des Administrateurs' : 'Gestion des Agents' }}</h1>
          <p class="subtitle" *ngIf="isSuperAdmin()">Liste globale des gestionnaires de collectivités.</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          {{ isSuperAdmin() ? 'Nouvel Administrateur' : 'Nouvel Agent' }}
        </button>
      </div>

      <div class="card table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th *ngIf="isSuperAdmin()">Organisation</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of utilisateurs()">
              <td><strong>{{ user.prenom }} {{ user.nom }}</strong></td>
              <td *ngIf="isSuperAdmin()">
                <span class="org-name">{{ user.collectivite_nom || 'Platform' }}</span>
              </td>
              <td>{{ user.telephone }}</td>
              <td>{{ user.email || '-' }}</td>
              <td><span class="role-badge">{{ user.role }}</span></td>
              <td>
                <span class="status-badge" [class.active]="user.actif">
                  {{ user.actif ? 'Actif' : 'Bloqué' }}
                </span>
              </td>
              <td class="actions">
                <button class="action-btn toggle" [class.deactivate]="user.actif" (click)="toggleActive(user)" [title]="user.actif ? 'Bloquer' : 'Débloquer'">
                  {{ user.actif ? 'Bloquer' : 'Débloquer' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL CRÉATION -->
      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal-content glass-modal animate-scale" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isSuperAdmin() ? 'Créer un Administrateur' : 'Créer un Agent' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group span-half">
                <label>Prénom <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.prenom" placeholder="ex: Moussa" class="form-control">
              </div>
              <div class="form-group span-half">
                <label>Nom <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.nom" placeholder="ex: Sarr" class="form-control">
              </div>
              
              <!-- Sélection organisation pour Super Admin -->
              <div class="form-group span-full" *ngIf="isSuperAdmin()">
                <label>Organisation <span class="required">*</span></label>
                <select [(ngModel)]="form.collectivite_id" class="form-control">
                  <option [value]="null">Super Administration (Platform)</option>
                  <option *ngFor="let org of organisations()" [value]="org.id">{{ org.nom }}</option>
                </select>
              </div>

              <div class="form-group span-half">
                <label>Téléphone <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.telephone" placeholder="ex: +221770000000" class="form-control">
              </div>
              <div class="form-group span-half">
                <label>Email</label>
                <input type="email" [(ngModel)]="form.email" placeholder="ex: agent@mairie.sn" class="form-control">
              </div>
              <div class="form-group span-half">
                <label>Rôle Système <span class="required">*</span></label>
                <select [(ngModel)]="form.role" class="form-control">
                  <option *ngIf="!isSuperAdmin()" value="agent">Agent</option>
                  <option value="admin">Administrateur</option>
                  <option *ngIf="isSuperAdmin()" value="super_admin">Super Admin</option>
                </select>
              </div>

              <!-- Rôle Hiérarchique (Métier) -->
              <div class="form-group span-half" *ngIf="!isSuperAdmin()">
                <label>Rôle Hiérarchique (Workflow)</label>
                <select [(ngModel)]="form.role_organisation_id" class="form-control">
                  <option [value]="null">Aucun rôle spécifique</option>
                  <option *ngFor="let r of roleOrganisations()" [value]="r.id">{{ r.nom }}</option>
                </select>
              </div>

              <div class="form-group span-half">
                <label>Mot de passe <span class="required">*</span></label>
                <input type="password" [(ngModel)]="form.password" placeholder="••••••••" class="form-control">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="!isFormValid() || saving()">
              {{ saving() ? 'Création...' : 'Créer le compte' }}
            </button>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }
    
    .btn { padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-secondary { background: #f1f5f9; color: #475569; }

    .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; text-align: left; }
    th { text-align: left; padding: 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; color: #64748b; font-weight: 600; }
    td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; }
    
    .org-name { font-size: 0.75rem; font-weight: 600; color: #6366f1; background: #f5f3ff; padding: 2px 6px; border-radius: 4px; }
    .role-badge { padding: 0.25rem 0.5rem; border-radius: 4px; background: #eff6ff; color: #2563eb; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; background: #f1f5f9; color: #64748b; font-size: 0.75rem; font-weight: 600; }
    .status-badge.active { background: #e6f4ea; color: #34a853; }

    .actions { text-align: right; }
    .action-btn { background: none; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; color: #2563eb; }
    .action-btn.deactivate { color: #ef4444; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
    .glass-modal { background: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); width: 100%; max-width: 580px; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.75rem; }

    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .span-half { grid-column: span 1; }
    .span-full { grid-column: span 2; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: #475569; }
    .form-control { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.875rem; }

    .animate-scale { animation: scaleUp 0.15s ease-out; }
    @keyframes scaleUp { from { transform: scale(0.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class UtilisateurListComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  utilisateurs = signal<any[]>([]);
  organisations = signal<any[]>([]);
  roleOrganisations = signal<any[]>([]);
  showModal = signal<boolean>(false);
  saving = signal<boolean>(false);

  form = {
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    password: '',
    role: 'agent',
    collectivite_id: null as number | null,
    role_organisation_id: null as number | null
  };

  isSuperAdmin() {
    return this.authService.user()?.role === 'super_admin';
  }

  ngOnInit() {
    // Redirection pour les agents qui n'ont plus accès à cette page
    const user = this.authService.user();
    if (user?.role === 'agent') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.route.queryParams.subscribe(params => {
      const orgId = params['org_id'];
      const action = params['action'];
      this.loadUtilisateurs(orgId);
      
      if (action === 'new') {
        setTimeout(() => {
          this.openModal();
          if (orgId) {
            this.form.collectivite_id = parseInt(orgId);
          }
        }, 300);
      }
    });
    if (this.isSuperAdmin()) {
      this.loadOrganisations();
    }
    this.loadRoleOrganisations();
  }

  loadUtilisateurs(orgId?: string) {
    let url = '/api/utilisateurs';
    if (orgId) {
      url += `?collectivite_id=${orgId}`;
    }
    this.http.get<any[]>(url).subscribe(users => {
      this.utilisateurs.set(users);
    });
  }

  loadOrganisations() {
    this.http.get<any[]>('/api/collectivites').subscribe(orgs => {
      this.organisations.set(orgs);
    });
  }

  loadRoleOrganisations() {
    this.http.get<any[]>('/api/roles').subscribe(roles => {
      this.roleOrganisations.set(roles);
    });
  }

  openModal() {
    this.form = {
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      password: '',
      role: this.isSuperAdmin() ? 'admin' : 'agent',
      collectivite_id: null,
      role_organisation_id: null
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  isFormValid(): boolean {
    return !!(
      this.form.nom &&
      this.form.prenom &&
      this.form.telephone &&
      this.form.password &&
      this.form.role
    );
  }

  save() {
    this.saving.set(true);
    this.http.post('/api/utilisateurs', this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadUtilisateurs();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err?.error?.message || 'Erreur lors de la création du compte.');
      }
    });
  }

  toggleActive(user: any) {
    const action = user.actif ? 'bloquer' : 'debloquer';
    if (!confirm(`Confirmer le changement de statut pour ${user.prenom} ?`)) return;

    this.http.post(`/api/utilisateurs/${user.id}/${action}`, {}).subscribe({
      next: () => {
        this.loadUtilisateurs();
      },
      error: (err) => {
        alert(err?.error?.message || 'Erreur lors du changement de statut.');
      }
    });
  }
}
