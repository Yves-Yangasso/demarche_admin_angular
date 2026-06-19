import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { AgentAudit, AuditType, BlockchainAuditBlock, AuditAgentService } from '../../core/services/audit-agent.service';

@Component({
  selector: 'app-agent-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="page-header">
        <div>
          <h1>Suivi des agents</h1>
          <p class="subtitle">Connexions, dossiers traites, consultations, validations et traces anti-fraude.</p>
        </div>
      </div>

      <div class="kpi-grid">
        <section class="kpi-card">
          <span class="label">Agents suivis</span>
          <strong>{{ agents().length }}</strong>
        </section>
        <section class="kpi-card">
          <span class="label">Dossiers traites</span>
          <strong>{{ totalTraites() }}</strong>
        </section>
        <section class="kpi-card">
          <span class="label">Consultations</span>
          <strong>{{ totalConsultes() }}</strong>
        </section>
        <section class="kpi-card security" [class.warning]="!chaineValide()">
          <span class="label">Blockchain audit</span>
          <strong>{{ chaineValide() ? 'Validee' : 'A verifier' }}</strong>
        </section>
      </div>

      <section class="card filters-card">
        <div class="filters-head">
          <div>
            <h2>Filtres avances</h2>
            <p>Rechercher par agent, dossier, action, type, periode ou statut de connexion.</p>
          </div>
          <button class="btn-secondary" (click)="resetFilters()">Reinitialiser</button>
        </div>
        <div class="filters-grid">
          <div class="form-field">
            <label>Recherche</label>
            <input type="search" [(ngModel)]="search" placeholder="Agent, dossier, action">
          </div>
          <div class="form-field">
            <label>Statut agent</label>
            <select [(ngModel)]="statut">
              <option value="tous">Tous</option>
              <option value="connecte">Connectes</option>
              <option value="actif">Actifs aujourd'hui</option>
              <option value="hors_ligne">Hors ligne</option>
            </select>
          </div>
          <div class="form-field">
            <label>Type audit</label>
            <select [(ngModel)]="typeAudit">
              <option value="tous">Tous</option>
              <option value="initial">Initial</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <div class="form-field">
            <label>Module</label>
            <select [(ngModel)]="moduleAudit">
              <option value="tous">Tous</option>
              <option *ngFor="let module of modules()" [value]="module">{{ module }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>Du</label>
            <input type="date" [(ngModel)]="dateDebut">
          </div>
          <div class="form-field">
            <label>Au</label>
            <input type="date" [(ngModel)]="dateFin">
          </div>
        </div>
      </section>

      <section class="card table-card">
        <div class="section-title">
          <h2>Activite des agents</h2>
          <span>{{ filteredAgents().length }} agent(s)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Derniere connexion</th>
              <th>Dossiers traites</th>
              <th>Consultes</th>
              <th>Valides</th>
              <th>Alertes</th>
              <th>Statut</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let agent of filteredAgents()">
              <td>
                <strong>{{ agent.nom }}</strong>
                <span>{{ agent.role }}</span>
              </td>
              <td>{{ agent.derniere_connexion | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ agent.dossiers_traites }}</td>
              <td>{{ agent.dossiers_consultes }}</td>
              <td>{{ agent.dossiers_valides }}</td>
              <td>
                <span class="alert-badge" [class.ok]="agent.alertes === 0">{{ agent.alertes }}</span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="agent.statut">{{ displayStatut(agent.statut) }}</span>
              </td>
              <td class="actions-col">
                <button class="btn-view" (click)="voirAgent(agent)">Voir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="card agent-history-card" *ngIf="selectedAgent() as agent">
        <div class="section-title compact">
          <div>
            <h2>Actions recentes de {{ agent.nom }}</h2>
            <p>Audit des actions initial, update et delete avec heure exacte.</p>
          </div>
          <button class="btn-secondary" (click)="fermerAgent()">Fermer</button>
        </div>
        <div class="agent-actions">
          <button class="agent-action" *ngFor="let block of actionsForAgent(agent.nom)" (click)="selectBlock(block)">
            <span class="type-badge" [ngClass]="block.type">{{ block.type }}</span>
            <strong>{{ block.action }}</strong>
            <span>{{ block.dossier }} - {{ block.timestamp | date:'dd/MM/yyyy HH:mm' }}</span>
          </button>
          <div class="empty-state" *ngIf="actionsForAgent(agent.nom).length === 0">
            Aucune action recente pour cet agent.
          </div>
        </div>
      </section>

      <div class="audit-layout">
        <section class="card actions-card">
          <div class="section-title">
            <h2>Journal blockchain</h2>
            <span>{{ filteredBlocks().length }} trace(s)</span>
          </div>
          <p class="journal-subtitle">Activites recentes. Cliquez sur une trace pour consulter les informations detaillees.</p>
          <div class="tabs">
            <button [class.active]="typeAudit === 'tous'" (click)="typeAudit = 'tous'">Toutes</button>
            <button [class.active]="typeAudit === 'initial'" (click)="typeAudit = 'initial'">Initial</button>
            <button [class.active]="typeAudit === 'update'" (click)="typeAudit = 'update'">Update</button>
            <button [class.active]="typeAudit === 'delete'" (click)="typeAudit = 'delete'">Delete</button>
          </div>

          <button class="action-item" *ngFor="let block of filteredBlocks()" [class.selected]="selectedBlock()?.hash === block.hash" (click)="selectBlock(block)">
            <div class="action-top">
              <span class="type-badge" [ngClass]="block.type">{{ block.type }}</span>
              <time>{{ block.timestamp | date:'dd/MM/yyyy HH:mm' }}</time>
            </div>
            <strong>{{ block.action }}</strong>
            <span>{{ block.agent }} - {{ block.dossier }}</span>
          </button>
        </section>

        <section class="card detail-card" *ngIf="selectedBlock() as block">
          <div class="detail-head">
            <div>
              <span class="type-badge" [ngClass]="block.type">{{ block.type }}</span>
              <h2>{{ block.action }}</h2>
              <p>{{ block.agent }} a agi sur {{ block.dossier }} le {{ block.timestamp | date:'dd/MM/yyyy a HH:mm' }}.</p>
            </div>
            <span class="chain-state" [class.warning]="!chaineValide()">{{ chaineValide() ? 'Chaine validee' : 'Controle requis' }}</span>
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
              <div class="empty" *ngIf="block.initial.length === 0">Aucune valeur initiale pour cette action.</div>
              <div class="change-row" *ngFor="let item of block.initial">
                <span>{{ item.champ }}</span>
                <strong>{{ item.valeur }}</strong>
              </div>
            </section>

            <section>
              <h3>Update</h3>
              <div class="empty" *ngIf="block.updates.length === 0">Aucune modification pour cette action.</div>
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
              <div class="empty" *ngIf="block.deleted.length === 0">Aucune suppression pour cette action.</div>
              <div class="change-row delete-row" *ngFor="let item of block.deleted">
                <span>{{ item.champ }}</span>
                <strong>{{ item.valeur }}</strong>
              </div>
            </section>
          </div>

          <div class="hash-panel">
            <code>previous: {{ block.previousHash }}</code>
            <code>hash: {{ block.hash }}</code>
          </div>
        </section>
      </div>
    </app-layout>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
    h1, h2, h3 { margin: 0; color: #0f172a; }
    h1 { font-size: 1.6rem; }
    h2 { font-size: 1rem; }
    h3 { font-size: 0.88rem; }
    .subtitle, .filters-head p, .detail-head p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem; }
    .btn-primary, .btn-secondary, .btn-view { border: 0; border-radius: 6px; font-weight: 700; padding: 0.65rem 1rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-view { background: var(--primary-light); color: var(--primary-hover); padding: 0.45rem 0.8rem; }
    .btn-view:hover { background: #dbeafe; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
    .kpi-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
    .kpi-card .label { display: block; color: #64748b; text-transform: uppercase; font-size: 0.72rem; font-weight: 800; margin-bottom: 0.5rem; }
    .kpi-card strong { font-size: 1.6rem; color: #0f172a; }
    .kpi-card.security { border-color: #bbf7d0; background: #f0fdf4; }
    .kpi-card.security strong { color: #15803d; }
    .kpi-card.warning { border-color: #fed7aa; background: #fff7ed; }
    .kpi-card.warning strong { color: #c2410c; }

    .filters-card { padding: 1rem; margin-bottom: 1.25rem; }
    .filters-head, .section-title, .detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .filters-grid { display: grid; grid-template-columns: 2fr repeat(5, minmax(130px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.35rem; }
    label { color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    input, select { border: 1px solid #e2e8f0; border-radius: 8px; background: white; padding: 0.62rem 0.75rem; color: #334155; min-width: 0; }

    .table-card { overflow-x: auto; margin-bottom: 1.5rem; }
    .section-title { padding: 1rem 1rem 0; }
    .section-title span { color: #64748b; font-size: 0.8rem; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th { text-align: left; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; padding: 1rem; }
    td { padding: 1rem; border-top: 1px solid #f1f5f9; color: #334155; font-size: 0.88rem; }
    td strong { display: block; color: #0f172a; }
    td span { display: block; color: #64748b; font-size: 0.78rem; margin-top: 0.2rem; }
    .actions-col { text-align: right; }
    .alert-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 24px; border-radius: 999px; background: #fee2e2; color: #b91c1c; font-weight: 800; }
    .alert-badge.ok { background: #dcfce7; color: #15803d; }
    .status-badge, .type-badge { display: inline-flex; padding: 0.28rem 0.55rem; border-radius: 6px; font-weight: 800; font-size: 0.72rem; text-transform: uppercase; }
    .status-badge.connecte { background: #dcfce7; color: #15803d; }
    .status-badge.actif { background: #dbeafe; color: var(--primary-hover); }
    .status-badge.hors_ligne { background: #f1f5f9; color: #64748b; }
    .type-badge.initial { background: #e0f2fe; color: #0369a1; }
    .type-badge.update { background: #fef3c7; color: #92400e; }
    .type-badge.delete { background: #fee2e2; color: #b91c1c; }

    .agent-history-card { padding: 1rem; margin-bottom: 1.5rem; }
    .section-title.compact { padding: 0; margin-bottom: 1rem; }
    .section-title.compact p, .journal-subtitle { margin: 0.25rem 0 0; color: #64748b; font-size: 0.86rem; }
    .agent-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 0.75rem; }
    .agent-action { text-align: left; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 0.85rem; cursor: pointer; }
    .agent-action:hover { border-color: #93c5fd; background: var(--primary-light); }
    .agent-action strong { display: block; color: #0f172a; margin: 0.55rem 0 0.2rem; }
    .agent-action span:last-child { color: #64748b; font-size: 0.82rem; }
    .empty-state { color: #94a3b8; font-size: 0.88rem; padding: 1rem; }

    .audit-layout { display: grid; grid-template-columns: 360px 1fr; gap: 1.25rem; align-items: start; }
    .actions-card, .detail-card { padding: 1rem; }
    .journal-subtitle { margin-bottom: 1rem; }
    .tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35rem; margin: 1rem 0; }
    .tabs button { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 6px; padding: 0.45rem; color: #475569; font-weight: 800; cursor: pointer; }
    .tabs button.active { background: var(--primary-light); border-color: #93c5fd; color: var(--primary-hover); }
    .action-item { width: 100%; text-align: left; border: 1px solid #e2e8f0; background: white; border-radius: 8px; padding: 0.85rem; cursor: pointer; margin-bottom: 0.65rem; }
    .action-item.selected, .action-item:hover { border-color: #93c5fd; background: var(--primary-light); }
    .action-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.6rem; }
    .action-top time { color: #64748b; font-size: 0.75rem; }
    .action-item strong { display: block; color: #0f172a; margin-bottom: 0.25rem; }
    .action-item > span:last-child { color: #64748b; font-size: 0.82rem; }

    .chain-state { background: #dcfce7; color: #15803d; border-radius: 999px; padding: 0.35rem 0.7rem; font-size: 0.78rem; font-weight: 800; white-space: nowrap; }
    .chain-state.warning { background: #ffedd5; color: #c2410c; }
    .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin: 1.25rem 0; }
    .detail-grid div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.8rem; }
    .detail-grid span { display: block; color: #64748b; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.35rem; }
    .detail-grid strong { color: #0f172a; font-size: 0.88rem; }
    .changes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem; }
    .changes-grid section { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; min-height: 160px; }
    .change-row { border-top: 1px solid #f1f5f9; padding: 0.7rem 0 0; margin-top: 0.7rem; }
    .change-row span { color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    .change-row strong { display: block; color: #0f172a; margin-top: 0.25rem; }
    .update-row del { display: block; color: #b91c1c; margin-top: 0.25rem; }
    .delete-row strong { color: #b91c1c; }
    .empty { color: #94a3b8; font-size: 0.82rem; margin-top: 0.8rem; }
    .hash-panel { display: grid; gap: 0.4rem; margin-top: 1rem; }
    code { color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 0.45rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.74rem; }

    @media (max-width: 1100px) {
      .filters-grid, .detail-grid, .changes-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .audit-layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 720px) {
      .page-header, .filters-head, .section-title, .detail-head { align-items: stretch; flex-direction: column; }
      .kpi-grid, .filters-grid, .detail-grid, .changes-grid { grid-template-columns: 1fr; }
      .tabs { grid-template-columns: repeat(2, 1fr); }
      .btn-primary, .btn-secondary { justify-content: center; }
    }
  `]
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
  blockchain = this.auditService.blockchain;
  selectedHash = signal<string>('');
  selectedAgent = signal<AgentAudit | null>(null);

  chaineValide = computed(() => this.auditService.verifierChaine());
  totalTraites = computed(() => this.agents().reduce((total, agent) => total + agent.dossiers_traites, 0));
  totalConsultes = computed(() => this.agents().reduce((total, agent) => total + agent.dossiers_consultes, 0));
  modules = computed(() => Array.from(new Set(this.blockchain().map(block => block.module))));
  selectedBlock = computed<BlockchainAuditBlock | null>(() => this.blockchain().find(block => block.hash === this.selectedHash()) || this.filteredBlocks()[0] || null);

  filteredAgents(): AgentAudit[] {
    const search = this.search.trim().toLowerCase();

    return this.agents().filter(agent => {
      const matchesSearch = !search || `${agent.nom} ${agent.role}`.toLowerCase().includes(search);
      const matchesStatut = this.statut === 'tous' || agent.statut === this.statut;

      return matchesSearch && matchesStatut;
    });
  }

  filteredBlocks(): BlockchainAuditBlock[] {
    const search = this.search.trim().toLowerCase();
    const start = this.dateDebut ? new Date(`${this.dateDebut}T00:00:00`).getTime() : null;
    const end = this.dateFin ? new Date(`${this.dateFin}T23:59:59`).getTime() : null;

    return this.blockchain().filter(block => {
      const blockTime = new Date(block.timestamp).getTime();
      const searchable = `${block.agent} ${block.action} ${block.dossier} ${block.module}`.toLowerCase();
      const matchesSearch = !search || searchable.includes(search);
      const matchesType = this.typeAudit === 'tous' || block.type === this.typeAudit;
      const matchesModule = this.moduleAudit === 'tous' || block.module === this.moduleAudit;
      const matchesStart = start === null || blockTime >= start;
      const matchesEnd = end === null || blockTime <= end;

      return matchesSearch && matchesType && matchesModule && matchesStart && matchesEnd;
    });
  }

  displayStatut(statut: string): string {
    const labels: Record<string, string> = {
      connecte: 'Connecte',
      actif: 'Actif',
      hors_ligne: 'Hors ligne'
    };

    return labels[statut] || statut;
  }

  selectBlock(block: BlockchainAuditBlock) {
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

  actionsForAgent(agentName: string): BlockchainAuditBlock[] {
    return this.blockchain().filter(block => block.agent === agentName);
  }

  resetFilters() {
    this.search = '';
    this.statut = 'tous';
    this.typeAudit = 'tous';
    this.moduleAudit = 'tous';
    this.dateDebut = '';
    this.dateFin = '';
  }

}
