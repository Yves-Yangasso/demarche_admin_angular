import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { StatsService } from '../../core/services/stats.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-stats-report',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="header">
        <h1>{{ isAgent() ? 'Ma Performance' : 'Rapports et Analyses' }}</h1>
        <p class="subtitle" *ngIf="!isSuperAdmin()">{{ isAgent() ? 'Analyse de ma productivité et de mes délais.' : 'Analyse approfondie de la performance administrative locale.' }}</p>
        <p class="subtitle" *ngIf="isSuperAdmin()">Rapport consolidé de la performance du réseau national.</p>
      </div>
      
      <!-- VUE SUPER ADMIN : RAPPORTS GLOBAUX -->
      <div class="reports-grid" *ngIf="isSuperAdmin() && globalStats()">
        <section class="card wide">
          <h3>Récapitulatif National</h3>
          <div class="stats-mini-grid">
            <div class="metric-box">
              <span class="label">Total Organisations</span>
              <span class="value">{{ globalStats()?.length }}</span>
            </div>
            <div class="metric-box">
              <span class="label">Dossiers Totaux</span>
              <span class="value">{{ getTotalDossiers() }}</span>
            </div>
            <div class="metric-box">
              <span class="label">Taux de Clôture Moyen</span>
              <span class="value">{{ getGlobalSuccessRate() }}%</span>
            </div>
            <div class="metric-box">
              <span class="label">Volume de Retards</span>
              <span class="value red">{{ getTotalRetards() }}</span>
            </div>
          </div>
        </section>

        <section class="card wide">
          <h3>Classement de Performance par Collectivité</h3>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Dossiers</th>
                <th>Clos</th>
                <th>Retards</th>
                <th>Taux de complétion</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let org of globalStats()">
                <td><strong>{{ org.nom }}</strong> ({{ org.code }})</td>
                <td>{{ org.stats.total_dossiers }}</td>
                <td class="green-text">{{ org.stats.dossiers_clos }}</td>
                <td [class.red-text]="org.stats.en_retard > 0">{{ org.stats.en_retard }}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress" [style.width.%]="org.stats.taux_completion"></div>
                    <span>{{ org.stats.taux_completion }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <!-- VUE ADMIN LOCAL / AGENT -->
      <div class="reports-grid" *ngIf="!isSuperAdmin() && stats()">
        <!-- Performance Globale -->
        <section class="card">
          <h3>Performance de traitement</h3>
          <div class="metric">
            <span class="label">Délai moyen de traitement</span>
            <span class="value">{{ stats().delai_moyen_jours }} jours</span>
          </div>
          <div class="metric">
            <span class="label">Taux de satisfaction</span>
            <span class="value">{{ stats().satisfaction_moyenne * 20 }}%</span>
          </div>
        </section>

        <!-- Prévisions IA -->
        <section class="card" *ngIf="previsions()">
          <h3>Prévisions de charge (IA)</h3>
          <div class="previsions-list">
            <div class="prev-item" *ngFor="let p of previsions().previsions">
              <span class="date">{{ p.jour }} {{ p.date | date:'dd/MM' }}</span>
              <span class="count">{{ p.prevision }} dossiers</span>
              <span class="level" [class]="p.niveau">{{ p.niveau }}</span>
            </div>
          </div>
        </section>

        <!-- Performance Agents -->
        <section class="card wide" *ngIf="agentsStats()">
          <h3>{{ isAgent() ? 'Ma Performance Détaillée' : 'Performance des Agents' }}</h3>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Assignés</th>
                <th>Clôturés</th>
                <th>En retard</th>
                <th>Taux de complétion</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of agentsStats()">
                <td>{{ a.agent.prenom }} {{ a.agent.nom }}</td>
                <td>{{ a.total_assignes }}</td>
                <td>{{ a.total_clos }}</td>
                <td>{{ a.en_retard }}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress" [style.width]="a.taux_completion + '%'"></div>
                    <span>{{ a.taux_completion }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <div class="loading-state" *ngIf="loading()">
         <p>Chargement des analyses...</p>
      </div>
    </app-layout>
  `,
  styles: [`
    .header { margin-bottom: 2rem; }
    .subtitle { color: #64748b; }
    
    .reports-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .card { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }
    .card.wide { grid-column: span 2; }
    .card h3 { margin-bottom: 1.5rem; color: #0f172a; font-size: 1.125rem; }

    .stats-mini-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .metric-box { background: #f8fafc; padding: 1.25rem; border-radius: 8px; display: flex; flex-direction: column; gap: 0.5rem; }
    .metric-box .label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: #64748b; }
    .metric-box .value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .metric-box .value.red { color: #ef4444; }

    .metric { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
    .metric:last-child { border-bottom: none; }
    .metric .label { color: #64748b; font-size: 0.875rem; }
    .metric .value { font-weight: 600; color: #0f172a; }

    .green-text { color: #16a34a; font-weight: 600; }
    .red-text { color: #dc2626; font-weight: 600; }

    .previsions-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .prev-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; }
    .level { padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .level.faible { background: #f0fdf4; color: #16a34a; }
    .level.moyen { background: #fffbeb; color: #d97706; }
    .level.eleve { background: #fef2f2; color: #dc2626; }

    .stats-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .stats-table th { text-align: left; padding: 0.75rem; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .stats-table td { padding: 0.75rem; border-bottom: 1px solid #f1f5f9; }

    .progress-bar { height: 8px; background: #f1f5f9; border-radius: 4px; position: relative; width: 100px; display: inline-block; vertical-align: middle; margin-right: 0.5rem; }
    .progress { height: 100%; background: #3b82f6; border-radius: 4px; }
    
    .loading-state { padding: 4rem; text-align: center; color: #64748b; }
  `]
})
export class StatsReportComponent implements OnInit {
  private statsService = inject(StatsService);
  private authService = inject(AuthService);
  
  stats = signal<any>(null);
  globalStats = signal<any[] | null>(null);
  previsions = signal<any>(null);
  agentsStats = signal<any>(null);
  loading = signal<boolean>(false);

  private dataLoaded = false;

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user && !this.dataLoaded) {
        this.dataLoaded = true;
        this.initData();
      }
    }, { allowSignalWrites: true });
  }

  isSuperAdmin() {
    return this.authService.user()?.role === 'super_admin';
  }

  isAgent() {
    return this.authService.user()?.role === 'agent';
  }

  ngOnInit() {}

  initData() {
    this.loading.set(true);
    if (this.isSuperAdmin()) {
      this.statsService.getGlobalStats().subscribe({
        next: (data) => {
          this.globalStats.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.statsService.getDashboardStats({}).subscribe(data => this.stats.set(data));
      this.statsService.getPrevisions().subscribe(data => this.previsions.set(data));
      this.statsService.getAgentsStats().subscribe({
        next: (data) => {
          this.agentsStats.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  getTotalDossiers() {
    return this.globalStats()?.reduce((acc, org) => acc + org.stats.total_dossiers, 0) || 0;
  }

  getTotalRetards() {
    return this.globalStats()?.reduce((acc, org) => acc + org.stats.en_retard, 0) || 0;
  }

  getGlobalSuccessRate() {
    const total = this.getTotalDossiers();
    if (total === 0) return 0;
    const clos = this.globalStats()?.reduce((acc, org) => acc + org.stats.dossiers_clos, 0) || 0;
    return Math.round((clos / total) * 100);
  }
}
