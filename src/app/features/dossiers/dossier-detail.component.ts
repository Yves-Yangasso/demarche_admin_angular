import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { DossierService } from '../../core/services/dossier.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { toApiUrl } from '../../core/utils/api-url';

@Component({
  selector: 'app-dossier-detail',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `
    <app-layout>
      <div *ngIf="dossier() as d; else loading" class="fade-in">
        <div class="header">
          <div class="header-left">
            <button class="btn-back" (click)="goBack()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1>Dossier {{ d.numero }}</h1>
              <p class="subtitle">{{ d.type_demarche?.nom }}</p>
            </div>
          </div>
          <div class="header-actions">
            <span class="status-pill big" [ngClass]="d.statut">{{ d.statut }}</span>
            
            <!-- Actions de Workflow -->
            <ng-container *ngIf="d.statut === 'en_cours'">
              <button class="btn btn-primary" (click)="soumettreWorkflow()">Soumettre à la validation</button>
            </ng-container>

            <ng-container *ngIf="d.statut === 'en_validation' && isCurrentValidator()">
              <button class="btn btn-success" (click)="validerWorkflow()">Valider l'étape</button>
              <button class="btn btn-danger" (click)="rejeterWorkflow()">Rejeter</button>
            </ng-container>

            <button *ngIf="d.statut === 'nouveau' || d.statut === 'en_cours'" class="btn btn-outline" (click)="traiter()">Traiter</button>
          </div>
        </div>

        <!-- Alerte Étape Actuelle -->
        <div class="alert-info" *ngIf="d.statut === 'en_validation'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>Étape actuelle : <strong>{{ d.current_step_nom }}</strong>. Attente du rôle : <strong>{{ d.current_step?.role_organisation_nom }}</strong></span>
        </div>

        <!-- Stepper Visuel de Progression -->
        <div class="card stepper-card">
          <div class="stepper-container">
            <div class="stepper-progress">
              <div class="stepper-progress-bar" [style.width]="getProgressBarWidth(d.statut)"></div>
            </div>
            
            <div class="step-item" [ngClass]="getStepState(1, d.statut)">
              <div class="step-icon">
                <span class="step-number" *ngIf="getStepState(1, d.statut) !== 'completed'">1</span>
                <svg *ngIf="getStepState(1, d.statut) === 'completed'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div class="step-label">
                <span class="step-title">Soumission</span>
                <span class="step-desc">Dossier créé</span>
              </div>
            </div>

            <div class="step-item" [ngClass]="getStepState(2, d.statut)">
              <div class="step-icon">
                <span class="step-number" *ngIf="!['completed', 'warning'].includes(getStepState(2, d.statut))">2</span>
                <svg *ngIf="getStepState(2, d.statut) === 'completed'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span *ngIf="getStepState(2, d.statut) === 'warning'" class="alert-icon">⚠️</span>
              </div>
              <div class="step-label">
                <span class="step-title">Instruction</span>
                <span class="step-desc">{{ getStep2Desc(d.statut) }}</span>
              </div>
            </div>

            <div class="step-item" [ngClass]="getStepState(3, d.statut)">
              <div class="step-icon">
                <span class="step-number" *ngIf="getStepState(3, d.statut) !== 'completed'">3</span>
                <svg *ngIf="getStepState(3, d.statut) === 'completed'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div class="step-label">
                <span class="step-title">Validation</span>
                <span class="step-desc">Examen final</span>
              </div>
            </div>

            <div class="step-item" [ngClass]="getStepState(4, d.statut)">
              <div class="step-icon">
                <span class="step-number" *ngIf="!['completed', 'rejected'].includes(getStepState(4, d.statut))">4</span>
                <svg *ngIf="getStepState(4, d.statut) === 'completed'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span *ngIf="getStepState(4, d.statut) === 'rejected'" class="alert-icon">❌</span>
              </div>
              <div class="step-label">
                <span class="step-title">Décision</span>
                <span class="step-desc">{{ getStep4Desc(d.statut) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid">
          <!-- Colonne Gauche: Infos & Documents -->
          <div class="col-main">
            <section class="card info-card">
              <div class="card-header">
                <h3>Informations Générales</h3>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <label>Citoyen</label>
                  <span>{{ d.citoyen?.prenom }} {{ d.citoyen?.nom }}</span>
                </div>
                <div class="info-item">
                  <label>Date de soumission</label>
                  <span>{{ d.date_soumission | date:'dd MMMM yyyy HH:mm' }}</span>
                </div>
                <div class="info-item">
                  <label>Échéance prévue</label>
                  <span [class.overdue]="isOverdue(d.date_echeance)">
                    {{ d.date_echeance | date:'dd MMMM yyyy' }}
                  </span>
                </div>
                <div class="info-item">
                  <label>Priorité</label>
                  <span class="priority-badge" [ngClass]="d.priorite">{{ d.priorite }}</span>
                </div>
              </div>
              <div class="description">
                <label>Description</label>
                <p>{{ d.description || 'Aucune description fournie.' }}</p>
              </div>
            </section>

            <section class="card docs-card">
              <div class="card-header">
                <h3>Documents Justificatifs</h3>
              </div>
              <div class="docs-list" *ngIf="d.documents?.length; else noDocs">
                <div class="doc-item" *ngFor="let doc of d.documents" style="display: flex; flex-direction: column; align-items: stretch; border-bottom: 1px solid #f1f5f9; padding: 1rem 0.5rem; gap: 0.75rem;">
                  
                  <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                    <div class="doc-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div class="doc-info" style="flex: 1;">
                      <span class="doc-name" style="font-weight: 600;">{{ doc.nom }}</span>
                      <span class="doc-meta" style="font-size: 0.75rem; color: #64748b; display: block;">{{ doc.mime_type }} • {{ doc.taille / 1024 | number:'1.0-0' }} KB</span>
                    </div>
                    <div class="doc-actions" style="display: flex; gap: 0.5rem;">
                      <button class="btn-icon" (click)="voirDoc(doc)" title="Prévisualiser">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button class="btn-icon" (click)="telechargerDoc(doc)" title="Télécharger">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Validation status & Actions -->
                  <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.8rem; border: 1px solid #e2e8f0; width: 100%;">
                    <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                      <span style="font-weight: 600; color: #475569;">Validation :</span>
                      <span style="color: #64748b; font-weight: 500;">{{ getValidationStatusString(doc) }}</span>
                    </div>
                    <div *ngIf="canCurrentUserValidate(doc)" style="display: flex; gap: 0.5rem;">
                      <button class="btn" (click)="approveDoc(doc)" style="padding: 0.375rem 0.75rem; font-size: 0.75rem; background: #10b981; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: 600;">Approuver</button>
                      <button class="btn" (click)="rejectDoc(doc)" style="padding: 0.375rem 0.75rem; font-size: 0.75rem; background: #ef4444; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: 600;">Rejeter</button>
                    </div>
                  </div>

                </div>
              </div>
              <ng-template #noDocs>
                <p class="empty-msg" style="padding: 1.5rem; color: #64748b; text-align: center;">Aucun document joint à ce dossier.</p>
              </ng-template>
            </section>
          </div>

          <!-- Colonne Droite: IA & Historique -->
          <div class="col-side">
            <section class="card ia-card highlight">
              <div class="card-header">
                <h3>Analyse IA (Groq)</h3>
              </div>
              <div class="ia-content">
                <div class="score-container">
                  <div class="score-circle" [style.--score]="d.score_priorite_ia * 100">
                    <span class="score-val">{{ d.score_priorite_ia * 100 | number:'1.0-0' }}%</span>
                  </div>
                  <span class="score-label">Score d'Urgence</span>
                </div>
                <div class="ia-tags" *ngIf="d.tags_ia">
                  <span class="tag" *ngFor="let tag of d.tags_ia">{{ tag }}</span>
                </div>
                <div class="ia-recommendation">
                  <p><strong>Conseil IA:</strong> Ce dossier présente des documents complets. Priorité normale suggérée.</p>
                </div>
              </div>
            </section>

            <section class="card workflow-card" *ngIf="d.workflow_approvals?.length">
              <div class="card-header">
                <h3>Visas & Validations</h3>
              </div>
              <div class="approvals-list">
                <div class="approval-item" *ngFor="let a of d.workflow_approvals" [ngClass]="a.statut">
                   <div class="approval-header">
                     <span class="step">{{ a.step_nom }}</span>
                     <span class="badge">{{ a.statut }}</span>
                   </div>
                   <div class="validator">{{ a.validator_nom }}</div>
                   <p class="comment" *ngIf="a.commentaire">"{{ a.commentaire }}"</p>
                   <span class="date">{{ a.created_at | date:'dd/MM HH:mm' }}</span>
                </div>
              </div>
            </section>

            <section class="card history-card">
              <div class="card-header">
                <h3>Historique des Statuts</h3>
              </div>
              <div class="timeline">
                <div class="timeline-item" *ngFor="let h of d.historique">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <span class="time">{{ h.created_at | date:'dd/MM HH:mm' }}</span>
                    <span class="status-change">{{ h.statut_nouveau }}</span>
                    <p class="comment">{{ h.commentaire }}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Modal de Prévisualisation -->
        <div class="modal-overlay" *ngIf="selectedDoc()" (click)="selectedDoc.set(null)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ selectedDoc().nom }}</h3>
              <button class="btn-close" (click)="selectedDoc.set(null)">×</button>
            </div>
            <div class="modal-body">
              <iframe *ngIf="selectedDoc().url.endsWith('.pdf')" [src]="getSafeUrl(selectedDoc().url)" width="100%" height="600px"></iframe>
              <img *ngIf="isImage(selectedDoc().url)" [src]="toApiUrl(selectedDoc().url)" alt="Prévisualisation" style="max-width: 100%; max-height: 80vh;">
              <div *ngIf="!selectedDoc().url.endsWith('.pdf') && !isImage(selectedDoc().url)" class="preview-unavailable">
                Prévisualisation non disponible pour ce type de fichier.
                <button class="btn btn-primary" (click)="telechargerDoc(selectedDoc())">Télécharger</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #loading>
        <div class="loading-state">Chargement du dossier...</div>
      </ng-template>
    </app-layout>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .header-left { display: flex; gap: 1rem; align-items: center; }
    .btn-back { background: none; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; cursor: pointer; color: #64748b; }
    .btn-back:hover { background: #f8fafc; color: #0f172a; }
    
    h1 { font-size: 1.5rem; font-weight: 700; margin: 0; color: #0f172a; }
    .subtitle { color: #64748b; margin: 0.25rem 0 0; }

    .header-actions { display: flex; align-items: center; gap: 1rem; }
    .status-pill.big { padding: 0.5rem 1rem; font-size: 0.875rem; border-radius: 9999px; font-weight: 600; text-transform: uppercase; }
    .btn { padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: #2563eb; color: white; }

    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
    .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 1.5rem; }
    .card-header { padding: 1.25rem; border-bottom: 1px solid #f1f5f9; }
    .card-header h3 { font-size: 1rem; font-weight: 600; margin: 0; }

    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; padding: 1.5rem; }
    .info-item label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem; }
    .info-item span { font-weight: 500; color: #0f172a; }
    .overdue { color: #dc2626; }
    
    .description { padding: 0 1.5rem 1.5rem; }
    .description label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem; }
    .description p { color: #334155; line-height: 1.5; margin: 0; }

    .docs-list { padding: 0.75rem; }
    .doc-icon { width: 40px; height: 40px; background: #eff6ff; color: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .doc-info { flex: 1; display: flex; flex-direction: column; }
    .doc-name { font-size: 0.875rem; font-weight: 500; color: #0f172a; }
    .doc-meta { font-size: 0.75rem; color: #64748b; }

    .ia-card.highlight { border: 2px solid #8b5cf6; background: #f5f3ff; }
    .ia-content { padding: 1.5rem; text-align: center; }
    .score-container { margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; }
    .score-circle { 
      width: 80px; height: 80px; border-radius: 50%; border: 6px solid #e2e8f0; 
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .score-circle::after {
      content: ''; position: absolute; top: -6px; left: -6px; right: -6px; bottom: -6px;
      border-radius: 50%; border: 6px solid #8b5cf6;
      clip-path: polygon(50% 50%, -50% -50%, 150% -50%); /* Mock progress */
    }
    .score-val { font-size: 1.25rem; font-weight: 700; color: #6d28d9; }
    .score-label { font-size: 0.75rem; font-weight: 600; color: #6d28d9; text-transform: uppercase; margin-top: 0.5rem; }
    .ia-recommendation { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #ddd6fe; text-align: left; font-size: 0.875rem; }

    .timeline { padding: 1.5rem; position: relative; }
    .timeline::before { content: ''; position: absolute; left: 1.85rem; top: 1.5rem; bottom: 1.5rem; width: 2px; background: #e2e8f0; }
    .timeline-item { position: relative; padding-left: 2rem; margin-bottom: 1.5rem; }
    .timeline-marker { position: absolute; left: 0.25rem; top: 0.25rem; width: 12px; height: 12px; border-radius: 50%; background: #2563eb; border: 3px solid white; z-index: 1; }
    .timeline-content .time { font-size: 0.75rem; color: #64748b; display: block; }
    .timeline-content .status-change { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .timeline-content .comment { font-size: 0.8125rem; color: #475569; margin: 0.25rem 0 0; }

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
    .modal-content { background: white; border-radius: 12px; width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 1.125rem; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }
    .modal-body { padding: 1.5rem; overflow-y: auto; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
    .preview-unavailable { text-align: center; padding: 3rem; color: #64748b; display: flex; flex-direction: column; gap: 1rem; align-items: center; }

    .doc-actions { display: flex; gap: 0.5rem; }
    .btn-icon { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.375rem; border-radius: 6px; }
    .btn-icon:hover { color: #2563eb; background: #eff6ff; }

    .status-pill.nouveau { background: #eff6ff; color: #2563eb; }
    .status-pill.en_cours { background: #fefce8; color: #ca8a04; }
    .status-pill.cloture { background: #f0fdf4; color: #16a34a; }
    .status-pill.rejete { background: #fef2f2; color: #dc2626; }

    .alert-info { background: #eff6ff; color: #1e40af; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; border: 1px solid #bfdbfe; font-size: 0.9rem; }

    .btn-success { background: #10b981; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-outline { background: white; border: 1px solid #cbd5e1; color: #475569; }

    .approvals-list { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .approval-item { padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.8rem; }
    .approval-item.valide { border-left: 4px solid #10b981; }
    .approval-item.rejete { border-left: 4px solid #ef4444; }
    .approval-header { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
    .approval-header .step { font-weight: 700; color: #1e293b; }
    .approval-header .badge { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; }
    .valide .badge { color: #10b981; }
    .rejete .badge { color: #ef4444; }
    .validator { color: #64748b; font-weight: 500; }
    .approval-item .comment { font-style: italic; margin: 0.25rem 0; color: #475569; }
    .approval-item .date { font-size: 0.7rem; color: #94a3b8; }

    /* Stepper Styles */
    .stepper-card { padding: 1.5rem 2rem; margin-bottom: 2rem; }
    .stepper-container { display: flex; justify-content: space-between; position: relative; width: 100%; align-items: flex-start; }
    .stepper-progress { position: absolute; top: 20px; left: 12.5%; right: 12.5%; height: 4px; background: #e2e8f0; border-radius: 2px; z-index: 1; }
    .stepper-progress-bar { height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 2px; }
    .step-item { display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; z-index: 2; flex: 1; }
    .step-icon { width: 40px; height: 40px; border-radius: 50%; background: white; border: 3px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; color: #64748b; box-shadow: 0 0 0 4px white; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .step-label { margin-top: 0.75rem; display: flex; flex-direction: column; align-items: center; }
    .step-title { font-size: 0.875rem; font-weight: 600; color: #334155; }
    .step-desc { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }

    /* Step states */
    .step-item.completed .step-icon { background: #e6f4ea; border-color: #34a853; color: #34a853; }
    .step-item.completed .step-title { color: #1b5e20; }
    
    .step-item.active .step-icon { background: #eff6ff; border-color: #2563eb; color: #2563eb; box-shadow: 0 0 0 4px white, 0 0 0 6px rgba(37, 99, 235, 0.15); }
    .step-item.active .step-title { color: #2563eb; font-weight: 700; }

    .step-item.warning .step-icon { background: #fffbeb; border-color: #d97706; color: #d97706; box-shadow: 0 0 0 4px white, 0 0 0 6px rgba(217, 119, 6, 0.15); }
    .step-item.warning .step-title { color: #b45309; font-weight: 700; }
    
    .step-item.rejected .step-icon { background: #fef2f2; border-color: #ef4444; color: #ef4444; box-shadow: 0 0 0 4px white, 0 0 0 6px rgba(239, 68, 68, 0.15); }
    .step-item.rejected .step-title { color: #b91c1c; font-weight: 700; }

    .step-item.pending .step-icon { background: #f8fafc; border-color: #cbd5e1; color: #94a3b8; }
    .step-item.pending .step-title { color: #64748b; }
    
    .alert-icon { font-size: 1rem; line-height: 1; }
  `]
})
export class DossierDetailComponent implements OnInit {
  private dossierService = inject(DossierService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  
  dossier = signal<any>(null);
  selectedDoc = signal<any>(null);

  // Auth User
  user = this.authService.user;

  ngOnInit() {
    this.reloadDossier();
  }

  reloadDossier() {
    const id = this.route.snapshot.params['id'];
    this.dossierService.getDossier(id).subscribe(d => this.dossier.set(d));
  }

  goBack() { this.router.navigate(['/dossiers']); }
  
  traiter() {
    this.router.navigate(['/dossiers', this.dossier().id, 'traitement']);
  }

  // ── WORKFLOW METHODS ──

  isCurrentValidator(): boolean {
    const d = this.dossier();
    const user = this.user();
    if (!d || !d.current_step_id || !user) return false;
    return user.role_organisation_id === d.current_step.role_organisation_id;
  }

  soumettreWorkflow() {
    if (!confirm('Soumettre ce dossier pour validation hiérarchique ?')) return;
    this.http.post<any>(`/api/dossiers/${this.dossier().id}/workflow/soumettre`, {}).subscribe({
      next: () => {
        this.reloadDossier();
        this.toastService.success('Dossier soumis avec succès');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de la soumission.';
        // Détection d'erreur connue côté backend indiquant qu'aucun circuit de validation n'est défini
        if (msg.toLowerCase().includes('procéd') || msg.toLowerCase().includes('validation hiérarchique')) {
          if (this.user()?.role === 'admin' || this.user()?.role === 'super_admin') {
            const open = confirm(msg + '\n\nAucune procédure de validation n\'est configurée pour cette démarche. Voulez-vous ouvrir la configuration des circuits de validation maintenant ?');
            if (open) this.router.navigate(['/workflows']);
            else this.toastService.error(msg);
          } else {
            this.toastService.error(msg + ' Veuillez contacter un administrateur pour configurer le circuit de validation.');
          }
        } else {
          this.toastService.error(msg);
        }
      }
    });
  }

  validerWorkflow() {
    const comment = prompt('Commentaire de validation (visa) :') || '';
    this.http.post<any>(`/api/dossiers/${this.dossier().id}/workflow/valider`, { commentaire: comment }).subscribe({
      next: () => {
        this.reloadDossier();
        this.toastService.success('Étape validée avec succès');
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Erreur lors de la validation.')
    });
  }

  rejeterWorkflow() {
    const comment = prompt('Motif du rejet :');
    if (!comment) return;
    this.http.post<any>(`/api/dossiers/${this.dossier().id}/workflow/rejeter`, { commentaire: comment }).subscribe({
      next: () => {
        this.reloadDossier();
        this.toastService.warning('Étape rejetée');
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Erreur lors du rejet.')
    });
  }

  getStepState(stepNum: number, currentStatus: string): 'completed' | 'active' | 'pending' | 'warning' | 'rejected' {
    const status = currentStatus?.toLowerCase();
    
    if (stepNum === 1) {
      if (status === 'nouveau') return 'active';
      return 'completed';
    }
    
    if (stepNum === 2) {
      if (status === 'nouveau') return 'pending';
      if (status === 'en_cours') return 'active';
      if (status === 'doc_requis') return 'warning';
      return 'completed';
    }
    
    if (stepNum === 3) {
      if (['nouveau', 'en_cours', 'doc_requis'].includes(status)) return 'pending';
      if (status === 'en_validation') return 'active';
      return 'completed';
    }
    
    if (stepNum === 4) {
      if (status === 'cloture') return 'completed';
      if (status === 'rejete') return 'rejected';
      return 'pending';
    }
    
    return 'pending';
  }

  getStep2Desc(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'nouveau') return 'En attente';
    if (s === 'en_cours') return 'En cours';
    if (s === 'doc_requis') return 'Docs requis';
    return 'Finalisé';
  }

  getStep4Desc(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'cloture') return 'Approuvé';
    if (s === 'rejete') return 'Rejeté';
    return 'En attente';
  }

  getProgressBarWidth(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'nouveau') return '0%';
    if (s === 'en_cours' || s === 'doc_requis') return '33.3%';
    if (s === 'en_validation') return '66.6%';
    if (s === 'cloture' || s === 'rejete') return '100%';
    return '0%';
  }

  isOverdue(date: string) {
    return new Date(date) < new Date();
  }

  voirDoc(doc: any) {
    this.selectedDoc.set(doc);
  }

  telechargerDoc(doc: any) {
    const link = document.createElement('a');
    link.href = toApiUrl(doc.url);
    link.download = doc.nom;
    link.click();
  }

  // Expose toApiUrl au template (Angular n'autorise pas l'appel direct des
  // fonctions importees dans les bindings).
  toApiUrl(url: string) {
    return toApiUrl(url);
  }

  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(toApiUrl(url));
  }

  isImage(url: string) {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  // ── MULTI-VALIDATOR DETAILS AND ACTION METHODS ──

  getRequiredRolesForDoc(docName: string): string[] {
    const dem = this.dossier()?.type_demarche;
    if (!dem || !dem.documents_requis) return ['agent'];
    
    for (const req of dem.documents_requis) {
      if (typeof req === 'string' && req === docName) {
        return ['agent'];
      }
      if (typeof req === 'object' && req.nom === docName) {
        return req.roles_validateurs || ['agent'];
      }
    }
    return ['agent'];
  }

  getValidationStatusString(doc: any): string {
    const required = this.getRequiredRolesForDoc(doc.nom);
    const approvals = doc.approvals || [];
    
    const approvedRoles = approvals
      .filter((a: any) => a.statut === 'approuve')
      .map((a: any) => a.validator?.role || 'agent');

    const rejectedRoles = approvals
      .filter((a: any) => a.statut === 'rejete')
      .map((a: any) => a.validator?.role || 'agent');

    if (rejectedRoles.length > 0) {
      return `Rejeté par ${rejectedRoles.join(', ')}`;
    }

    const statusParts = required.map(role => {
      if (approvedRoles.includes(role)) {
        return `Validé par ${role}`;
      } else {
        return `En attente de ${role}`;
      }
    });

    return statusParts.join(' • ');
  }

  canCurrentUserValidate(doc: any): boolean {
    const currentUser = this.user();
    if (!currentUser) return false;
    
    if (currentUser.role === 'citoyen') return false;

    const required = this.getRequiredRolesForDoc(doc.nom);
    if (!required.includes(currentUser.role)) {
      if (currentUser.role !== 'super_admin') return false;
    }

    const approvals = doc.approvals || [];
    const alreadyValidated = approvals.some((a: any) => a.validator_id === currentUser.id);
    
    return !alreadyValidated;
  }

  approveDoc(doc: any) {
    const comment = prompt('Commentaire d\'approbation (optionnel) :') || '';
    this.dossierService.approveDocument(doc.id, comment).subscribe({
      next: () => {
        this.reloadDossier();
        this.toastService.success(`Document "${doc.nom}" approuvé`);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Erreur lors de l\'approbation du document.');
      }
    });
  }

  rejectDoc(doc: any) {
    const comment = prompt('Commentaire de rejet (obligatoire) :');
    if (comment === null) return;
    if (!comment.trim()) {
      this.toastService.warning('Le commentaire de rejet est obligatoire.');
      return;
    }

    this.dossierService.rejectDocument(doc.id, comment).subscribe({
      next: () => {
        this.reloadDossier();
        this.toastService.warning(`Document "${doc.nom}" rejeté`);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Erreur lors du rejet du document.');
      }
    });
  }
}
