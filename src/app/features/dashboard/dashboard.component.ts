import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { StatsService } from '../../core/services/stats.service';
import { AuthService } from '../../core/services/auth.service';
import { DossierService } from '../../core/services/dossier.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="dashboard-header">
        <div *ngIf="!isSuperAdmin()">
          <h1>{{ isAgent() ? 'Mon Tableau de bord' : 'Tableau de bord avancé' }}</h1>
          <p class="subtitle">{{ isAgent() ? 'Suivi de mes dossiers et de mes performances.' : 'Analyses et variations de l\'activité administrative.' }}</p>
        </div>
        <div *ngIf="isSuperAdmin()">
          <h1>Performance des Organisations</h1>
          <p class="subtitle">Suivi en temps réel de l'activité des collectivités territoriales.</p>
        </div>
        <div class="header-actions" *ngIf="!isSuperAdmin()">
          <div class="date-filter">
            <input type="date" (change)="onDateChange($event, 'debut')">
            <span>au</span>
            <input type="date" (change)="onDateChange($event, 'fin')">
          </div>
          <select (change)="changeChartType($event)">
            <option value="bar">Barres</option>
            <option value="line">Lignes</option>
          </select>
        </div>
      </div>

      <!-- VUE SUPER ADMIN -->
      <div class="super-admin-content" *ngIf="isSuperAdmin()">
        
        <!-- GRAPHES NATIONAUX -->
        <div class="dashboard-grid" *ngIf="globalStats()">
          <section class="card chart-section">
            <div class="card-header">
              <h3>Volume par Organisation</h3>
            </div>
            <div class="chart-container">
              <canvas #orgVolumeChart></canvas>
            </div>
          </section>

          <section class="card chart-section">
            <div class="card-header">
              <h3>Tendance Nationale (7j)</h3>
            </div>
            <div class="chart-container">
              <canvas #nationalTrendChart></canvas>
            </div>
          </section>
        </div>

        <!-- TABLEAU DE PERFORMANCE -->
        <section class="card org-perf-section" *ngIf="globalStats(); else loading">
          <div class="card-header">
            <h3>Réseau TerreAdmin</h3>
            <button class="btn-text" (click)="voirOrganisations()">Gérer les organisations</button>
          </div>
          <div class="table-responsive">
            <table class="recent-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Dossiers Total</th>
                  <th>Dossiers Clos</th>
                  <th>En Retard</th>
                  <th>Taux de complétion</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let org of globalStats()">
                  <td>
                    <strong>{{ org.nom }}</strong>
                    <div class="org-code">{{ org.code }}</div>
                  </td>
                  <td>{{ org.stats.total_dossiers }}</td>
                  <td class="green-text">{{ org.stats.dossiers_clos }}</td>
                  <td [class.red-text]="org.stats.en_retard > 0">{{ org.stats.en_retard }}</td>
                  <td>
                    <div class="progress-container">
                      <div class="progress-bar" [style.width.%]="org.stats.taux_completion"></div>
                      <span>{{ org.stats.taux_completion }}%</span>
                    </div>
                  </td>
                  <td>
                    <span class="status-pill" [class.active]="org.actif">
                      {{ org.actif ? 'Actif' : 'Bloqué' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- VUE ADMIN / AGENT / CITOYEN -->
      <ng-container *ngIf="!isSuperAdmin()">
        <div class="stats-grid" *ngIf="stats(); else loading">
          <div class="stat-card">
            <div class="stat-icon grey">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div class="stat-info">
              <span class="label">En attente</span>
              <span class="value">{{ stats().par_statut.nouveau || 0 }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>
            </div>
            <div class="stat-info">
              <span class="label">En cours</span>
              <span class="value">{{ stats().par_statut.en_cours || 0 }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            </div>
            <div class="stat-info">
              <span class="label">Complémentaire</span>
              <span class="value">{{ stats().par_statut.doc_requis || 0 }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon yellow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div class="stat-info">
              <span class="label">Approuvé</span>
              <span class="value">{{ stats().par_statut.en_validation || 0 }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <div class="stat-info">
              <span class="label">Rejeté</span>
              <span class="value">{{ stats().par_statut.rejete || 0 }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div class="stat-info">
              <span class="label">Clôturé</span>
              <span class="value">{{ stats().par_statut.cloture || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <section class="card chart-section">
            <div class="card-header">
              <h3>Évolution du volume de dossiers</h3>
            </div>
            <div class="chart-container">
              <canvas #volumeChart></canvas>
            </div>
          </section>

          <section class="card chart-section">
            <div class="card-header">
              <h3>Répartition par catégorie</h3>
            </div>
            <div class="chart-container">
              <canvas #categoryChart></canvas>
            </div>
          </section>
        </div>

        <section class="card recent-dossiers-section" *ngIf="recentDossiers().length > 0">
          <div class="card-header">
            <h3>Dossiers récents</h3>
            <button class="btn-text" (click)="voirTout()">Voir tout</button>
          </div>
          <div class="table-responsive">
            <table class="recent-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Titre</th>
                  <th>Citoyen</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of recentDossiers()">
                  <td class="font-mono">{{ d.numero }}</td>
                  <td>{{ d.titre }}</td>
                  <td>{{ d.citoyen?.prenom }} {{ d.citoyen?.nom }}</td>
                  <td>{{ d.date_soumission | date:'dd/MM/yyyy' }}</td>
                  <td><span class="status-badge" [ngClass]="d.statut">{{ d.statut }}</span></td>
                  <td>
                    <button class="btn-icon" (click)="goToDossier(d.id)">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </ng-container>

      <ng-template #loading>
        <div class="loading-state">
          <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
          <p>Chargement des données...</p>
        </div>
      </ng-template>
    </app-layout>
  `,
  styles: [`
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-actions { display: flex; gap: 1rem; align-items: center; }
    .date-filter { display: flex; align-items: center; gap: 0.5rem; background: white; padding: 0.5rem; border-radius: 8px; border: 1px solid #e2e8f0; }
    .date-filter input { border: none; font-size: 0.875rem; outline: none; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .stat-card { background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .stat-icon.blue { background: #eff6ff; color: #2563eb; }
    .stat-icon.red { background: #fef2f2; color: #dc2626; }
    .stat-icon.grey { background: #f1f5f9; color: #64748b; }
    .stat-icon.purple { background: #f5f3ff; color: #7c3aed; }
    .stat-icon.yellow { background: #fffbeb; color: #d97706; }
    .stat-icon.green { background: #f0fdf4; color: #16a34a; }
    .label { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .value { font-size: 1.5rem; font-weight: 700; color: #0f172a; display: block; }

    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; }
    .chart-container { height: 280px; position: relative; }

    .org-perf-section { padding: 0; }
    .org-perf-section .card-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .org-code { font-size: 0.75rem; color: #64748b; font-family: monospace; }
    .green-text { color: #16a34a; font-weight: 600; }
    .red-text { color: #dc2626; font-weight: 600; }
    
    .progress-container { display: flex; align-items: center; gap: 0.75rem; width: 100%; max-width: 160px; }
    .progress-bar { height: 8px; background: #3b82f6; border-radius: 4px; }
    .progress-container span { font-size: 0.75rem; font-weight: 600; color: #64748b; min-width: 40px; }

    .status-pill { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: #f1f5f9; color: #64748b; }
    .status-pill.active { background: #e6f4ea; color: #34a853; }

    .recent-dossiers-section { margin-top: 2rem; padding: 0; }
    .btn-text { background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; font-size: 0.875rem; }

    .table-responsive { overflow-x: auto; }
    .recent-table { width: 100%; border-collapse: collapse; }
    .recent-table th { text-align: left; padding: 1rem 1.5rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 600; background: #f8fafc; }
    .recent-table td { padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-weight: 600; color: #0f172a; }

    .status-badge { padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
    .status-badge.nouveau { background: #eff6ff; color: #2563eb; }
    .status-badge.en_cours { background: #fefce8; color: #ca8a04; }
    .status-badge.cloture { background: #f0fdf4; color: #16a34a; }
    .status-badge.rejete { background: #fef2f2; color: #dc2626; }
    .status-badge.doc_requis { background: #f5f3ff; color: #7c3aed; }
    .status-badge.en_validation { background: #fffbeb; color: #d97706; }

    .btn-icon { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.25rem; border-radius: 4px; }
    .btn-icon:hover { color: #2563eb; background: #eff6ff; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: #64748b; gap: 1rem; }
    .spinner { animation: rotate 2s linear infinite; width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('volumeChart') volumeCanvas!: ElementRef;
  @ViewChild('categoryChart') categoryCanvas!: ElementRef;
  @ViewChild('orgVolumeChart') orgVolumeCanvas!: ElementRef;
  @ViewChild('nationalTrendChart') nationalTrendCanvas!: ElementRef;

  private statsService = inject(StatsService);
  private authService = inject(AuthService);
  private dossierService = inject(DossierService);
  private router = inject(Router);

  stats = signal<any>(null);
  globalStats = signal<any[] | null>(null);
  recentDossiers = signal<any[]>([]);
  filters = signal<any>({});
  chartType = signal<string>('bar');
  
  volumeChartInstance?: Chart;
  categoryChartInstance?: Chart;
  orgVolumeChartInstance?: Chart;
  nationalTrendChartInstance?: Chart;

  private dataLoaded = false;

  constructor() {
    // Utiliser un effect pour réagir au chargement de l'utilisateur
    effect(() => {
      const user = this.authService.user();
      if (user && !this.dataLoaded) {
        this.dataLoaded = true;
        this.initDashboardData();
      }
    }, { allowSignalWrites: true });
  }

  isSuperAdmin() {
    const user = this.authService.user();
    return user?.role === 'super_admin';
  }

  isAgent() {
    const user = this.authService.user();
    return user?.role === 'agent';
  }

  ngOnInit() {
    // On laisse l'effect gérer le chargement initial pour éviter les race conditions
  }

  initDashboardData() {
    if (this.isSuperAdmin()) {
      this.loadGlobalStats();
    } else {
      this.loadStats();
      this.loadRecentDossiers();
    }
  }

  loadGlobalStats() {
    this.statsService.getGlobalStats().subscribe(data => {
      this.globalStats.set(data);
      setTimeout(() => this.initSuperAdminCharts(), 100);
    });
  }

  voirOrganisations() {
    this.router.navigate(['/organisations']);
  }

  loadRecentDossiers() {
    this.dossierService.getDossiers({ per_page: 5 }).subscribe(data => {
      this.recentDossiers.set(data.dossiers);
    });
  }

  voirTout() {
    this.router.navigate(['/dossiers']);
  }

  goToDossier(id: number) {
    this.router.navigate(['/dossiers', id]);
  }

  ngAfterViewInit() {
    // Les graphes seront initialisés quand les données arrivent
  }

  loadStats() {
    this.statsService.getDashboardStats(this.filters()).subscribe(data => {
      this.stats.set(data);
      this.initCharts();
    });
  }

  onDateChange(event: any, type: 'debut' | 'fin') {
    const key = type === 'debut' ? 'date_debut' : 'date_fin';
    this.filters.update(f => ({ ...f, [key]: event.target.value }));
    this.loadStats();
  }

  changeChartType(event: any) {
    this.chartType.set(event.target.value);
    this.initCharts();
  }

  initSuperAdminCharts() {
    const data = this.globalStats();
    if (!data) return;

    // 1. Chart Volume par Organisation
    if (this.orgVolumeChartInstance) this.orgVolumeChartInstance.destroy();
    if (this.orgVolumeCanvas) {
      this.orgVolumeChartInstance = new Chart(this.orgVolumeCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: data.map(org => org.nom),
          datasets: [{
            label: 'Total Dossiers',
            data: data.map(org => org.stats.total_dossiers),
            backgroundColor: '#3b82f6',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // 2. Chart Tendance Nationale (Aggrégation)
    if (this.nationalTrendChartInstance) this.nationalTrendChartInstance.destroy();
    if (this.nationalTrendCanvas) {
      // Aggréger les volumes par date
      const nationalTrend: any = {};
      data.forEach(org => {
        org.stats.performance_7_jours.forEach((p: any) => {
          nationalTrend[p.date] = (nationalTrend[p.date] || 0) + p.count;
        });
      });

      const labels = Object.keys(nationalTrend).sort();
      const values = labels.map(l => nationalTrend[l]);

      this.nationalTrendChartInstance = new Chart(this.nationalTrendCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Volume National',
            data: values,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  initCharts() {
    const data = this.stats();
    if (!data || this.isSuperAdmin()) return;

    // Volume Chart
    if (this.volumeChartInstance) this.volumeChartInstance.destroy();
    if (this.volumeCanvas) {
      this.volumeChartInstance = new Chart(this.volumeCanvas.nativeElement, {
        type: this.chartType() as any,
        data: {
          labels: data.volume_7_jours.map((d: any) => d.date),
          datasets: [{
            label: 'Dossiers soumis',
            data: data.volume_7_jours.map((d: any) => d.count),
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 2,
            tension: 0.3
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // Category Chart
    if (this.categoryChartInstance) this.categoryChartInstance.destroy();
    if (this.categoryCanvas) {
      this.categoryChartInstance = new Chart(this.categoryCanvas.nativeElement, {
        type: 'pie',
        data: {
          labels: data.par_categorie.map((c: any) => c.categorie),
          datasets: [{
            data: data.par_categorie.map((c: any) => c.count),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }
}
