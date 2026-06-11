import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="header">
        <div>
          <h1>Circuits de Validation</h1>
          <p class="subtitle">Définissez les étapes de validation hiérarchique pour chaque type de dossier.</p>
        </div>
        <button *ngIf="isWriteAllowed()" class="btn btn-primary" (click)="openWfModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nouveau Workflow
        </button>
      </div>

      <div class="workflow-grid">
        <div class="card wf-card" *ngFor="let wf of workflows()">
          <div class="wf-header">
            <h3>{{ wf.nom }}</h3>
            <span class="type-badge">{{ getDemarcheNom(wf.type_demarche_id) }}</span>
          </div>
          <p class="desc">{{ wf.description || 'Aucune description' }}</p>
          
          <div class="steps-list">
            <div class="step-item" *ngFor="let step of wf.steps; let i = index">
              <div class="step-number">{{ i + 1 }}</div>
              <div class="step-info">
                <div class="step-name">{{ step.nom }}</div>
                <div class="step-role">Rôle requis : <strong>{{ step.role_organisation_nom }}</strong></div>
              </div>
              <button *ngIf="isWriteAllowed()" class="btn-del" (click)="deleteStep(step.id)">×</button>
            </div>
            <div class="empty-steps" *ngIf="wf.steps.length === 0">
              Aucune étape définie. Le dossier passera directement en clôture.
            </div>
          </div>

          <div class="wf-actions" *ngIf="isWriteAllowed()">
            <button class="btn btn-outline btn-sm" (click)="openStepModal(wf)">
              + Ajouter une étape
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL WORKFLOW -->
      <div class="modal-overlay" *ngIf="showWfModal()">
        <div class="modal-content glass-modal animate-scale">
          <div class="modal-header">
            <h3>Nouveau Circuit de Validation</h3>
            <button class="close-btn" (click)="showWfModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nom du circuit</label>
              <input type="text" [(ngModel)]="wfForm.nom" placeholder="ex: Validation Urbanisme" class="form-control">
            </div>
            <div class="form-group">
              <label>Type de démarche concerné</label>
              <select [(ngModel)]="wfForm.type_demarche_id" class="form-control">
                <option *ngFor="let d of demarches()" [value]="d.id">{{ d.nom }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="wfForm.description" class="form-control"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" (click)="saveWorkflow()">Créer le circuit</button>
          </div>
        </div>
      </div>

      <!-- MODAL STEP -->
      <div class="modal-overlay" *ngIf="showStepModal()">
        <div class="modal-content glass-modal animate-scale">
          <div class="modal-header">
            <h3>Ajouter une Étape de Validation</h3>
            <button class="close-btn" (click)="showStepModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nom de l'étape</label>
              <input type="text" [(ngModel)]="stepForm.nom" placeholder="ex: Visa Secrétaire Général" class="form-control">
            </div>
            <div class="form-group">
              <label>Rôle hiérarchique habilité</label>
              <select [(ngModel)]="stepForm.role_organisation_id" class="form-control">
                <option *ngFor="let r of roles()" [value]="r.id">{{ r.nom }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ordre (position dans la chaîne)</label>
              <input type="number" [(ngModel)]="stepForm.ordre" class="form-control">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" (click)="saveStep()">Ajouter l'étape</button>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }

    .workflow-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .wf-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    
    .wf-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .wf-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
    .type-badge { font-size: 0.7rem; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 99px; font-weight: 600; border: 1px solid #dbeafe; }
    
    .desc { font-size: 0.85rem; color: #64748b; margin: 0; }

    .steps-list { display: flex; flex-direction: column; gap: 0.75rem; background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px dashed #cbd5e1; }
    .step-item { display: flex; align-items: center; gap: 1rem; background: white; padding: 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0; position: relative; }
    .step-number { width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .step-info { flex: 1; }
    .step-name { font-size: 0.85rem; font-weight: 600; color: #1e293b; }
    .step-role { font-size: 0.75rem; color: #64748b; }
    .btn-del { background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
    .btn-del:hover { color: #ef4444; }

    .empty-steps { font-size: 0.75rem; color: #94a3b8; text-align: center; font-style: italic; }

    .btn { padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-outline { background: white; border: 1px solid #cbd5e1; color: #475569; }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .glass-modal { background: white; border-radius: 12px; width: 100%; max-width: 500px; padding: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .form-control { padding: 0.625rem; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; }
  `]
})
export class WorkflowListComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  user = this.authService.user;
  isWriteAllowed = computed(() => this.user()?.role === 'admin');

  workflows = signal<any[]>([]);
  demarches = signal<any[]>([]);
  roles = signal<any[]>([]);
  
  showWfModal = signal<boolean>(false);
  showStepModal = signal<boolean>(false);
  
  wfForm = { nom: '', type_demarche_id: null as any, description: '' };
  stepForm = { nom: '', role_organisation_id: null as any, ordre: 0, workflow_id: null as any };

  ngOnInit() {
    this.loadWorkflows();
    this.loadDemarches();
    this.loadRoles();
  }

  loadWorkflows() {
    this.http.get<any[]>('/api/workflows').subscribe(data => this.workflows.set(data));
  }

  loadDemarches() {
    this.http.get<any[]>('/api/dossiers/demarches').subscribe(data => this.demarches.set(data));
  }

  loadRoles() {
    this.http.get<any[]>('/api/roles').subscribe(data => this.roles.set(data));
  }

  getDemarcheNom(id: number) {
    return this.demarches().find(d => d.id === id)?.nom || 'Type inconnu';
  }

  openWfModal() {
    this.wfForm = { nom: '', type_demarche_id: null, description: '' };
    this.showWfModal.set(true);
  }

  saveWorkflow() {
    this.http.post('/api/workflows', this.wfForm).subscribe(() => {
      this.showWfModal.set(false);
      this.loadWorkflows();
    });
  }

  openStepModal(wf: any) {
    this.stepForm = { nom: '', role_organisation_id: null, ordre: wf.steps.length, workflow_id: wf.id };
    this.showStepModal.set(true);
  }

  saveStep() {
    this.http.post(`/api/workflows/${this.stepForm.workflow_id}/steps`, this.stepForm).subscribe(() => {
      this.showStepModal.set(false);
      this.loadWorkflows();
    });
  }

  deleteStep(id: number) {
    if (confirm('Supprimer cette étape ?')) {
      this.http.delete(`/api/workflows/steps/${id}`).subscribe(() => this.loadWorkflows());
    }
  }
}
