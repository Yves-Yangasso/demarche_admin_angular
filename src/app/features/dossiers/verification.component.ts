import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { DossierService } from '../../core/services/dossier.service';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="verification-container fade-in">
        <div class="header">
          <h1>Vérification de Document</h1>
          <p class="subtitle">Vérifiez l'authenticité d'un document administratif via son numéro de référence ou en scannant le QR Code.</p>
        </div>

        <div class="search-box card">
          <div class="search-tabs">
            <button [class.active]="tab() === 'ref'" (click)="tab.set('ref')">Référence</button>
            <button [class.active]="tab() === 'qr'" (click)="tab.set('qr')">QR Code</button>
          </div>

          <div class="tab-content" *ngIf="tab() === 'ref'">
            <div class="input-group">
              <input type="text" placeholder="Ex: TA-2026-00123" #refInput>
              <button class="btn btn-primary" (click)="verifier(refInput.value)">Vérifier</button>
            </div>
          </div>

          <div class="tab-content qr-tab" *ngIf="tab() === 'qr'">
            <div class="qr-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 7h10v10H7z"/><path d="M12 7v10M7 12h10"/></svg>
              <p>La caméra s'ouvrira ici pour scanner le code.</p>
              <button class="btn btn-secondary">Démarrer le scan</button>
            </div>
          </div>
        </div>

        <div class="result-container" *ngIf="resultat()">
          <div class="card result-card" [class.valid]="resultat().valide" [class.invalid]="!resultat().valide">
            <div class="result-header">
              <div class="result-icon">
                <svg *ngIf="resultat().valide" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <svg *ngIf="!resultat().valide" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <div class="result-title">
                <h2>{{ resultat().valide ? 'Document Authentique' : 'Document Non Reconnu' }}</h2>
                <p>{{ resultat().valide ? 'Ce document a été émis par la collectivité.' : 'Aucune correspondance trouvée dans nos archives.' }}</p>
              </div>
            </div>

            <div class="result-details" *ngIf="resultat().valide">
              <div class="detail-row">
                <label>Numéro</label>
                <span>{{ resultat().dossier.numero }}</span>
              </div>
              <div class="detail-row">
                <label>Type</label>
                <span>{{ resultat().dossier.type_demarche?.nom }}</span>
              </div>
              <div class="detail-row">
                <label>Titulaire</label>
                <span>{{ resultat().dossier.citoyen?.prenom }} {{ resultat().dossier.citoyen?.nom }}</span>
              </div>
              <div class="detail-row">
                <label>Date d'émission</label>
                <span>{{ resultat().dossier.date_cloture | date:'dd MMMM yyyy' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .verification-container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 3rem; }
    h1 { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; font-size: 1.1rem; margin-top: 0.5rem; max-width: 600px; margin-left: auto; margin-right: auto; }

    .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); overflow: hidden; }
    
    .search-tabs { display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .search-tabs button { flex: 1; padding: 1.25rem; border: none; background: none; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; border-bottom: 2px solid transparent; }
    .search-tabs button.active { color: #2563eb; border-bottom-color: #2563eb; background: white; }

    .tab-content { padding: 2.5rem; }
    .input-group { display: flex; gap: 1rem; }
    .input-group input { flex: 1; padding: 1rem 1.25rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1.125rem; outline: none; transition: border-color 0.2s; }
    .input-group input:focus { border-color: #2563eb; }
    
    .btn { padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-secondary { background: #f1f5f9; color: #475569; }

    .qr-tab { text-align: center; }
    .qr-placeholder { padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 12px; }

    .result-container { margin-top: 2rem; }
    .result-card { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
    .result-card.valid { border-left: 8px solid #16a34a; }
    .result-card.invalid { border-left: 8px solid #dc2626; }

    .result-header { display: flex; gap: 1.5rem; align-items: center; }
    .result-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .valid .result-icon { background: #f0fdf4; color: #16a34a; }
    .invalid .result-icon { background: #fef2f2; color: #dc2626; }

    .result-title h2 { margin: 0; font-size: 1.25rem; }
    .result-title p { margin: 0.25rem 0 0; color: #64748b; }

    .result-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; background: #f8fafc; padding: 1.5rem; border-radius: 12px; }
    .detail-row label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem; }
    .detail-row span { font-weight: 600; color: #0f172a; }
  `]
})
export class VerificationComponent {
  private dossierService = inject(DossierService);
  
  tab = signal<'ref' | 'qr'>('ref');
  resultat = signal<any>(null);

  verifier(ref: string) {
    if (!ref) return;
    // Simulation pour l'instant
    this.dossierService.getDossiers({ numero: ref }).subscribe(res => {
      if (res.dossiers.length > 0) {
        this.resultat.set({ valide: true, dossier: res.dossiers[0] });
      } else {
        this.resultat.set({ valide: false });
      }
    });
  }
}
