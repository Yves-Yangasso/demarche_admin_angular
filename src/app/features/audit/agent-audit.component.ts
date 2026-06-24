import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import {
  AgentAudit,
  AuditType,
  AuditEntry,
  AuditAgentService,
} from '../../core/services/audit-agent.service';

type SortKey = 'nom' | 'dossiers_traites' | 'dossiers_consultes' | 'alertes' | 'derniere_connexion';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-agent-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="page-header">
        <div>
          <span class="eyebrow">Traçabilité &amp; intégrité</span>
          <h1>Suivi des agents</h1>
          <p class="subtitle">
            Connexions, dossiers traités, consultations, validations et traces anti-fraude.
          </p>
        </div>
        <button
          class="btn-secondary"
          (click)="exportCsv()"
          [disabled]="filteredAgents().length === 0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 3v12m0 0-4-4m4 4 4-4" />
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          Exporter (CSV)
        </button>
      </div>

      <div class="kpi-grid">
        <section class="kpi-card">
          <span class="label">Agents suivis</span>
          <strong>{{ agents().length }}</strong>
          <span class="kpi-sub">{{ connectedCount() }} connecté(s) en ce moment</span>
        </section>
        <section class="kpi-card">
          <span class="label">Dossiers traités</span>
          <strong>{{ totalTraites() }}</strong>
          <span class="kpi-sub">{{ totalConsultes() }} consultation(s)</span>
        </section>
        <section
          class="kpi-card"
          [class.warning]="totalAlertes() > 0"
          [class.ok]="totalAlertes() === 0"
        >
          <span class="label">Alertes anti-fraude</span>
          <strong>{{ totalAlertes() }}</strong>
          <span class="kpi-sub">{{
            totalAlertes() === 0 ? 'Aucune anomalie détectée' : 'À examiner en priorité'
          }}</span>
        </section>
        <section class="kpi-card security" [class.warning]="!chaineValide()">
          <span class="label">Suivi d'audit</span>
          <strong>
            <svg
              class="chain-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path *ngIf="chaineValide()" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline *ngIf="chaineValide()" points="22 4 12 14.01 9 11.01" />
              <path
                *ngIf="!chaineValide()"
                d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              />
            </svg>
            {{ chaineValide() ? 'Validée' : 'À vérifier' }}
          </strong>
          <span class="kpi-sub">{{ entries().length }} entrée(s) enregistrée(s)</span>
        </section>
      </div>

      <section class="card filters-card">
        <div class="filters-head">
          <div>
            <h2>Filtres avancés</h2>
            <p>Rechercher par agent, dossier, action, type, période ou statut de connexion.</p>
          </div>
          <div class="filters-actions">
            <span class="active-count" *ngIf="activeFilterCount() > 0"
              >{{ activeFilterCount() }} filtre(s) actif(s)</span
            >
            <button
              class="btn-secondary"
              (click)="resetFilters()"
              [disabled]="activeFilterCount() === 0"
            >
              Réinitialiser
            </button>
          </div>
        </div>
        <div class="filters-grid">
          <div class="form-field search-field">
            <label for="search">Recherche</label>
            <div class="search-input">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="search"
                type="search"
                [(ngModel)]="search"
                placeholder="Agent, dossier, action…"
              />
              <button
                class="clear-btn"
                *ngIf="search"
                (click)="search = ''"
                aria-label="Effacer la recherche"
              >
                ×
              </button>
            </div>
          </div>
          <div class="form-field">
            <label for="statut">Statut agent</label>
            <select id="statut" [(ngModel)]="statut">
              <option value="tous">Tous</option>
              <option value="connecte">Connectés</option>
              <option value="actif">Actifs aujourd'hui</option>
              <option value="hors_ligne">Hors ligne</option>
            </select>
          </div>
          <div class="form-field">
            <label for="typeAudit">Type audit</label>
            <select id="typeAudit" [(ngModel)]="typeAudit">
              <option value="tous">Tous</option>
              <option value="initial">Initial</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <div class="form-field">
            <label for="moduleAudit">Module</label>
            <select id="moduleAudit" [(ngModel)]="moduleAudit">
              <option value="tous">Tous</option>
              <option *ngFor="let module of modules()" [value]="module">{{ module }}</option>
            </select>
          </div>
          <div class="form-field">
            <label for="dateDebut">Du</label>
            <input id="dateDebut" type="date" [(ngModel)]="dateDebut" />
          </div>
          <div class="form-field">
            <label for="dateFin">Au</label>
            <input id="dateFin" type="date" [(ngModel)]="dateFin" />
          </div>
        </div>
      </section>

      <section class="card table-card">
        <div class="section-title">
          <h2>Activité des agents</h2>
          <span>{{ filteredAgents().length }} agent(s)</span>
        </div>
        <table *ngIf="filteredAgents().length > 0">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('nom')">
                Agent
                <span class="sort-arrow" *ngIf="sortKey() === 'nom'">{{
                  sortDir() === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th class="sortable" (click)="toggleSort('derniere_connexion')">
                Dernière connexion
                <span class="sort-arrow" *ngIf="sortKey() === 'derniere_connexion'">{{
                  sortDir() === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th class="sortable" (click)="toggleSort('dossiers_traites')">
                Dossiers traités
                <span class="sort-arrow" *ngIf="sortKey() === 'dossiers_traites'">{{
                  sortDir() === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th class="sortable" (click)="toggleSort('dossiers_consultes')">
                Consultés
                <span class="sort-arrow" *ngIf="sortKey() === 'dossiers_consultes'">{{
                  sortDir() === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th>Validés</th>
              <th class="sortable" (click)="toggleSort('alertes')">
                Alertes
                <span class="sort-arrow" *ngIf="sortKey() === 'alertes'">{{
                  sortDir() === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th>Statut</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let agent of sortedAgents()"
              [class.is-selected]="selectedAgent()?.nom === agent.nom"
            >
              <td>
                <div class="agent-name">
                  <span class="avatar">{{ initials(agent.nom) }}</span>
                  <div>
                    <strong>{{ agent.nom }}</strong>
                    <span>{{ agent.role }}</span>
                  </div>
                </div>
              </td>
              <td>{{ agent.derniere_connexion | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ agent.dossiers_traites }}</td>
              <td>{{ agent.dossiers_consultes }}</td>
              <td>{{ agent.dossiers_valides }}</td>
              <td>
                <span
                  class="alert-badge"
                  [class.ok]="agent.alertes === 0"
                  [class.warning]="agent.alertes > 0 && agent.alertes < 3"
                  [class.danger]="agent.alertes >= 3"
                  >{{ agent.alertes }}</span
                >
              </td>
              <td>
                <span class="status-badge" [ngClass]="agent.statut"
                  ><i class="status-dot"></i>{{ displayStatut(agent.statut) }}</span
                >
              </td>
              <td class="actions-col">
                <button class="btn-view" (click)="voirAgent(agent)">Voir</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="filteredAgents().length === 0">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p>Aucun agent ne correspond à ces filtres.</p>
          <button class="btn-secondary" (click)="resetFilters()">Réinitialiser les filtres</button>
        </div>
      </section>

      <section class="card agent-history-card" *ngIf="selectedAgent() as agent">
        <div class="section-title compact">
          <div>
            <h2>Actions récentes de {{ agent.nom }}</h2>
            <p>Audit des actions initial, update et delete avec heure exacte.</p>
          </div>
          <button class="btn-secondary" (click)="fermerAgent()">Fermer</button>
        </div>
        <div class="agent-actions">
          <button
            class="agent-action"
            *ngFor="let block of actionsForAgent(agent.nom)"
            [class.selected]="selectedBlock()?.hash === block.hash"
            (click)="selectBlock(block)"
          >
            <span class="type-badge" [ngClass]="block.type">{{ block.type }}</span>
            <strong>{{ block.action }}</strong>
            <span>{{ block.dossier }} - {{ block.timestamp | date: 'dd/MM/yyyy HH:mm' }}</span>
          </button>
          <div class="empty-state inline" *ngIf="actionsForAgent(agent.nom).length === 0">
            Aucune action récente pour cet agent.
          </div>
        </div>
      </section>

      <div class="audit-layout">
        <section class="card actions-card">
          <div class="section-title">
            <h2>Journal d'audit</h2>
            <span>{{ filteredBlocks().length }} trace(s)</span>
          </div>
          <p class="journal-subtitle">
            Activités récentes. Cliquez sur une trace pour consulter les informations détaillées.
          </p>
          <div class="tabs">
            <button [class.active]="typeAudit === 'tous'" (click)="typeAudit = 'tous'">
              Toutes
            </button>
            <button [class.active]="typeAudit === 'initial'" (click)="typeAudit = 'initial'">
              Initial
            </button>
            <button [class.active]="typeAudit === 'update'" (click)="typeAudit = 'update'">
              Update
            </button>
            <button [class.active]="typeAudit === 'delete'" (click)="typeAudit = 'delete'">
              Delete
            </button>
          </div>

          <ng-container *ngFor="let block of pagedBlocks()">
            <button
              class="action-item"
              [class.selected]="selectedBlock()?.hash === block.hash"
              (click)="selectBlock(block)"
            >
              <div class="action-top">
                <span class="type-badge" [ngClass]="block.type">{{ block.type }}</span>
                <time>{{ block.timestamp | date: 'dd/MM/yyyy HH:mm' }}</time>
              </div>
              <strong>{{ block.action }}</strong>
              <span>{{ block.agent }} - {{ block.dossier }}</span>
            </button>
          </ng-container>

          <div class="empty-state inline" *ngIf="filteredBlocks().length === 0">
            Aucune trace ne correspond à ces filtres.
          </div>

          <div class="pagination" *ngIf="totalPages() > 1">
            <button
              (click)="page.set(page() - 1)"
              [disabled]="page() === 1"
              aria-label="Page précédente"
            >
              ‹
            </button>
            <span>Page {{ page() }} / {{ totalPages() }}</span>
            <button
              (click)="page.set(page() + 1)"
              [disabled]="page() === totalPages()"
              aria-label="Page suivante"
            >
              ›
            </button>
          </div>
        </section>

        <section class="card detail-card" *ngIf="selectedBlock() as block">
          <div class="detail-head">
            <div>
              <span class="type-badge" [ngClass]="block.type">{{ block.type }}</span>
              <h2>{{ block.action }}</h2>
              <p>
                {{ block.agent }} a agi sur {{ block.dossier }} le
                {{ block.timestamp | date: 'dd/MM/yyyy à HH:mm' }}.
              </p>
            </div>
            <span class="chain-state" [class.warning]="!chaineValide()">{{
              chaineValide() ? 'Chaîne validée' : 'Contrôle requis'
            }}</span>
          </div>

          <div class="detail-grid">
            <div>
              <span>Module</span>
              <strong>{{ block.module }}</strong>
            </div>
            <div>
              <span>Adresse IP</span>
              <strong>{{ block.ip }}</strong>
            </div>
            <div>
              <span>Terminal</span>
              <strong>{{ block.device }}</strong>
            </div>
            <div>
              <span>Bloc</span>
              <strong>#{{ block.index }}</strong>
            </div>
          </div>

          <div class="changes-grid">
            <section>
              <h3>Initial</h3>
              <div class="empty" *ngIf="block.initial.length === 0">
                Aucune valeur initiale pour cette action.
              </div>
              <div class="change-row" *ngFor="let item of block.initial">
                <span>{{ item.champ }}</span>
                <strong>{{ item.valeur }}</strong>
              </div>
            </section>

            <section>
              <h3>Update</h3>
              <div class="empty" *ngIf="block.updates.length === 0">
                Aucune modification pour cette action.
              </div>
              <div class="change-row update-row" *ngFor="let item of block.updates">
                <span>{{ item.champ }}</span>
                <div>
                  <del>{{ item.avant }}</del>
                  <strong>{{ item.apres }}</strong>
                </div>
              </div>
            </section>

            <section>
              <h3>Delete</h3>
              <div class="empty" *ngIf="block.deleted.length === 0">
                Aucune suppression pour cette action.
              </div>
              <div class="change-row delete-row" *ngFor="let item of block.deleted">
                <span>{{ item.champ }}</span>
                <strong>{{ item.valeur }}</strong>
              </div>
            </section>
          </div>

          <div class="hash-panel">
            <div class="hash-row">
              <code>previous: {{ block.previousHash }}</code>
              <button
                class="copy-btn"
                (click)="copyHash(block.previousHash)"
                aria-label="Copier le hash précédent"
              >
                {{ copiedHash() === block.previousHash ? 'Copié ✓' : 'Copier' }}
              </button>
            </div>
            <div class="hash-row">
              <code>hash: {{ block.hash }}</code>
              <button class="copy-btn" (click)="copyHash(block.hash)" aria-label="Copier le hash">
                {{ copiedHash() === block.hash ? 'Copié ✓' : 'Copier' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </app-layout>
  `,
  styles: [
    `
      :host {
        --ink: #0f172a;
        --muted: #64748b;
        --line: #e2e8f0;
        --surface: #f8fafc;
      }
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .eyebrow {
        display: block;
        color: var(--primary-hover);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 0.35rem;
      }
      h1,
      h2,
      h3 {
        margin: 0;
        color: var(--ink);
      }
      h1 {
        font-size: 1.6rem;
      }
      h2 {
        font-size: 1rem;
      }
      h3 {
        font-size: 0.88rem;
      }
      .subtitle,
      .filters-head p,
      .detail-head p {
        margin: 0.25rem 0 0;
        color: var(--muted);
        font-size: 0.9rem;
      }
      .btn-primary,
      .btn-secondary,
      .btn-view {
        border: 0;
        border-radius: 8px;
        font-weight: 700;
        padding: 0.65rem 1rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition:
          background 0.15s ease,
          transform 0.1s ease,
          box-shadow 0.15s ease;
      }
      .btn-primary {
        background: var(--primary-color);
        color: white;
      }
      .btn-primary:hover {
        background: var(--primary-hover);
      }
      .btn-secondary {
        background: var(--surface);
        color: #475569;
        border: 1px solid var(--line);
      }
      .btn-secondary:hover:not(:disabled) {
        background: #eef2f7;
      }
      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-view {
        background: var(--primary-light);
        color: var(--primary-hover);
        padding: 0.45rem 0.8rem;
      }
      .btn-view:hover {
        background: #dbeafe;
      }
      button:focus-visible,
      input:focus-visible,
      select:focus-visible {
        outline: 2px solid var(--primary-hover);
        outline-offset: 2px;
      }
      .card {
        background: white;
        border: 1px solid var(--line);
        border-radius: 12px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(160px, 1fr));
        gap: 1rem;
        margin-bottom: 1.25rem;
      }
      .kpi-card {
        background: white;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }
      .kpi-card .label {
        color: var(--muted);
        text-transform: uppercase;
        font-size: 0.72rem;
        font-weight: 800;
      }
      .kpi-card strong {
        font-size: 1.6rem;
        color: var(--ink);
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .kpi-card .kpi-sub {
        color: #94a3b8;
        font-size: 0.78rem;
        font-weight: 600;
      }
      .kpi-card.ok strong {
        color: #15803d;
      }
      .kpi-card.security {
        border-color: #bbf7d0;
        background: #f0fdf4;
      }
      .kpi-card.security strong {
        color: #15803d;
      }
      .kpi-card.warning {
        border-color: #fed7aa;
        background: #fff7ed;
      }
      .kpi-card.warning strong {
        color: #c2410c;
      }
      .chain-icon {
        flex-shrink: 0;
      }

      .filters-card {
        padding: 1rem;
        margin-bottom: 1.25rem;
      }
      .filters-head,
      .section-title,
      .detail-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }
      .filters-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .active-count {
        color: var(--primary-hover);
        font-size: 0.8rem;
        font-weight: 700;
        background: var(--primary-light);
        padding: 0.3rem 0.6rem;
        border-radius: 999px;
      }
      .filters-grid {
        display: grid;
        grid-template-columns: 2fr repeat(5, minmax(130px, 1fr));
        gap: 0.75rem;
        margin-top: 1rem;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      label {
        color: var(--muted);
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
      }
      input,
      select {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: white;
        padding: 0.62rem 0.75rem;
        color: #334155;
        min-width: 0;
        width: 100%;
      }
      .search-input {
        position: relative;
        display: flex;
        align-items: center;
      }
      .search-input svg {
        position: absolute;
        left: 0.75rem;
        color: #94a3b8;
      }
      .search-input input {
        padding-left: 2.1rem;
        padding-right: 2rem;
      }
      .clear-btn {
        position: absolute;
        right: 0.5rem;
        border: none;
        background: none;
        color: #94a3b8;
        font-size: 1.1rem;
        cursor: pointer;
        line-height: 1;
        padding: 0.2rem;
      }
      .clear-btn:hover {
        color: #475569;
      }

      .table-card {
        overflow-x: auto;
        margin-bottom: 1.5rem;
      }
      .section-title {
        padding: 1rem 1rem 0;
      }
      .section-title span {
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 700;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
      }
      th {
        text-align: left;
        background: var(--surface);
        color: var(--muted);
        font-size: 0.75rem;
        text-transform: uppercase;
        padding: 1rem;
        white-space: nowrap;
      }
      th.sortable {
        cursor: pointer;
        user-select: none;
      }
      th.sortable:hover {
        color: var(--primary-hover);
      }
      .sort-arrow {
        font-size: 0.65rem;
        margin-left: 0.25rem;
      }
      td {
        padding: 1rem;
        border-top: 1px solid #f1f5f9;
        color: #334155;
        font-size: 0.88rem;
      }
      tr.is-selected td {
        background: var(--primary-light);
      }
      td strong {
        display: block;
        color: var(--ink);
      }
      td span {
        display: block;
        color: var(--muted);
        font-size: 0.78rem;
        margin-top: 0.2rem;
      }
      .agent-name {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }
      .avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--primary-light);
        color: var(--primary-hover);
        font-weight: 800;
        font-size: 0.78rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .actions-col {
        text-align: right;
      }
      .alert-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 24px;
        border-radius: 999px;
        background: #fee2e2;
        color: #b91c1c;
        font-weight: 800;
      }
      .alert-badge.ok {
        background: #dcfce7;
        color: #15803d;
      }
      .alert-badge.warning {
        background: #ffedd5;
        color: #c2410c;
      }
      .alert-badge.danger {
        background: #fee2e2;
        color: #b91c1c;
      }
      .status-badge,
      .type-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.28rem 0.55rem;
        border-radius: 6px;
        font-weight: 800;
        font-size: 0.72rem;
        text-transform: uppercase;
      }
      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        display: inline-block;
      }
      .status-badge.connecte {
        background: #dcfce7;
        color: #15803d;
      }
      .status-badge.actif {
        background: #dbeafe;
        color: var(--primary-hover);
      }
      .status-badge.hors_ligne {
        background: #f1f5f9;
        color: var(--muted);
      }
      .type-badge.initial {
        background: #e0f2fe;
        color: #0369a1;
      }
      .type-badge.update {
        background: #fef3c7;
        color: #92400e;
      }
      .type-badge.delete {
        background: #fee2e2;
        color: #b91c1c;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
        color: #94a3b8;
        padding: 2.5rem 1rem;
        text-align: center;
      }
      .empty-state p {
        margin: 0;
        font-size: 0.9rem;
      }
      .empty-state.inline {
        padding: 1rem;
        font-size: 0.85rem;
      }

      .agent-history-card {
        padding: 1rem;
        margin-bottom: 1.5rem;
      }
      .section-title.compact {
        padding: 0;
        margin-bottom: 1rem;
      }
      .section-title.compact p,
      .journal-subtitle {
        margin: 0.25rem 0 0;
        color: var(--muted);
        font-size: 0.86rem;
      }
      .agent-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 0.75rem;
      }
      .agent-action {
        text-align: left;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        padding: 0.85rem;
        cursor: pointer;
      }
      .agent-action:hover,
      .agent-action.selected {
        border-color: #93c5fd;
        background: var(--primary-light);
      }
      .agent-action strong {
        display: block;
        color: var(--ink);
        margin: 0.55rem 0 0.2rem;
      }
      .agent-action span:last-child {
        color: var(--muted);
        font-size: 0.82rem;
      }

      .audit-layout {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 1.25rem;
        align-items: start;
      }
      .actions-card,
      .detail-card {
        padding: 1rem;
      }
      .journal-subtitle {
        margin-bottom: 1rem;
      }
      .tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.35rem;
        margin: 1rem 0;
      }
      .tabs button {
        border: 1px solid var(--line);
        background: var(--surface);
        border-radius: 6px;
        padding: 0.45rem;
        color: #475569;
        font-weight: 800;
        cursor: pointer;
      }
      .tabs button.active {
        background: var(--primary-light);
        border-color: #93c5fd;
        color: var(--primary-hover);
      }
      .action-item {
        width: 100%;
        text-align: left;
        border: 1px solid var(--line);
        background: white;
        border-radius: 8px;
        padding: 0.85rem;
        cursor: pointer;
        margin-bottom: 0.65rem;
      }
      .action-item.selected,
      .action-item:hover {
        border-color: #93c5fd;
        background: var(--primary-light);
      }
      .action-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.6rem;
      }
      .action-top time {
        color: var(--muted);
        font-size: 0.75rem;
      }
      .action-item strong {
        display: block;
        color: var(--ink);
        margin-bottom: 0.25rem;
      }
      .action-item > span:last-child {
        color: var(--muted);
        font-size: 0.82rem;
      }
      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 0.5rem;
      }
      .pagination button {
        border: 1px solid var(--line);
        background: white;
        border-radius: 6px;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 1rem;
      }
      .pagination button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .pagination span {
        font-size: 0.8rem;
        color: var(--muted);
        font-weight: 700;
      }

      .chain-state {
        background: #dcfce7;
        color: #15803d;
        border-radius: 999px;
        padding: 0.35rem 0.7rem;
        font-size: 0.78rem;
        font-weight: 800;
        white-space: nowrap;
      }
      .chain-state.warning {
        background: #ffedd5;
        color: #c2410c;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
        margin: 1.25rem 0;
      }
      .detail-grid div {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 0.8rem;
      }
      .detail-grid span {
        display: block;
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 0.35rem;
      }
      .detail-grid strong {
        color: var(--ink);
        font-size: 0.88rem;
      }
      .changes-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.85rem;
      }
      .changes-grid section {
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 0.85rem;
        min-height: 160px;
      }
      .change-row {
        border-top: 1px solid #f1f5f9;
        padding: 0.7rem 0 0;
        margin-top: 0.7rem;
      }
      .change-row span {
        color: var(--muted);
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
      }
      .change-row strong {
        display: block;
        color: var(--ink);
        margin-top: 0.25rem;
      }
      .update-row del {
        display: block;
        color: #b91c1c;
        margin-top: 0.25rem;
      }
      .delete-row strong {
        color: #b91c1c;
      }
      .empty {
        color: #94a3b8;
        font-size: 0.82rem;
        margin-top: 0.8rem;
      }
      .hash-panel {
        display: grid;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .hash-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      code {
        flex: 1;
        color: #475569;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 0.45rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.74rem;
      }
      .copy-btn {
        border: 1px solid var(--line);
        background: white;
        border-radius: 6px;
        padding: 0.4rem 0.6rem;
        font-size: 0.74rem;
        font-weight: 700;
        color: #475569;
        cursor: pointer;
        flex-shrink: 0;
      }
      .copy-btn:hover {
        background: var(--surface);
      }

      @media (max-width: 1100px) {
        .filters-grid,
        .detail-grid,
        .changes-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .audit-layout {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 720px) {
        .page-header,
        .filters-head,
        .section-title,
        .detail-head {
          align-items: stretch;
          flex-direction: column;
        }
        .kpi-grid,
        .filters-grid,
        .detail-grid,
        .changes-grid {
          grid-template-columns: 1fr;
        }
        .tabs {
          grid-template-columns: repeat(2, 1fr);
        }
        .btn-primary,
        .btn-secondary {
          justify-content: center;
        }
      }
    `,
  ],
})
export class AgentAuditComponent {
  private auditService = inject(AuditAgentService);

  search = '';
  statut = 'tous';
  typeAudit: AuditType | 'tous' = 'tous';
  moduleAudit = 'tous';
  dateDebut = '';
  dateFin = '';

  agents = this.auditService.agents;
  entries = this.auditService.entries;
  selectedHash = signal<string>('');
  selectedAgent = signal<AgentAudit | null>(null);
  copiedHash = signal<string>('');

  sortKey = signal<SortKey>('dossiers_traites');
  sortDir = signal<SortDir>('desc');

  page = signal<number>(1);
  pageSize = 8;

  chaineValide = computed(() => this.auditService.verifierChaine());
  totalTraites = computed(() =>
    this.agents().reduce((total, agent) => total + agent.dossiers_traites, 0),
  );
  totalConsultes = computed(() =>
    this.agents().reduce((total, agent) => total + agent.dossiers_consultes, 0),
  );
  totalAlertes = computed(() => this.agents().reduce((total, agent) => total + agent.alertes, 0));
  connectedCount = computed(
    () => this.agents().filter((agent) => agent.statut === 'connecte').length,
  );
  modules = computed(() => Array.from(new Set(this.entries().map((block) => block.module))));
  selectedBlock = computed<AuditEntry | null>(
    () =>
      this.entries().find((block) => block.hash === this.selectedHash()) ||
      this.filteredBlocks()[0] ||
      null,
  );

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.search.trim()) count++;
    if (this.statut !== 'tous') count++;
    if (this.typeAudit !== 'tous') count++;
    if (this.moduleAudit !== 'tous') count++;
    if (this.dateDebut) count++;
    if (this.dateFin) count++;
    return count;
  });

  filteredAgents(): AgentAudit[] {
    const search = this.search.trim().toLowerCase();

    return this.agents().filter((agent) => {
      const matchesSearch = !search || `${agent.nom} ${agent.role}`.toLowerCase().includes(search);
      const matchesStatut = this.statut === 'tous' || agent.statut === this.statut;

      return matchesSearch && matchesStatut;
    });
  }

  sortedAgents(): AgentAudit[] {
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return [...this.filteredAgents()].sort((a, b) => {
      const av = a[key];
      const bv = b[key];

      if (key === 'derniere_connexion') {
        return (new Date(av as string).getTime() - new Date(bv as string).getTime()) * dir;
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  toggleSort(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('desc');
    }
  }

  filteredBlocks(): AuditEntry[] {
    const search = this.search.trim().toLowerCase();
    const start = this.dateDebut ? new Date(`${this.dateDebut}T00:00:00`).getTime() : null;
    const end = this.dateFin ? new Date(`${this.dateFin}T23:59:59`).getTime() : null;

    return this.entries().filter((block) => {
      const blockTime = new Date(block.timestamp).getTime();
      const searchable =
        `${block.agent} ${block.action} ${block.dossier} ${block.module}`.toLowerCase();
      const matchesSearch = !search || searchable.includes(search);
      const matchesType = this.typeAudit === 'tous' || block.type === this.typeAudit;
      const matchesModule = this.moduleAudit === 'tous' || block.module === this.moduleAudit;
      const matchesStart = start === null || blockTime >= start;
      const matchesEnd = end === null || blockTime <= end;

      return matchesSearch && matchesType && matchesModule && matchesStart && matchesEnd;
    });
  }

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredBlocks().length / this.pageSize)));

  pagedBlocks(): AuditEntry[] {
    const blocks = this.filteredBlocks();
    const currentPage = Math.min(this.page(), this.totalPages());
    const startIndex = (currentPage - 1) * this.pageSize;
    return blocks.slice(startIndex, startIndex + this.pageSize);
  }

  displayStatut(statut: string): string {
    const labels: Record<string, string> = {
      connecte: 'Connecté',
      actif: 'Actif',
      hors_ligne: 'Hors ligne',
    };

    return labels[statut] || statut;
  }

  initials(nom: string): string {
    return nom
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  selectBlock(block: AuditEntry) {
    this.selectedHash.set(block.hash);
  }

  voirAgent(agent: AgentAudit) {
    this.selectedAgent.set(agent);
    const firstAction = this.actionsForAgent(agent.nom)[0];
    if (firstAction) {
      this.selectBlock(firstAction);
    }
  }

  fermerAgent() {
    this.selectedAgent.set(null);
  }

  actionsForAgent(agentName: string): AuditEntry[] {
    return this.entries().filter((block) => block.agent === agentName);
  }

  copyHash(hash: string) {
    navigator.clipboard?.writeText(hash).then(() => {
      this.copiedHash.set(hash);
      setTimeout(() => {
        if (this.copiedHash() === hash) this.copiedHash.set('');
      }, 1500);
    });
  }

  exportCsv() {
    const rows = this.sortedAgents();
    const header = [
      'Agent',
      'Role',
      'Derniere connexion',
      'Dossiers traites',
      'Consultes',
      'Valides',
      'Alertes',
      'Statut',
    ];
    const lines = rows.map((agent) =>
      [
        agent.nom,
        agent.role,
        agent.derniere_connexion,
        agent.dossiers_traites,
        agent.dossiers_consultes,
        agent.dossiers_valides,
        agent.alertes,
        this.displayStatut(agent.statut),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    );

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suivi-agents-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  resetFilters() {
    this.search = '';
    this.statut = 'tous';
    this.typeAudit = 'tous';
    this.moduleAudit = 'tous';
    this.dateDebut = '';
    this.dateFin = '';
    this.page.set(1);
  }
}
