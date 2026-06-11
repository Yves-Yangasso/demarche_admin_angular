import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { DossierService } from '../../core/services/dossier.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dossier-list',
  standalone: true,
  imports: [CommonModule, LayoutComponent, FormsModule],
  template: `
    <app-layout>
      <div class="header">
        <h1>Gestion des Dossiers</h1>
        <div class="actions-header" style="display: flex; gap: 0.75rem;">
           <button *ngIf="isCitoyen()" class="btn btn-primary" (click)="openRequestModal()">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             Nouvelle Demande
           </button>
           <button class="btn btn-secondary" (click)="exportExcel()">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             Exporter en Excel
           </button>
        </div>
      </div>

      <div class="filters-container card">
        <div class="main-filters">
          <div class="filter-group search">
            <label>Recherche</label>
            <div class="search-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Numéro, Citoyen..." (input)="search($event)">
            </div>
          </div>
          <div class="filter-group">
            <label>Statut</label>
            <select (change)="filterByStatut($event)">
              <option value="">Tous les statuts</option>
              <option value="nouveau">Nouveaux</option>
              <option value="en_cours">En cours</option>
              <option value="cloture">Clôturés</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Période</label>
            <div class="date-range">
              <input type="date" (change)="filterByDate($event, 'debut')">
              <span>au</span>
              <input type="date" (change)="filterByDate($event, 'fin')">
            </div>
          </div>
          <button class="btn btn-ghost" (click)="toggleAdvanced()" [class.active]="showAdvanced()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9v6l4 2v-8z"></path></svg>
            {{ showAdvanced() ? 'Masquer' : 'Filtres' }}
          </button>
        </div>

        <div class="advanced-filters-panel fade-in" *ngIf="showAdvanced()">
          <div class="filter-group">
            <label>Priorité</label>
            <select (change)="updateFilter('priorite', $event)">
              <option value="">Toutes</option>
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Catégorie</label>
            <select (change)="updateFilter('categorie_id', $event)">
              <option value="">Toutes les catégories</option>
              <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.nom }}</option>
            </select>
          </div>
          <div class="filter-group" *ngIf="isAdmin()">
            <label>Agent</label>
            <select (change)="updateFilter('agent_id', $event)">
              <option value="">Tous les agents</option>
              <option *ngFor="let agent of agents()" [value]="agent.id">{{ agent.prenom }} {{ agent.nom }}</option>
            </select>
          </div>
          <div class="filter-group toggle-group">
             <label class="toggle-control">
               <input type="checkbox" (change)="toggleLate($event)">
               <span class="control-label">Dossiers en retard</span>
             </label>
          </div>
        </div>
      </div>

      <div class="card table-container">
        <table *ngIf="dossiers().length > 0; else noData">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Citoyen</th>
              <th>Démarche</th>
              <th>Priorité</th>
              <th>Soumission</th>
              <th>Statut</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of dossiers()">
              <td><span class="ref">{{ d.numero }}</span></td>
              <td>{{ d.citoyen?.prenom }} {{ d.citoyen?.nom }}</td>
              <td>{{ d.type_demarche?.nom }}</td>
              <td>
                <span class="priority-badge" [ngClass]="d.priorite">
                  {{ d.priorite }}
                </span>
              </td>
              <td>{{ d.date_soumission | date:'dd MMM yyyy' }}</td>
              <td>
                <span class="status-pill" [ngClass]="d.statut">
                   {{ d.statut }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-icon" title="Voir détails" (click)="voirDetail(d.id)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <button class="btn-icon" title="Traiter" (click)="traiterDossier(d.id)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <ng-template #noData>
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            <p>Aucun dossier ne correspond à votre recherche.</p>
          </div>
        </ng-template>
      </div>

      <!-- MODAL MULTI-ÉTAPES CREATION DEMANDE -->
      <div class="modal-overlay" *ngIf="showRequestModal()" (click)="closeRequestModal()">
        <div class="modal-content glass-modal animate-scale" (click)="$event.stopPropagation()" style="max-width: 680px;">
          <div class="modal-header">
            <h3>Nouvelle Demande de Démarche</h3>
            <button class="close-btn" (click)="closeRequestModal()">×</button>
          </div>
          
          <!-- Indicateur d'étapes -->
          <div class="wizard-stepper" style="display: flex; justify-content: space-around; padding: 1rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 0.8rem; font-weight: 600; color: #64748b;">
            <div class="wizard-step" [class.active]="currentStep() === 1" [class.completed]="currentStep() > 1" (click)="goToStep(1)" style="cursor: pointer; display: flex; align-items: center; gap: 0.375rem;">
              <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #cbd5e1; color: white;">1</span> Collectivité
            </div>
            <div class="wizard-step" [class.active]="currentStep() === 2" [class.completed]="currentStep() > 2" (click)="goToStep(2)" style="cursor: pointer; display: flex; align-items: center; gap: 0.375rem;">
              <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #cbd5e1; color: white;">2</span> Démarche
            </div>
            <div class="wizard-step" [class.active]="currentStep() === 3" [class.completed]="currentStep() > 3" (click)="goToStep(3)" style="cursor: pointer; display: flex; align-items: center; gap: 0.375rem;">
              <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #cbd5e1; color: white;">3</span> Détails
            </div>
            <div class="wizard-step" [class.active]="currentStep() === 4" style="display: flex; align-items: center; gap: 0.375rem;">
              <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #cbd5e1; color: white;">4</span> Documents
            </div>
          </div>

          <div class="modal-body modal-scroll" style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;">
            
            <!-- ÉTAPE 1: CHOIX DE LA COLLECTIVITÉ -->
            <div *ngIf="currentStep() === 1" class="fade-in">
              <h4 style="margin-top: 0; color: #1e293b; margin-bottom: 1rem;">Où souhaitez-vous déposer votre demande ?</h4>
              <div class="grid-list" style="display: grid; grid-template-columns: 1fr; gap: 0.75rem;">
                <div *ngFor="let coll of collectivites()" (click)="selectCollectivite(coll.id)" class="selection-card" style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s;">
                  <strong style="color: #0f172a; display: block; font-size: 0.95rem;">{{ coll.nom }}</strong>
                  <span style="font-size: 0.75rem; color: #64748b;">{{ coll.region }} • {{ coll.type }}</span>
                </div>
              </div>
            </div>

            <!-- ÉTAPE 2: CHOIX DE LA DÉMARCHE -->
            <div *ngIf="currentStep() === 2" class="fade-in">
              <h4 style="margin-top: 0; color: #1e293b; margin-bottom: 1rem;">Sélectionnez le type de démarche</h4>
              <div class="grid-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div *ngFor="let dem of demarches()" (click)="selectDemarche(dem)" class="selection-card" style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <strong style="color: #0f172a; display: block; font-size: 0.9rem;">{{ dem.nom }}</strong>
                    <span *ngIf="dem.nom_wolof" style="font-size: 0.75rem; color: #2563eb; font-style: italic; display: block; margin-top: 0.25rem;">({{ dem.nom_wolof }})</span>
                    <p style="font-size: 0.75rem; color: #64748b; margin: 0.5rem 0 0 0; line-height: 1.3;">{{ dem.description || 'Aucune description' }}</p>
                  </div>
                  <div style="margin-top: 0.75rem; border-top: 1px solid #f1f5f9; padding-top: 0.5rem; display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 600; color: #475569;">
                    <span>Délai : {{ dem.delai_traitement_jours }}j</span>
                    <span style="color: #10b981;">{{ dem.frais > 0 ? dem.frais + ' F' : 'Gratuit' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ÉTAPE 3: INFORMATIONS DOSSIER -->
            <div *ngIf="currentStep() === 3" class="fade-in">
              <h4 style="margin-top: 0; color: #1e293b; margin-bottom: 1rem;">Informations complémentaires sur votre demande</h4>
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group" style="display: flex; flex-direction: column; gap: 0.375rem;">
                  <label style="font-size: 0.8rem; font-weight: 600; color: #475569;">Objet / Titre de la demande <span style="color: #ef4444;">*</span></label>
                  <input type="text" [(ngModel)]="formTitre" placeholder="ex: Acte de naissance pour inscription scolaire" class="form-control">
                </div>
                <div class="form-group" style="display: flex; flex-direction: column; gap: 0.375rem;">
                  <label style="font-size: 0.8rem; font-weight: 600; color: #475569;">Description / Commentaire explicatif</label>
                  <textarea [(ngModel)]="formDescription" placeholder="Détaillez votre besoin ou ajoutez des précisions pour les agents instructeurs..." rows="4" class="form-control"></textarea>
                </div>
              </div>
            </div>

            <!-- ÉTAPE 4: TÉLÉVERSEMENT DES DOCUMENTS REQUIS -->
            <div *ngIf="currentStep() === 4" class="fade-in">
              <h4 style="margin-top: 0; color: #1e293b; margin-bottom: 1rem;">Téléverser les documents requis</h4>
              <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1.5rem;">Veuillez fournir un fichier pour chaque document obligatoire ci-dessous.</p>
              
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div *ngFor="let doc of selectedDemarche()?.documents_requis" class="doc-upload-item" style="padding: 1rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                  <div style="flex: 1;">
                    <strong style="font-size: 0.875rem; color: #334155; display: block;">{{ doc.nom || doc }}</strong>
                    <span style="font-size: 0.75rem; color: #64748b;">Format autorisé : PDF, PNG, JPG (Max 5Mo)</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span *ngIf="selectedFiles[doc.nom || doc]" style="font-size: 0.75rem; font-weight: 600; color: #10b981; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ selectedFiles[doc.nom || doc].name }}
                    </span>
                    <label class="btn btn-secondary" style="margin: 0; cursor: pointer; padding: 0.375rem 0.75rem; font-size: 0.75rem;">
                      {{ selectedFiles[doc.nom || doc] ? 'Modifier' : 'Sélectionner' }}
                      <input type="file" (change)="onFileSelected($event, doc.nom || doc)" style="display: none;" accept=".pdf,.png,.jpg,.jpeg">
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <div class="modal-footer" style="padding: 1.25rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
            <button class="btn btn-secondary" (click)="prevStep()" [disabled]="currentStep() === 1">Précédent</button>
            
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary" (click)="closeRequestModal()">Annuler</button>
              
              <button *ngIf="currentStep() === 3" class="btn btn-primary" (click)="nextStep()" [disabled]="!formTitre.trim()">Suivant</button>
              <button *ngIf="currentStep() === 4" class="btn btn-primary" (click)="submitRequest()" [disabled]="!isStep4Valid() || submitting()">
                {{ submitting() ? 'Envoi...' : 'Soumettre la Demande' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    
    .btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; font-size: 0.875rem; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .card { background: white; border-radius: 8px; padding: 1.25rem; border: 1px solid #e2e8f0; margin-bottom: 1.25rem; }
    
    .filters-container { display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; }
    .main-filters { display: flex; gap: 1.5rem; align-items: flex-end; flex-wrap: wrap; }
    .advanced-filters-panel { 
      display: flex; gap: 1.5rem; flex-wrap: wrap; padding-top: 1rem; 
      border-top: 1px solid #f1f5f9; align-items: flex-end;
    }
    
    .filter-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .filter-group label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.025em; }
    .filter-group select, .search-input input, .date-range input { 
      padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; outline: none; background: #fff;
    }
    
    .btn-ghost { background: #f1f5f9; color: #475569; padding: 0.625rem 1rem; border-radius: 8px; display: flex; align-items: center; gap: 0.5rem; border: 1px solid transparent; }
    .btn-ghost:hover { background: #e2e8f0; }
    .btn-ghost.active { border-color: #2563eb; color: #2563eb; background: #eff6ff; }

    .toggle-control { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; height: 38px; }
    .toggle-control input { width: 1.1rem; height: 1.1rem; cursor: pointer; }
    .control-label { font-size: 0.875rem; font-weight: 500; color: #475569; }

    .date-range { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.875rem; }

    .priority-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
    .priority-badge.basse { background: #f1f5f9; color: #64748b; }
    .priority-badge.normale { background: #eff6ff; color: #3b82f6; }
    .priority-badge.haute { background: #fff7ed; color: #f97316; }
    .priority-badge.urgente { background: #fef2f2; color: #dc2626; }

    .search { flex: 1; min-width: 250px; }
    .search-input { position: relative; display: flex; align-items: center; }
    .search-input svg { position: absolute; left: 0.75rem; color: #94a3b8; }
    .search-input input { padding-left: 2.25rem; width: 100%; }

    .table-container { padding: 0; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f8fafc; padding: 0.875rem 1.25rem; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.875rem; }
    
    .ref { font-family: monospace; font-weight: 600; color: #2563eb; }

    .status-pill { 
      padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;
    }
    .status-pill.nouveau { background: #eff6ff; color: #2563eb; }
    .status-pill.en_cours { background: #fefce8; color: #ca8a04; }
    .status-pill.cloture { background: #f0fdf4; color: #16a34a; }
    .status-pill.rejete { background: #fef2f2; color: #dc2626; }

    .actions { text-align: right; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; border-radius: 4px; transition: all 0.15s; margin-left: 0.25rem; }
    .btn-icon:hover { background: #f1f5f9; color: #2563eb; }

    .empty-state { padding: 4rem; text-align: center; color: #64748b; display: flex; flex-direction: column; align-items: center; gap: 1rem; }

    /* Modal Overlay & Glassmorphism */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
    .glass-modal { background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
    .modal-content { width: 100%; display: flex; flex-direction: column; max-height: 90vh; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
    .close-btn { background: none; border: none; font-size: 1.75rem; cursor: pointer; color: #94a3b8; line-height: 1; }
    .form-control { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.875rem; outline: none; }
    .form-control:focus { border-color: #2563eb; }

    .wizard-step.active { color: #2563eb; }
    .wizard-step.active .step-num { background: #2563eb !important; }
    .wizard-step.completed { color: #10b981; }
    .wizard-step.completed .step-num { background: #10b981 !important; }
    .selection-card:hover { border-color: #2563eb !important; background: #f8fafc; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }

    .fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .animate-scale { animation: scaleUp 0.15s ease-out; }
    @keyframes scaleUp { from { transform: scale(0.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class DossierListComponent implements OnInit {
  private dossierService = inject(DossierService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  dossiers = signal<any[]>([]);
  filters = signal<any>({});

  // Advanced Filters
  showAdvanced = signal(false);
  categories = signal<any[]>([]);
  agents = signal<any[]>([]);

  // Auth roles computed
  user = this.authService.user;
  isCitoyen = computed(() => this.user()?.role === 'citoyen');
  isAdmin = computed(() => ['admin', 'super_admin'].includes(this.user()?.role || ''));

  // Request Modal States
  showRequestModal = signal<boolean>(false);
  currentStep = signal<number>(1);
  submitting = signal<boolean>(false);

  // Data lists for request wizard
  collectivites = signal<any[]>([]);
  demarches = signal<any[]>([]);

  // Wizard Selections & forms
  selectedCollectiviteId = signal<number | null>(null);
  selectedDemarche = signal<any | null>(null);
  formTitre = '';
  formDescription = '';
  selectedFiles: { [docName: string]: File } = {};

  ngOnInit() {
    this.loadDossiers();
    this.loadFilterData();
  }

  loadFilterData() {
    this.dossierService.getCategories().subscribe(res => this.categories.set(res));
    if (this.isAdmin()) {
      this.http.get<any[]>('/api/utilisateurs', { params: { role: 'agent' } }).subscribe(res => this.agents.set(res));
    }
  }

  loadDossiers() {
    this.dossierService.getDossiers(this.filters()).subscribe(res => {
      this.dossiers.set(res.dossiers);
    });
  }

  toggleAdvanced() {
    this.showAdvanced.update(v => !v);
  }

  updateFilter(key: string, event: any) {
    const value = event.target.value;
    this.filters.update(f => ({ ...f, [key]: value }));
    this.loadDossiers();
  }

  toggleLate(event: any) {
    this.filters.update(f => ({ ...f, en_retard: event.target.checked }));
    this.loadDossiers();
  }

  filterByStatut(event: any) {
    this.filters.update(f => ({ ...f, statut: event.target.value }));
    this.loadDossiers();
  }

  filterByDate(event: any, type: 'debut' | 'fin') {
    const key = type === 'debut' ? 'date_debut' : 'date_fin';
    this.filters.update(f => ({ ...f, [key]: event.target.value }));
    this.loadDossiers();
  }

  search(event: any) {
    this.filters.update(f => ({ ...f, search: event.target.value }));
    this.loadDossiers();
  }

  voirDetail(id: number) {
    this.router.navigate(['/dossiers', id]);
  }

  traiterDossier(id: number) {
    this.router.navigate(['/dossiers', id, 'traitement']);
  }

  exportExcel() {
    console.log('Exportation Excel avec filtres:', this.filters());
  }

  // WIZARD METHODS
  openRequestModal() {
    this.currentStep.set(1);
    this.selectedCollectiviteId.set(null);
    this.selectedDemarche.set(null);
    this.formTitre = '';
    this.formDescription = '';
    this.selectedFiles = {};
    this.showRequestModal.set(true);

    this.http.get<any[]>('/api/collectivites').subscribe({
      next: (res) => this.collectivites.set(res)
    });
  }

  closeRequestModal() {
    this.showRequestModal.set(false);
  }

  goToStep(step: number) {
    if (step === 1) {
      this.currentStep.set(1);
    } else if (step === 2 && this.selectedCollectiviteId()) {
      this.currentStep.set(2);
    } else if (step === 3 && this.selectedDemarche()) {
      this.currentStep.set(3);
    }
  }

  selectCollectivite(id: number) {
    this.selectedCollectiviteId.set(id);
    this.selectedDemarche.set(null);
    this.demarches.set([]);
    
    this.http.get<any[]>(`/api/collectivites/${id}/type-demarches`).subscribe({
      next: (res) => this.demarches.set(res)
    });
    this.currentStep.set(2);
  }

  selectDemarche(dem: any) {
    this.selectedDemarche.set(dem);
    this.formTitre = dem.nom;
    this.selectedFiles = {};
    this.currentStep.set(3);
  }

  nextStep() {
    const cur = this.currentStep();
    if (cur === 3 && this.formTitre.trim()) {
      this.currentStep.set(4);
    }
  }

  prevStep() {
    const cur = this.currentStep();
    if (cur > 1) {
      this.currentStep.set(cur - 1);
    }
  }

  onFileSelected(event: any, docName: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[docName] = file;
    }
  }

  isStep4Valid(): boolean {
    const dem = this.selectedDemarche();
    if (!dem) return false;
    return (dem.documents_requis || []).every((doc: any) => {
      const docName = doc.nom || doc;
      return !!this.selectedFiles[docName];
    });
  }

  submitRequest() {
    const dem = this.selectedDemarche();
    const collId = this.selectedCollectiviteId();
    if (!dem || !collId || this.submitting()) return;

    this.submitting.set(true);

    const dossierData = {
      titre: this.formTitre,
      description: this.formDescription,
      collectivite_id: collId,
      type_demarche_id: dem.id
    };

    this.dossierService.creerDossier(dossierData).subscribe({
      next: (dossier) => {
        const uploads = Object.entries(this.selectedFiles).map(([docName, file]) => {
          return this.dossierService.uploadDocument(dossier.id, file, docName, 'justificatif', true);
        });

        if (uploads.length === 0) {
          this.finishSubmit();
        } else {
          let index = 0;
          const uploadNext = () => {
            if (index < uploads.length) {
              uploads[index].subscribe({
                next: () => {
                  index++;
                  uploadNext();
                },
                error: (err) => {
                  console.error('Erreur téléversement fichier:', err);
                  index++;
                  uploadNext();
                }
              });
            } else {
              this.finishSubmit();
            }
          };
          uploadNext();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err?.error?.message || 'Erreur lors de la création du dossier.');
      }
    });
  }

  private finishSubmit() {
    this.submitting.set(false);
    this.closeRequestModal();
    this.loadDossiers();
  }
}
