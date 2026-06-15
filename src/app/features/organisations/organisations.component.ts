import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';

@Component({
  selector: 'app-organisations',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="header-section">
        <div>
          <h1>Gestion des Organisations</h1>
          <p class="subtitle">Super-Administration : listez, modifiez et gérez les collectivités locales.</p>
        </div>
        <div>
          <button class="btn btn-primary" (click)="openModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nouvelle Organisation
          </button>
        </div>
      </div>

      <div class="loading-state" *ngIf="loading()">
        <div class="spinner"></div>
        Chargement des organisations...
      </div>

      <div class="card table-container" *ngIf="!loading() && organisations().length > 0">
        <table class="premium-table">
          <thead>
            <tr>
              <th>Code / Nom</th>
              <th>Type / Région</th>
              <th>Contact / Adresse</th>
              <th>Dossiers / Performance</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let org of organisations()">
              <td>
                <div class="org-primary">
                  <span class="badge badge-code">{{ org.code }}</span>
                  <strong>{{ org.nom }}</strong>
                </div>
              </td>
              <td>
                <span class="type-tag">{{ org.type }}</span>
                <div class="region-desc">{{ org.region || '-' }} • {{ org.departement || '-' }}</div>
              </td>
              <td>
                <div class="contact-info">
                   <div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.7 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> {{ org.telephone || '-' }}</div>
                   <div class="email-text"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> {{ org.email || '-' }}</div>
                   <div class="address-text">{{ org.adresse || '-' }}</div>
                </div>
              </td>
              <td>
                <div class="stats-mini-grid">
                  <div class="stat-mini">
                    <span class="mini-label">Total</span>
                    <span class="mini-value">{{ org.stats?.total_dossiers || 0 }}</span>
                  </div>
                  <div class="stat-mini">
                    <span class="mini-label">Clos</span>
                    <span class="mini-value green">{{ org.stats?.dossiers_clos || 0 }}</span>
                  </div>
                  <div class="stat-mini">
                    <span class="mini-label">Retard</span>
                    <span class="mini-value red">{{ org.stats?.en_retard || 0 }}</span>
                  </div>
                </div>
                <div class="perf-bar" *ngIf="org.stats?.performance_7_jours">
                   <div class="perf-segment" *ngFor="let p of org.stats.performance_7_jours" 
                        [style.height.px]="mathMin(p.count * 3, 20)"
                        [title]="p.date + ': ' + p.count"></div>
                </div>
              </td>
              <td>
                <span class="status-pill" [class.active]="org.actif">
                  {{ org.actif ? 'Actif' : 'Bloqué' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" (click)="voirAdmins(org)" title="Voir les Administrateurs">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </button>
                  <button class="btn-icon" (click)="ajouterAdmin(org)" title="Ajouter un Administrateur">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>
                  </button>
                  <button class="btn-icon" (click)="editOrg(org)" title="Modifier">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="btn-icon" (click)="toggleStatus(org)" [title]="org.actif ? 'Bloquer' : 'Débloquer'">
                    <svg *ngIf="org.actif" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <svg *ngIf="!org.actif" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL CRÉATION / MODIFICATION -->
      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal-content glass-modal big-modal animate-scale" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingOrgId ? 'Modifier l\\'Organisation' : 'Nouvelle Collectivité & Administrateur' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="stepper">
              <button type="button" class="step-item" [class.active]="currentStep() === 1" [class.done]="currentStep() > 1" (click)="goToStep(1)">
                <span>1</span>
                <div><strong>Identite</strong><small>Code, nom et type</small></div>
              </button>
              <button type="button" class="step-item" [class.active]="currentStep() === 2" [class.done]="currentStep() > 2" [disabled]="!canAccessStep(2)" (click)="goToStep(2)">
                <span>2</span>
                <div><strong>Coordonnees</strong><small>Localisation et contact</small></div>
              </button>
              <button *ngIf="!editingOrgId" type="button" class="step-item" [class.active]="currentStep() === 3" [disabled]="!canAccessStep(3)" (click)="goToStep(3)">
                <span>3</span>
                <div><strong>Admin</strong><small>Compte initial</small></div>
              </button>
            </div>
            <div class="step-heading">
              <span>Etape {{ currentStep() }} sur {{ totalSteps() }}</span>
              <h4>{{ currentStepTitle() }}</h4>
            </div>
            <div class="form-grid">
              <ng-container *ngIf="currentStep() === 1">
              
              <div class="section-divider span-full">Informations de la Collectivité</div>

              <div class="form-group span-half" *ngIf="currentStep() === 1">
                <label>Code de l'organisation <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.code" placeholder="ex: COM-DKR-001" class="form-control">
              </div>
              <div class="form-group span-half" *ngIf="currentStep() === 1">
                <label>Nom <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.nom" placeholder="ex: Mairie de Dakar" class="form-control">
              </div>
              <div class="form-group span-half" *ngIf="currentStep() === 1">
                <label>Type <span class="required">*</span></label>
                <select [(ngModel)]="form.type" class="form-control">
                  <option value="commune">Commune</option>
                  <option value="département">Département</option>
                  <option value="région">Région</option>
                </select>
              </div>
              </ng-container>

              <ng-container *ngIf="currentStep() === 2">
              <div class="form-group span-half">
                <label>Région</label>
                <input type="text" [(ngModel)]="form.region" placeholder="ex: Dakar" class="form-control">
              </div>
              <div class="form-group span-half">
                <label>Département</label>
                <input type="text" [(ngModel)]="form.departement" placeholder="ex: Dakar" class="form-control">
              </div>
              <div class="form-group span-half">
                <label>Téléphone Collectivité</label>
                <input type="text" [(ngModel)]="form.telephone" placeholder="ex: +221..." class="form-control">
              </div>
              <div class="form-group span-half">
                <label>Email Collectivité</label>
                <input type="email" [(ngModel)]="form.email" placeholder="ex: contact@mairie.sn" class="form-control">
              </div>
              <div class="form-group span-half">
                <label>Adresse Physique</label>
                <input type="text" [(ngModel)]="form.adresse" placeholder="ex: Rue 12, Dakar" class="form-control">
              </div>
              </ng-container>

              <!-- Section Administrateur visible uniquement en création -->
              <ng-container *ngIf="!editingOrgId && currentStep() === 3">
                <div class="section-divider span-full">Compte Super-Administrateur Local</div>
                <div class="form-group span-half">
                  <label>Prénom de l'admin <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="form.admin_prenom" placeholder="ex: Fatou" class="form-control">
                </div>
                <div class="form-group span-half">
                  <label>Nom de l'admin <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="form.admin_nom" placeholder="ex: Ndiaye" class="form-control">
                </div>
                <div class="form-group span-half">
                  <label>Téléphone Mobile admin <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="form.admin_telephone" placeholder="ex: +221770000000" class="form-control">
                </div>
                <div class="form-group span-half">
                  <label>Email de l'admin <span class="required">*</span></label>
                  <input type="email" [(ngModel)]="form.admin_email" placeholder="ex: admin@mairie.sn" class="form-control">
                </div>
                <div class="form-group span-full">
                  <label>Mot de passe temporaire <span class="required">*</span></label>
                  <input type="password" [(ngModel)]="form.admin_password" placeholder="••••••••" class="form-control">
                </div>
              </ng-container>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
            <button class="btn btn-secondary" *ngIf="currentStep() > 1" (click)="previousStep()">Retour</button>
            <button class="btn btn-primary" *ngIf="!isLastStep()" (click)="nextStep()" [disabled]="!isCurrentStepValid()">Continuer</button>
            <button class="btn btn-primary" *ngIf="isLastStep()" (click)="save()" [disabled]="!isFormValid() || saving()">
              {{ primaryActionLabel() }}
            </button>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { font-size: 1.8rem; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; margin-top: 0.25rem; font-size: 0.95rem; }

    .btn { padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; }
    .btn-secondary { background: #f1f5f9; color: #475569; }

    .table-container { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
    .premium-table th { padding: 1rem; font-weight: 600; color: #475569; border-bottom: 2px solid #f1f5f9; background: #f8fafc; }
    .premium-table td { padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }

    .org-primary { display: flex; flex-direction: column; gap: 0.25rem; }
    .badge-code { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; width: max-content; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }

    .type-tag { background: #eff6ff; color: #2563eb; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; border: 1px solid #dbeafe; text-transform: capitalize; width: max-content; }
    .region-desc { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }

    .contact-info { display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: #475569; }
    .email-text { color: #2563eb; font-weight: 500; }
    .address-text { font-size: 0.75rem; color: #94a3b8; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .status-pill { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: #f1f5f9; color: #64748b; }
    .status-pill.active { background: #e6f4ea; color: #34a853; }

    .stats-mini-grid { display: flex; gap: 0.75rem; margin-bottom: 0.5rem; }
    .stat-mini { display: flex; flex-direction: column; }
    .mini-label { font-size: 0.65rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .mini-value { font-size: 0.85rem; font-weight: 700; color: #1e293b; }
    .mini-value.green { color: #16a34a; }
    .mini-value.red { color: #dc2626; }

    .perf-bar { display: flex; align-items: flex-end; gap: 2px; height: 20px; padding-top: 4px; border-bottom: 1px solid #e2e8f0; width: fit-content; }
    .perf-segment { width: 8px; background: #3b82f6; border-radius: 1px 1px 0 0; }

    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-icon { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.375rem; border-radius: 6px; transition: all 0.2s; }
    .btn-icon:hover { color: #2563eb; background: #eff6ff; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
    .glass-modal { background: white; border: 1px solid #cbd5e1; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); width: 100%; max-width: 760px; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .close-btn { background: none; border: none; font-size: 1.75rem; cursor: pointer; color: #94a3b8; }
    .modal-body { padding: 1.5rem; }
    .modal-scroll { overflow-y: auto; max-height: 70vh; }
    .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.75rem; }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .stepper { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem; }
    .step-item { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 10px; padding: 0.875rem; display: flex; align-items: center; gap: 0.75rem; text-align: left; color: #64748b; cursor: pointer; transition: all 0.2s; min-height: 76px; }
    .step-item:disabled { opacity: 0.55; cursor: not-allowed; }
    .step-item span { width: 32px; height: 32px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #e2e8f0; color: #475569; font-weight: 800; flex: 0 0 auto; }
    .step-item strong { display: block; color: #334155; font-size: 0.875rem; }
    .step-item small { display: block; margin-top: 0.125rem; font-size: 0.72rem; line-height: 1.2; }
    .step-item.active { background: #eff6ff; border-color: #93c5fd; box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12); }
    .step-item.active span, .step-item.done span { background: #2563eb; color: white; }
    .step-heading { margin-bottom: 1rem; }
    .step-heading span { color: #2563eb; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; }
    .step-heading h4 { margin: 0.25rem 0 0; font-size: 1.15rem; color: #0f172a; }

    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .span-half { grid-column: span 1; }
    .span-full { grid-column: span 2; }
    .section-divider { font-weight: 700; font-size: 0.95rem; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.375rem; margin-top: 0.75rem; }

    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: #475569; }
    .required { color: #ef4444; }
    .form-control { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.875rem; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: #64748b; gap: 1rem; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 720px) {
      .modal-overlay { padding: 1rem; align-items: flex-start; overflow-y: auto; }
      .form-grid { grid-template-columns: 1fr; }
      .span-half, .span-full { grid-column: span 1; }
      .modal-footer { flex-wrap: wrap; }
      .modal-footer .btn { flex: 1 1 140px; justify-content: center; }
    }
  `]
})
export class OrganisationsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  organisations = signal<any[]>([]);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  showModal = signal<boolean>(false);
  currentStep = signal<number>(1);
  editingOrgId: number | null = null;

  form = {
    code: '',
    nom: '',
    type: 'commune',
    region: '',
    departement: '',
    adresse: '',
    telephone: '',
    email: '',
    latitude: 0,
    longitude: 0,
    admin_prenom: '',
    admin_nom: '',
    admin_telephone: '',
    admin_email: '',
    admin_password: ''
  };

  ngOnInit() {
    this.loadOrganisations();
  }

  loadOrganisations() {
    this.loading.set(true);
    this.http.get<any[]>('/api/stats/globales').subscribe({
      next: (res) => {
        this.organisations.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.http.get<any[]>('/api/collectivites').subscribe({
          next: (res) => {
            this.organisations.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      }
    });
  }

  mathMin(a: number, b: number) {
    return Math.min(a, b);
  }

  toggleStatus(org: any) {
    const action = org.actif ? 'bloquer' : 'debloquer';
    if (!confirm(`Êtes-vous sûr de vouloir ${action} l'organisation ${org.nom} ?`)) return;

    this.http.post(`/api/collectivites/${org.id}/${action}`, {}).subscribe({
      next: () => this.loadOrganisations(),
      error: (err) => alert(err?.error?.message || 'Erreur lors du changement de statut')
    });
  }

  voirAdmins(org: any) {
    this.router.navigate(['/utilisateurs'], { queryParams: { org_id: org.id } });
  }

  ajouterAdmin(org: any) {
    this.router.navigate(['/utilisateurs'], { queryParams: { org_id: org.id, action: 'new' } });
  }

  openModal() {
    this.editingOrgId = null;
    this.form = {
      code: '',
      nom: '',
      type: 'commune',
      region: '',
      departement: '',
      adresse: '',
      telephone: '',
      email: '',
      latitude: 0,
      longitude: 0,
      admin_prenom: '',
      admin_nom: '',
      admin_telephone: '',
      admin_email: '',
      admin_password: ''
    };
    this.currentStep.set(1);
    this.showModal.set(true);
  }

  editOrg(org: any) {
    this.editingOrgId = org.id;
    this.form = {
      code: org.code,
      nom: org.nom,
      type: org.type,
      region: org.region,
      departement: org.departement,
      adresse: org.adresse,
      telephone: org.telephone,
      email: org.email,
      latitude: org.latitude || 0,
      longitude: org.longitude || 0,
      admin_prenom: '',
      admin_nom: '',
      admin_telephone: '',
      admin_email: '',
      admin_password: ''
    };
    this.currentStep.set(1);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  totalSteps(): number {
    return this.editingOrgId ? 2 : 3;
  }

  currentStepTitle(): string {
    if (this.currentStep() === 1) return 'Informations principales';
    if (this.currentStep() === 2) return 'Coordonnees de la collectivite';
    return 'Compte administrateur local';
  }

  isLastStep(): boolean {
    return this.currentStep() === this.totalSteps();
  }

  canAccessStep(step: number): boolean {
    if (step <= 1) return true;
    if (step === 2) return this.isStepValid(1);
    return this.isStepValid(1) && this.isStepValid(2);
  }

  goToStep(step: number) {
    if (step <= this.totalSteps() && this.canAccessStep(step)) {
      this.currentStep.set(step);
    }
  }

  nextStep() {
    if (!this.isLastStep() && this.isCurrentStepValid()) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  isCurrentStepValid(): boolean {
    return this.isStepValid(this.currentStep());
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return !!(this.form.code && this.form.nom && this.form.type);
    }
    if (step === 2) {
      return true;
    }
    return !!(
      this.form.admin_prenom &&
      this.form.admin_nom &&
      this.form.admin_telephone &&
      this.form.admin_email &&
      this.form.admin_password
    );
  }

  primaryActionLabel(): string {
    if (this.saving()) return 'Traitement...';
    return this.editingOrgId ? 'Enregistrer les modifications' : 'Creer l organisation';
  }

  isFormValid(): boolean {
    if (this.editingOrgId) {
      return !!(this.form.code && this.form.nom && this.form.type);
    }
    return !!(
      this.form.code &&
      this.form.nom &&
      this.form.type &&
      this.form.admin_prenom &&
      this.form.admin_nom &&
      this.form.admin_telephone &&
      this.form.admin_email &&
      this.form.admin_password
    );
  }

  save() {
    this.saving.set(true);
    if (this.editingOrgId) {
      this.http.patch(`/api/collectivites/${this.editingOrgId}`, this.form).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadOrganisations();
        },
        error: (err) => {
          this.saving.set(false);
          alert(err?.error?.message || 'Erreur lors de la modification.');
        }
      });
    } else {
      this.http.post('/api/collectivites', this.form).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadOrganisations();
        },
        error: (err) => {
          this.saving.set(false);
          alert(err?.error?.message || 'Erreur lors de la création.');
        }
      });
    }
  }
}
