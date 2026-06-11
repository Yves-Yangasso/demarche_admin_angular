import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { StatsService } from '../../core/services/stats.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ia-page',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="ia-header">
        <div class="header-content">
          <div class="ai-badge">IA Expérimentale</div>
          <h1>Analyse Intelligente TerreAdmin</h1>
          <p class="subtitle" *ngIf="!isSuperAdmin()">Utilisez la puissance de l'IA pour optimiser la gestion des dossiers et anticiper les besoins.</p>
          <p class="subtitle" *ngIf="isSuperAdmin()">Analyse stratégique globale de la performance des collectivités territoriales.</p>
        </div>
        <div class="header-visual">
          <div class="pulse-ring"></div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
        </div>
      </div>

      <div class="ia-grid">
        <!-- VUE SUPER ADMIN : ANALYSE GLOBALE DES ORGANISATIONS -->
        <ng-container *ngIf="isSuperAdmin(); else localAdminIA">
          <section class="card ia-card highlight wide">
            <div class="card-header">
              <h3>Rapport Stratégique IA - Réseau National</h3>
              <button class="btn btn-primary" (click)="genererAnalyse()" [disabled]="analysing()">
                {{ analysing() ? 'Analyse en cours...' : 'Régénérer l\'analyse' }}
              </button>
            </div>
            
            <div class="analysis-content" *ngIf="globalAnalysis()">
              <div class="ia-markdown" [innerHTML]="formatMarkdown(globalAnalysis()!)"></div>
            </div>
            
            <div class="loading-state" *ngIf="analysing()">
               <div class="spinner"></div>
               <p>L'IA analyse les données de performance de toutes les organisations...</p>
            </div>
          </section>
        </ng-container>

        <!-- VUE ADMIN LOCAL / AGENT -->
        <ng-template #localAdminIA>
          <!-- Prévisions de charge -->
          <section class="card ia-card highlight">
            <div class="card-header">
              <h3>Prévision de Charge (7 jours)</h3>
              <span class="status-dot"></span>
            </div>
            <div class="previsions-container" *ngIf="previsions(); else loading">
              <div class="chart-mock">
                <div class="bar-group" *ngFor="let p of previsions().previsions">
                  <div class="bar" [style.height]="(p.prevision * 10) + 'px'" [class]="p.niveau"></div>
                  <span class="day">{{ p.jour }}</span>
                </div>
              </div>
              <div class="ia-insight">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <p>L'IA prévoit un pic d'activité pour ce <strong>Mercredi</strong>. Nous recommandons d'assigner des agents supplémentaires.</p>
              </div>
            </div>
          </section>

          <!-- Analyse des goulots d'étranglement -->
          <section class="card ia-card">
            <div class="card-header">
              <h3>Analyse des Goulots d'Étranglement</h3>
            </div>
            <div class="bottleneck-list">
              <div class="b-item">
                <div class="b-info">
                  <span class="label">Urbanisme</span>
                  <span class="val">Délai +2.5 jours</span>
                </div>
                <div class="b-progress"><div class="fill red" style="width: 85%"></div></div>
              </div>
              <div class="b-item">
                <div class="b-info">
                  <span class="label">État Civil</span>
                  <span class="val">Délai -0.5 jour</span>
                </div>
                <div class="b-progress"><div class="fill green" style="width: 30%"></div></div>
              </div>
            </div>
            <div class="ia-recommendation">
              <strong>Recommandation:</strong> Optimisez le flux de validation pour la catégorie Urbanisme.
            </div>
          </section>

          <!-- Insights Agents -->
          <section class="card ia-card wide">
            <div class="card-header">
              <h3>Optimisation de l'Allocation des Agents</h3>
            </div>
            <div class="agents-optimization">
              <div class="opt-text">
                <p>Basé sur l'historique de performance et la charge actuelle, voici l'allocation suggérée :</p>
                <ul>
                  <li><strong>Agent Aminata:</strong> Spécialiste Foncier - Sur-chargée (Ré-allouer 2 dossiers)</li>
                  <li><strong>Agent Moussa:</strong> Spécialiste État Civil - Disponible (Peut prendre 5 dossiers)</li>
                </ul>
              </div>
              <button class="btn btn-primary">Appliquer l'optimisation</button>
            </div>
          </section>
        </ng-template>
      </div>

      <ng-template #loading>
        <div class="loading-placeholder">
          <div class="skeleton" style="height: 150px;"></div>
        </div>
      </ng-template>
    </app-layout>
  `,
  styles: [`
    .ia-header { 
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
      color: white; 
      padding: 3rem; 
      border-radius: 16px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }
    .header-content { position: relative; z-index: 2; }
    .ai-badge { background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; width: fit-content; margin-bottom: 1rem; }
    .ia-header h1 { margin: 0; font-size: 2rem; }
    .subtitle { color: #94a3b8; margin-top: 0.5rem; max-width: 500px; }
    
    .header-visual { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
    .pulse-ring { position: absolute; width: 100%; height: 100%; border: 4px solid #8b5cf6; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

    .ia-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .ia-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; }
    .ia-card.highlight { border-left: 4px solid #8b5cf6; }
    .ia-card.wide { grid-column: span 2; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }

    .analysis-content { background: #f8fafc; border-radius: 12px; padding: 2rem; color: #1e293b; line-height: 1.6; }
    .ia-markdown { font-size: 0.95rem; }
    .ia-markdown ::ng-deep h4 { color: #5b21b6; margin-top: 1.5rem; }
    .ia-markdown ::ng-deep ul { padding-left: 1.5rem; }

    .spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .chart-mock { display: flex; align-items: flex-end; gap: 1rem; height: 180px; padding: 1rem; background: #f8fafc; border-radius: 8px; margin-bottom: 1.5rem; justify-content: space-around; }
    .bar { width: 20px; border-radius: 4px 4px 0 0; }
    .bar.faible { background: #10b981; }
    .bar.moyen { background: #f59e0b; }
    .bar.eleve { background: #ef4444; }
    .day { font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; }

    .ia-insight { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 1rem; display: flex; gap: 0.75rem; color: #5b21b6; font-size: 0.875rem; }
    .ia-insight p { margin: 0; }

    .bottleneck-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .b-info { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem; }
    .b-progress { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .fill { height: 100%; border-radius: 4px; }
    .fill.red { background: #ef4444; }
    .fill.green { background: #10b981; }
    .ia-recommendation { margin-top: 1.5rem; padding: 1rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 0.875rem; color: #166534; }

    .agents-optimization { display: flex; justify-content: space-between; align-items: center; }
    .opt-text p { color: #64748b; font-size: 0.875rem; margin-bottom: 1rem; }
    .opt-text ul { font-size: 0.875rem; color: #334155; }
    .btn-primary { background: #8b5cf6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }

    .loading-placeholder .skeleton { background: #f1f5f9; border-radius: 8px; width: 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
  `]
})
export class IaPageComponent implements OnInit {
  private statsService = inject(StatsService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  previsions = signal<any>(null);
  globalAnalysis = signal<string | null>(null);
  analysing = signal<boolean>(false);

  private dataLoaded = false;

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user && !this.dataLoaded) {
        this.dataLoaded = true;
        this.initIAData();
      }
    }, { allowSignalWrites: true });
  }

  isSuperAdmin() {
    return this.authService.user()?.role === 'super_admin';
  }

  ngOnInit() {
    // Les agents n'ont plus accès à la page d'analyse globale
    if (this.authService.user()?.role === 'agent') {
      this.router.navigate(['/dashboard']);
      return;
    }
  }

  initIAData() {
    if (this.isSuperAdmin()) {
      this.genererAnalyse();
    } else {
      this.statsService.getPrevisions().subscribe(data => this.previsions.set(data));
    }
  }

  genererAnalyse() {
    this.analysing.set(true);
    this.http.get<any>('/api/ia/analyse-organisations').subscribe({
      next: (res) => {
        this.globalAnalysis.set(res.analyse);
        this.analysing.set(false);
      },
      error: () => this.analysing.set(false)
    });
  }

  formatMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/### (.*)/g, '<h4>$1</h4>')
      .replace(/\*\* (.*) \*\*/g, '<strong>$1</strong>')
      .replace(/- (.*)/g, '<li>$1</li>');
  }
}
