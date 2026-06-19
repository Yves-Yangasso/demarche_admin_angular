import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { DossierService } from '../../core/services/dossier.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-procedures-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="header-section">
        <div>
          <h1>Administration des Procédures</h1>
          <p class="subtitle">
            Configuration experte : catégories, démarches métier et circuits de validation.
          </p>
        </div>
        <div class="actions-header">
          <button
            *ngIf="activeTab() === 'categories' && isWriteAllowed()"
            class="btn btn-primary"
            (click)="openCategoryModal()"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nouvelle Catégorie
          </button>
          <button
            *ngIf="activeTab() === 'demarches' && isWriteAllowed()"
            class="btn btn-primary"
            (click)="openDemarcheModal()"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nouvelle Démarche
          </button>
          <button
            *ngIf="activeTab() === 'workflows' && isWriteAllowed()"
            class="btn btn-primary"
            (click)="openWfModal()"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nouveau Workflow
          </button>
        </div>
      </div>

      <!-- Onglets Style Premium -->
      <div class="tabs-container">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'categories'"
          (click)="setTab('categories')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            ></path>
          </svg>
          1. Catégories
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'demarches'"
          (click)="setTab('demarches')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <path d="M9 6h6"></path>
            <path d="M9 10h6"></path>
          </svg>
          2. Démarches
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'workflows'"
          (click)="setTab('workflows')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          3. Circuits (Workflows)
        </button>
      </div>

      <!-- CONTENU ONGLET 1: CATÉGORIES -->
      <div *ngIf="activeTab() === 'categories'" class="tab-content fade-in">
        <div class="grid-categories">
          <div class="category-card" *ngFor="let cat of categories()">
            <div class="card-status-bar" [class.inactive]="!cat.actif"></div>
            <div class="category-card-body">
              <div class="category-icon-wrapper">{{ cat.icon || '📁' }}</div>
              <div class="category-info">
                <h3>{{ cat.nom }}</h3>
                <span class="badge-code">{{ cat.code }}</span>
                <p class="category-description">{{ cat.description }}</p>
                <div class="category-footer">
                  <span class="price-base">{{ cat.prix_base | number }} F CFA</span>
                  <div class="card-actions" *ngIf="isWriteAllowed()">
                    <button class="btn-icon edit" (click)="openCategoryModal(cat)" title="Modifier">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      class="btn-icon status"
                      (click)="toggleCategoryStatus(cat)"
                      [title]="cat.actif ? 'Désactiver' : 'Activer'"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CONTENU ONGLET 2: DÉMARCHES -->
      <div *ngIf="activeTab() === 'demarches'" class="tab-content fade-in">
        <div class="search-filter-container card fade-in">
          <div class="search-wrapper">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Rechercher une démarche"
              (input)="filterDemarches($event)"
              class="search-input"
            />
          </div>
          <div class="vertical-divider"></div>
          <div class="category-filter">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
              ></path>
            </svg>
            <div class="select-wrapper">
              <select (change)="filterByCategory($event)" class="filter-select">
                <option value="">Toutes les catégories</option>
                <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.nom }}</option>
              </select>
              <span class="chevron">▾</span>
            </div>
          </div>
        </div>

        <div class="card table-wrapper">
          <table class="premium-table">
            <thead>
              <tr>
                <th>Procédure / Code</th>
                <th>Validation</th>
                <th>Délai / Frais</th>
                <th>Exigences</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let group of demarchesByCategory()">
                <tr class="category-row">
                  <td colspan="5">
                    <div class="category-row-content">
                      <span>{{ group.category.nom }}</span>
                      <small
                        >{{ group.items.length }} procédure{{
                          group.items.length > 1 ? 's' : ''
                        }}</small
                      >
                    </div>
                  </td>
                </tr>
                <tr *ngFor="let dem of group.items">
                  <td>
                    <strong>{{ dem.nom }}</strong>
                    <div class="demarche-code">{{ dem.code }} • {{ dem.nom_wolof || '-' }}</div>
                  </td>
                  <td>
                    <span class="wf-status-pill" [class.active]="dem.workflow">
                      {{
                        dem.workflow
                          ? 'Workflow (' + dem.workflow.steps.length + ' étapes)'
                          : 'Validation simple'
                      }}
                    </span>
                  </td>
                  <td>
                    <div class="meta-row">
                      <strong>{{ dem.delai_traitement_jours }} j</strong>
                    </div>
                    <div class="meta-row amount">{{ dem.frais | number }} F</div>
                  </td>
                  <td>
                    <div class="counts">
                      <span class="count docs">{{
                        requirementDocumentLabel(dem.documents_requis?.length || 0)
                      }}</span>
                      <span class="count criteria">{{
                        requirementCriterionLabel(dem.criteres?.length || 0)
                      }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="table-actions" *ngIf="isWriteAllowed()">
                      <button
                        class="btn-icon edit"
                        (click)="openDemarcheModal(dem)"
                        title="Modifier"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          ></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        class="btn-icon delete"
                        (click)="desactiverDemarche(dem)"
                        title="Supprimer"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-container>
              <tr *ngIf="demarchesByCategory().length === 0">
                <td colspan="5" class="empty-table">
                  Aucune procédure trouvée pour cette catégorie.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CONTENU ONGLET 3: WORKFLOWS -->
      <div *ngIf="activeTab() === 'workflows'" class="tab-content fade-in">
        <div class="workflow-grid">
          <div class="card wf-card" *ngFor="let wf of workflows()">
            <div class="wf-header">
              <h3>{{ wf.nom }}</h3>
              <span class="type-badge">{{ getDemarcheNom(wf.type_demarche_id) }}</span>
            </div>
            <div class="steps-list">
              <div class="step-item" *ngFor="let step of wf.steps; let i = index">
                <div class="step-num">{{ i + 1 }}</div>
                <div class="step-details">
                  <div class="name">{{ step.nom }}</div>
                  <div class="role">
                    Par : <strong>{{ step.role_organisation_nom }}</strong>
                  </div>
                </div>
                <button *ngIf="isWriteAllowed()" class="btn-del" (click)="deleteStep(step.id)">
                  ×
                </button>
              </div>
              <div class="empty-steps" *ngIf="wf.steps.length === 0">Aucune étape définie.</div>
            </div>
            <button
              *ngIf="isWriteAllowed()"
              class="btn btn-outline btn-full btn-sm"
              (click)="openStepModal(wf)"
            >
              + Ajouter une étape
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL CATÉGORIE -->
      <div class="modal-overlay" *ngIf="showCategoryModal()" (click)="closeCategoryModal()">
        <div class="modal-content glass-modal animate-scale" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingCategory() ? 'Modifier la Catégorie' : 'Nouvelle Catégorie' }}</h3>
            <button class="close-btn" (click)="closeCategoryModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group span-half">
                <label>Code <span class="req">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="catForm.code"
                  class="form-control"
                  [disabled]="!!editingCategory()"
                />
              </div>
              <div class="form-group span-half">
                <label>Nom <span class="req">*</span></label>
                <input type="text" [(ngModel)]="catForm.nom" class="form-control" />
              </div>
              <div class="form-group span-full">
                <label>Description</label>
                <textarea
                  [(ngModel)]="catForm.description"
                  rows="2"
                  class="form-control"
                ></textarea>
              </div>
              <div class="form-group span-half">
                <label>Frais de base</label>
                <input type="number" [(ngModel)]="catForm.prix_base" class="form-control" />
              </div>
              <div class="form-group span-half">
                <label>Icône (Émoji)</label>
                <input type="text" [(ngModel)]="catForm.icon" class="form-control" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeCategoryModal()">Annuler</button>
            <button class="btn btn-primary" (click)="saveCategory()" [disabled]="saving()">
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL DÉMARCHE COMPLET -->
      <div class="modal-overlay" *ngIf="showDemarcheModal()" (click)="closeDemarcheModal()">
        <div
          class="modal-content glass-modal big-modal animate-scale"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <h3>{{ editingDemarche() ? 'Modifier la Démarche' : 'Nouvelle Démarche' }}</h3>
            <button class="close-btn" (click)="closeDemarcheModal()">×</button>
          </div>
          <div class="modal-body modal-scroll">
            <div class="form-grid">
              <!-- Infos de base -->
              <div class="form-group span-half">
                <label>Code <span class="req">*</span></label>
                <input type="text" [(ngModel)]="demForm.code" class="form-control" />
              </div>
              <div class="form-group span-half">
                <label>Nom Officiel <span class="req">*</span></label>
                <input type="text" [(ngModel)]="demForm.nom" class="form-control" />
              </div>
              <div class="form-group span-half">
                <label>Catégorie <span class="req">*</span></label>
                <select [(ngModel)]="demForm.categorie_id" class="form-control">
                  <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.nom }}</option>
                </select>
              </div>
              <div class="form-group span-half">
                <label>Délai (jours)</label>
                <input
                  type="number"
                  [(ngModel)]="demForm.delai_traitement_jours"
                  class="form-control"
                />
              </div>

              <!-- List Builder: Documents avec Rôles -->
              <div class="form-group span-full list-builder-section">
                <label>Documents requis & Validateurs</label>
                <div class="list-items">
                  <div
                    class="list-item"
                    *ngFor="let doc of demForm.documents_requis; let i = index"
                  >
                    <div class="item-info">
                      <strong>{{ doc.nom }}</strong>
                      <div class="roles-selection">
                        <label
                          ><input
                            type="checkbox"
                            [checked]="doc.roles_validateurs?.includes('agent')"
                            (change)="toggleRoleInDoc(i, 'agent')"
                          />
                          Agent</label
                        >
                        <label
                          ><input
                            type="checkbox"
                            [checked]="doc.roles_validateurs?.includes('admin')"
                            (change)="toggleRoleInDoc(i, 'admin')"
                          />
                          Admin</label
                        >
                      </div>
                    </div>
                    <button class="btn-del" (click)="removeDocument(i)">×</button>
                  </div>
                </div>
                <div class="input-row">
                  <input
                    type="text"
                    [(ngModel)]="newDocText"
                    placeholder="ex: CNI certifiée"
                    class="form-control"
                    (keyup.enter)="addDocument()"
                  />
                  <button class="btn btn-secondary btn-sm" (click)="addDocument()">Ajouter</button>
                </div>
              </div>

              <!-- List Builder: Critères -->
              <div class="form-group span-full list-builder-section">
                <label>Critères d'évaluation</label>
                <div class="list-items">
                  <div class="list-item" *ngFor="let crit of demForm.criteres; let i = index">
                    <span>{{ crit }}</span>
                    <button class="btn-del" (click)="removeCriterion(i)">×</button>
                  </div>
                </div>
                <div class="input-row">
                  <input
                    type="text"
                    [(ngModel)]="newCriterionText"
                    placeholder="ex: Résidence confirmée"
                    class="form-control"
                    (keyup.enter)="addCriterion()"
                  />
                  <button class="btn btn-secondary btn-sm" (click)="addCriterion()">Ajouter</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeDemarcheModal()">Annuler</button>
            <button class="btn btn-primary" (click)="saveDemarche()" [disabled]="saving()">
              Enregistrer
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
              <input
                type="text"
                [(ngModel)]="wfForm.nom"
                placeholder="ex: Validation Urbanisme"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>Type de démarche concerné</label>
              <select [(ngModel)]="wfForm.type_demarche_id" class="form-control">
                <option *ngFor="let d of demarches()" [value]="d.id">{{ d.nom }}</option>
              </select>
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
              <input
                type="text"
                [(ngModel)]="stepForm.nom"
                placeholder="ex: Visa Secrétaire Général"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>Rôle hiérarchique habilité</label>
              <select [(ngModel)]="stepForm.role_organisation_id" class="form-control">
                <option *ngFor="let r of roles()" [value]="r.id">{{ r.nom }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ordre (position dans la chaîne)</label>
              <input type="number" [(ngModel)]="stepForm.ordre" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" (click)="saveStep()">Ajouter l'étape</button>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [
    `
      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      h1 {
        font-size: 1.8rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.5px;
      }

      .subtitle {
        color: #64748b;
        font-size: 0.95rem;
        margin-top: 0.25rem;
      }

      /* Buttons */
      .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        font-size: 0.875rem;
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .btn-primary {
        background: linear-gradient(135deg, #10b981, #10b981);
        color: white;
        box-shadow: 0 4px 12px rgba(50, 147, 39, 0.2);
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(50, 147, 39, 0.2);
      }

      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
      }

      .btn-outline {
        background: white;
        border: 1.5px solid #e2e8f0;
        color: #475569;
      }

      .btn-outline:hover {
        border-color: #10b981;
        color: #10b981;
      }

      .btn-full {
        width: 100%;
        justify-content: center;
      }

      .btn-sm {
        padding: 0.4rem 0.8rem;
        font-size: 0.75rem;
      }

      /* Tabs */
      .tabs-container {
        display: flex;
        gap: 0.5rem;
        border-bottom: 1.5px solid #e2e8f0;
        margin-bottom: 2rem;
        padding: 0.25rem;
      }

      .tab-btn {
        background: none;
        border: none;
        padding: 0.875rem 1.25rem;
        font-size: 0.9rem;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        position: relative;
        border-radius: 8px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.625rem;
      }

      .tab-btn:hover {
        color: #0f172a;
        background: #f8fafc;
      }

      .tab-btn.active {
        color: #10b981;
        background: #eff6ff;
      }

      .tab-btn.active::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 10%;
        right: 12.5%;
        height: 3px;
        background: #10b981;
        border-radius: 10px;
      }

      /* Category Cards */
      .grid-categories {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
      }

      .category-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: all 0.3s;
      }

      .category-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.12);
      }

      .card-status-bar {
        height: 5px;
        background: linear-gradient(90deg, #10b981, #34d399);
      }

      .card-status-bar.inactive {
        background: #cbd5e1;
      }

      .category-card-body {
        padding: 1.75rem;
        display: flex;
        gap: 1.25rem;
      }

      .category-icon-wrapper {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.75rem;
        flex-shrink: 0;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .category-info h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.2px;
      }

      .category-description {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0.75rem 0;
        height: 2.6rem;
        overflow: hidden;
        line-height: 1.5;
      }

      .badge-code {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        color: #475569;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 700;
        display: inline-block;
      }

      /* Tables */
      .table-wrapper {
        border-radius: 20px;
        padding: 0.5rem;
      }

      .premium-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }

      .premium-table th {
        padding: 1.25rem 1rem;
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        border-bottom: 2px solid #f1f5f9;
      }

      .premium-table td {
        padding: 1.25rem 1rem;
        border-bottom: 1.5px solid #f8fafc;
        font-size: 0.9rem;
      }

      .category-row td {
        padding: 0.8rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }

      .category-row-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        color: #334155;
        font-weight: 800;
      }

      .category-row-content small {
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .empty-table {
        text-align: center;
        color: #64748b;
        font-weight: 600;
        padding: 2rem !important;
      }

      .demarche-code {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 0.25rem;
        font-weight: 600;
      }

      .wf-status-pill {
        font-size: 0.75rem;
        padding: 4px 10px;
        border-radius: 9999px;
        background: #f1f5f9;
        color: #64748b;
        font-weight: 700;
      }

      .wf-status-pill.active {
        background: #e0f2fe;
        color: #0369a1;
        border: 1.5px solid #bae6fd;
      }

      /* Icons */
      .btn-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1.5px solid #e2e8f0;
        background: white;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        transition: all 0.2s;
      }

      .btn-icon:hover {
        background: #f8fafc;
        color: #0f172a;
        border-color: #cbd5e1;
        transform: scale(1.05);
      }

      .btn-icon.edit:hover {
        background: #eff6ff;
        color: #2563eb;
        border-color: #bfdbfe;
      }

      .btn-icon.delete:hover {
        background: #fef2f2;
        color: #ef4444;
        border-color: #fecaca;
      }

      .btn-icon.status:hover {
        background: #ecfdf5;
        color: #10b981;
        border-color: #a7f3d0;
      }

      /* Workflows */
      .workflow-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
      }

      .wf-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 1.75rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .type-badge {
        font-size: 0.7rem;
        background: #f1f5f9;
        padding: 2px 8px;
        border-radius: 6px;
        font-weight: 700;
        color: #475569;
      }

      .steps-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: #f8fafc;
        padding: 1rem;
        border-radius: 12px;
      }

      .step-item {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        background: white;
        padding: 0.75rem;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      }

      .step-num {
        width: 24px;
        height: 24px;
        background: #10b981;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 800;
      }

      .step-details .name {
        font-size: 0.85rem;
        font-weight: 700;
        color: #1e293b;
      }

      .step-details .role {
        font-size: 0.75rem;
        color: #64748b;
      }

      .btn-del {
        background: none;
        border: none;
        color: #cbd5e1;
        font-size: 1.25rem;
        cursor: pointer;
        line-height: 1;
      }

      .btn-del:hover {
        color: #ef4444;
      }

      /* Modals */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .glass-modal {
        background: white;
        border-radius: 24px;
        width: 100%;
        max-width: 580px;
        padding: 0;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
      }

      .big-modal {
        max-width: 800px;
      }

      .modal-header {
        padding: 1.5rem 2rem;
        border-bottom: 1.5px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 800;
        color: #0f172a;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.75rem;
        cursor: pointer;
        color: #94a3b8;
      }

      .modal-body {
        padding: 2rem;
      }

      .modal-scroll {
        max-height: 70vh;
        overflow-y: auto;
      }

      .modal-footer {
        padding: 1.5rem 2rem;
        background: #f8fafc;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }

      .span-half {
        grid-column: span 1;
      }

      .span-full {
        grid-column: span 2;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-size: 0.85rem;
        font-weight: 700;
        color: #334155;
      }

      .req {
        color: #ef4444;
      }

      .form-control {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 0.9rem;
        transition: all 0.2s;
        outline: none;
      }

      .form-control:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
      }

      /* List Builder Section */
      .list-builder-section {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.5rem;
        margin-top: 0.5rem;
      }

      .list-items {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        max-height: 250px;
        overflow-y: auto;
        padding-right: 0.5rem;
      }

      .list-item {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      }

      .item-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .roles-selection {
        display: flex;
        gap: 1rem;
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 600;
      }

      .roles-selection label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        cursor: pointer;
      }

      .input-row {
        display: flex;
        gap: 0.75rem;
      }

      .vertical-divider {
        width: 1.5px;
        height: 32px;
        background: #e2e8f0;
        margin: 0 0.5rem;
      }

      .search-filter-container {
        display: flex;
        align-items: center;
        padding: 0.75rem 1.5rem;
        gap: 1rem;
        margin-bottom: 1.5rem;
        border-radius: 16px;
        background: white;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }

      .search-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1rem;
        color: #94a3b8;
      }

      .search-input {
        width: 100%;
        border: none;
        outline: none;
        font-size: 0.95rem;
        color: #1e293b;
        font-weight: 500;
      }

      .search-input::placeholder {
        color: #94a3b8;
      }

      .category-filter {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: #64748b;
      }

      .category-filter svg {
        color: var(--primary-color);
      }

      .select-wrapper {
        position: relative;
        display: inline-block;
      }

      .filter-select {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        padding: 0.6rem 1.8rem 0.6rem 0.9rem;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-size: 0.95rem;
        font-weight: 700;
        color: #475569;
        cursor: pointer;
        background: #fff;
        min-width: 220px;
      }

      .filter-select:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 6px 18px rgba(37, 99, 235, 0.08);
      }

      .select-wrapper .chevron {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: #64748b;
        font-size: 0.9rem;
      }

      .fade-in {
        animation: fadeIn 0.4s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ProceduresAdminComponent implements OnInit {
  private dossierService = inject(DossierService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private http = inject(HttpClient);

  activeTab = signal<'categories' | 'demarches' | 'workflows'>('categories');
  categories = signal<any[]>([]);
  demarches = signal<any[]>([]);
  workflows = signal<any[]>([]);
  roles = signal<any[]>([]);

  demarcheFilters = signal<any>({ search: '', categorie_id: '' });
  filteredDemarches = computed(() => {
    const filters = this.demarcheFilters();
    const search = String(filters.search || '')
      .trim()
      .toLowerCase();
    const selectedCategory = this.categories().find(
      (cat) => String(cat.id) === String(filters.categorie_id || ''),
    );

    return this.demarches().filter((dem) => {
      const matchesSearch =
        !search ||
        [dem.nom, dem.code, dem.nom_wolof, dem.description].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(search),
        );

      const matchesCategory =
        !selectedCategory || this.matchesDemarcheCategory(dem, selectedCategory);

      return matchesSearch && matchesCategory;
    });
  });
  demarchesByCategory = computed(() => {
    const groups = new Map<string, { category: any; items: any[] }>();

    for (const dem of this.filteredDemarches()) {
      const category = this.findDemarcheCategory(dem) || {
        id: 'uncategorized',
        nom: 'Sans catégorie',
      };
      const key = String(category.id ?? category.code ?? category.nom);

      if (!groups.has(key)) {
        groups.set(key, { category, items: [] });
      }

      groups.get(key)!.items.push(dem);
    }

    return Array.from(groups.values());
  });

  loading = signal(false);
  saving = signal(false);

  // Modals visibility
  showCategoryModal = signal(false);
  showDemarcheModal = signal(false);
  showWfModal = signal(false);
  showStepModal = signal(false);

  // Forms
  editingCategory = signal<any>(null);
  catForm = { code: '', nom: '', description: '', prix_base: 0, icon: '' };

  editingDemarche = signal<any>(null);
  demForm = {
    code: '',
    nom: '',
    nom_wolof: '',
    description: '',
    categorie_id: null as any,
    frais: 0,
    delai_traitement_jours: 5,
    documents_requis: [] as any[],
    criteres: [] as string[],
  };
  newDocText = '';
  newCriterionText = '';

  wfForm = { nom: '', type_demarche_id: null as any };
  stepForm = { nom: '', role_organisation_id: null as any, ordre: 0, workflow_id: null as any };

  user = this.authService.user;
  isSuperAdmin = computed(() => this.user()?.role === 'super_admin');
  isWriteAllowed = computed(() => this.user()?.role === 'admin');

  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.loading.set(true);
    this.loadCategories();
    this.loadDemarches();
    this.loadWorkflows();
    this.loadRoles();
    this.loading.set(false);
  }

  setTab(tab: 'categories' | 'demarches' | 'workflows') {
    this.activeTab.set(tab);
  }

  // ── DATA LOADERS ──
  loadCategories() {
    this.dossierService.getCategories().subscribe((res) => this.categories.set(res));
  }

  loadDemarches() {
    this.dossierService.getDemarches().subscribe({
      next: (res) => {
        const list = this.extractDemarchesList(res);
        this.demarches.set(list);
        this.cacheDemarches(list);
      },
      error: (err) => {
        const cached = this.getCachedDemarches();
        if (cached.length) {
          this.demarches.set(cached);
          this.toastService.info('Démarches affichées depuis le cache local');
          return;
        }

        const message =
          err?.status === 429
            ? 'Trop de requêtes vers le serveur. Réessayez dans quelques minutes.'
            : 'Impossible de charger les démarches';
        this.toastService.error(message);
      },
    });
  }

  private extractDemarchesList(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (!res || typeof res !== 'object') return [];

    const candidates = [res.demarches, res.type_demarches, res.items, res.results, res.data];

    for (const candidate of candidates) {
      const list = this.extractDemarchesList(candidate);
      if (list.length) return list;
    }

    return [];
  }

  private cacheDemarches(list: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('procedures_admin_demarches', JSON.stringify(list));
  }

  private getCachedDemarches(): any[] {
    if (typeof window === 'undefined') return [];

    const raw = localStorage.getItem('procedures_admin_demarches');
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem('procedures_admin_demarches');
      return [];
    }
  }

  private findDemarcheCategory(dem: any): any {
    return this.categories().find((cat) => this.matchesDemarcheCategory(dem, cat));
  }

  private matchesDemarcheCategory(dem: any, cat: any): boolean {
    const demValues = this.getDemarcheCategoryValues(dem);
    const catValues = [cat?.id, cat?.code, cat?.nom]
      .map((value) => this.normalizeCategoryValue(value))
      .filter(Boolean);

    return catValues.some((value) => demValues.includes(value));
  }

  private getDemarcheCategoryValues(dem: any): string[] {
    const values = [
      dem?.categorie_id,
      dem?.category_id,
      dem?.categorie_dossier_id,
      dem?.category_dossier_id,
      dem?.type_categorie_id,
      dem?.categorie_code,
      dem?.category_code,
      dem?.categorie_nom,
      dem?.category_name,
      dem?.categorie,
      dem?.category,
      dem?.categorie?.id,
      dem?.categorie?.code,
      dem?.categorie?.nom,
      dem?.category?.id,
      dem?.category?.code,
      dem?.category?.nom,
      dem?.category?.name,
    ];

    return values.map((value) => this.normalizeCategoryValue(value)).filter(Boolean);
  }

  private normalizeCategoryValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      return this.normalizeCategoryValue(value.id ?? value.code ?? value.nom ?? value.name);
    }
    return String(value).trim().toLowerCase();
  }

  filterDemarches(event: any) {
    this.demarcheFilters.update((f) => ({ ...f, search: event.target.value }));
  }

  filterByCategory(event: any) {
    this.demarcheFilters.update((f) => ({ ...f, categorie_id: event.target.value }));
  }

  loadWorkflows() {
    this.http.get<any[]>('/api/workflows').subscribe((res) => this.workflows.set(res));
  }
  loadRoles() {
    this.http.get<any[]>('/api/roles').subscribe((res) => this.roles.set(res));
  }

  getDemarcheNom(id: number) {
    const list = Array.isArray(this.demarches()) ? this.demarches() : [];
    return list.find((d) => d.id === id)?.nom || 'Inconnue';
  }

  // ── CATEGORY ACTIONS ──
  requirementDocumentLabel(count: number): string {
    return `${count} ${count > 1 ? 'documents' : 'document'}`;
  }

  requirementCriterionLabel(count: number): string {
    return `${count} ${count > 1 ? 'critères' : 'critère'}`;
  }

  openCategoryModal(cat?: any) {
    if (cat) {
      this.editingCategory.set(cat);
      this.catForm = { ...cat };
    } else {
      this.editingCategory.set(null);
      this.catForm = { code: '', nom: '', description: '', prix_base: 0, icon: '📁' };
    }
    this.showCategoryModal.set(true);
  }

  closeCategoryModal() {
    this.showCategoryModal.set(false);
  }

  saveCategory() {
    this.saving.set(true);
    const obs = this.editingCategory()
      ? this.dossierService.modifierCategorie(this.editingCategory().id, this.catForm)
      : this.dossierService.creerCategorie(this.catForm);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeCategoryModal();
        this.loadCategories();
        this.toastService.success('Catégorie enregistrée avec succès');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(err?.error?.message || "Erreur lors de l'enregistrement");
      },
    });
  }

  toggleCategoryStatus(cat: any) {
    this.dossierService.modifierCategorie(cat.id, { nom: cat.nom, actif: !cat.actif }).subscribe({
      next: () => {
        this.loadCategories();
        this.toastService.info('Statut de la catégorie mis à jour');
      },
      error: () => this.toastService.error('Erreur lors de la mise à jour du statut'),
    });
  }

  // ── DEMARCHE ACTIONS ──
  openDemarcheModal(dem?: any) {
    if (dem) {
      this.editingDemarche.set(dem);
      this.demForm = {
        ...dem,
        documents_requis: (dem.documents_requis || []).map((d: any) =>
          typeof d === 'string' ? { nom: d, roles_validateurs: ['agent'] } : d,
        ),
        criteres: dem.criteres || [],
      };
    } else {
      this.editingDemarche.set(null);
      this.demForm = {
        code: '',
        nom: '',
        nom_wolof: '',
        description: '',
        categorie_id: null,
        frais: 0,
        delai_traitement_jours: 5,
        documents_requis: [],
        criteres: [],
      };
    }
    this.showDemarcheModal.set(true);
  }

  closeDemarcheModal() {
    this.showDemarcheModal.set(false);
  }

  saveDemarche() {
    this.saving.set(true);
    const payload = { ...this.demForm };
    const obs = this.editingDemarche()
      ? this.dossierService.modifierDemarche(this.editingDemarche().id, payload)
      : this.dossierService.creerDemarche(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeDemarcheModal();
        this.loadDemarches();
        this.toastService.success('Démarche enregistrée avec succès');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(err?.error?.message || "Erreur lors de l'enregistrement");
      },
    });
  }

  desactiverDemarche(dem: any) {
    if (confirm(`Désactiver la démarche ${dem.nom} ?`)) {
      this.dossierService.supprimerDemarche(dem.id).subscribe({
        next: () => {
          this.loadDemarches();
          this.toastService.success('Démarche désactivée');
        },
        error: () => this.toastService.error('Erreur lors de la désactivation'),
      });
    }
  }

  addDocument() {
    if (this.newDocText.trim()) {
      this.demForm.documents_requis.push({
        nom: this.newDocText.trim(),
        roles_validateurs: ['agent'],
      });
      this.newDocText = '';
    }
  }

  removeDocument(i: number) {
    this.demForm.documents_requis.splice(i, 1);
  }

  toggleRoleInDoc(docIdx: number, role: string) {
    const doc = this.demForm.documents_requis[docIdx];
    if (doc) {
      const roles = [...(doc.roles_validateurs || [])];
      const idx = roles.indexOf(role);
      if (idx > -1) roles.splice(idx, 1);
      else roles.push(role);
      doc.roles_validateurs = roles;
    }
  }

  addCriterion() {
    if (this.newCriterionText.trim()) {
      this.demForm.criteres.push(this.newCriterionText.trim());
      this.newCriterionText = '';
    }
  }

  removeCriterion(i: number) {
    this.demForm.criteres.splice(i, 1);
  }

  // ── WORKFLOW ACTIONS ──
  openWfModal() {
    this.wfForm = { nom: '', type_demarche_id: null };
    this.showWfModal.set(true);
  }
  saveWorkflow() {
    this.http.post('/api/workflows', this.wfForm).subscribe({
      next: () => {
        this.showWfModal.set(false);
        this.loadWorkflows();
        this.loadDemarches();
        this.toastService.success('Circuit de validation créé');
      },
      error: (err) =>
        this.toastService.error(err?.error?.message || 'Erreur lors de la création du circuit'),
    });
  }

  openStepModal(wf: any) {
    this.stepForm = {
      nom: '',
      role_organisation_id: null,
      ordre: wf.steps.length,
      workflow_id: wf.id,
    };
    this.showStepModal.set(true);
  }
  saveStep() {
    this.http.post(`/api/workflows/${this.stepForm.workflow_id}/steps`, this.stepForm).subscribe({
      next: () => {
        this.showStepModal.set(false);
        this.loadWorkflows();
        this.toastService.success('Étape ajoutée avec succès');
      },
      error: (err) =>
        this.toastService.error(err?.error?.message || "Erreur lors de l'ajout de l'étape"),
    });
  }

  deleteStep(id: number) {
    if (confirm('Supprimer cette étape ?')) {
      this.http.delete(`/api/workflows/steps/${id}`).subscribe({
        next: () => {
          this.loadWorkflows();
          this.toastService.success('Étape supprimée');
        },
        error: () => this.toastService.error('Erreur lors de la suppression'),
      });
    }
  }
}
