import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { DossierService } from '../../core/services/dossier.service';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-dossier-traitement',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div *ngIf="dossier() as d; else loading" class="fade-in">
        <div class="header">
          <button class="btn-back" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1>Traitement du dossier {{ d.numero }}</h1>
        </div>

        <div class="card treatment-card">
          <div class="form-group">
            <label>Nouveau statut</label>
            <select [(ngModel)]="nouveauStatut" class="form-control">
              <option value="en_cours">En cours de traitement</option>
              <option value="doc_requis">Documents complémentaires requis</option>
              <option value="en_validation">En attente de validation</option>
              <option value="cloture">Clôturer (Approuvé)</option>
              <option value="rejete">Rejeter</option>
            </select>
          </div>

          <div class="form-group">
            <label>Commentaire / Justification</label>
            <textarea [(ngModel)]="commentaire" class="form-control" rows="5" placeholder="Expliquez la décision ou les documents manquants..."></textarea>
          </div>

          <div class="form-group">
            <label>Joindre un document (optionnel)</label>
            <div class="file-upload">
              <input type="file" (change)="onFileSelected($event)" id="fileInput" hidden>
              <label for="fileInput" class="file-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {{ selectedFile ? selectedFile.name : 'Choisir un fichier' }}
              </label>
            </div>
            <small class="help-text">Ce document sera accessible par le citoyen sur son application mobile.</small>
          </div>

          <div class="actions">
            <button class="btn btn-secondary" (click)="goBack()">Annuler</button>
            <button class="btn btn-primary" (click)="valider()" [disabled]="!nouveauStatut || uploading()">
              {{ uploading() ? 'Traitement...' : 'Valider le changement' }}
            </button>
          </div>
        </div>
      </div>

      <ng-template #loading>
        <div class="loading-state">Chargement...</div>
      </ng-template>
    </app-layout>
  `,
  styles: [`
    .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .btn-back { background: none; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; cursor: pointer; }
    
    .treatment-card { background: white; padding: 2rem; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; }
    
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #475569; }
    
    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
    }
    .form-control:focus { border-color: var(--primary-color); ring: 2px solid var(--primary-light); }

    .file-upload { margin-top: 0.5rem; }
    .file-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: 2px dashed #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      color: #64748b;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .file-label:hover { border-color: var(--primary-color); background: var(--primary-light); color: var(--primary-color); }
    .help-text { color: #94a3b8; font-size: 0.75rem; margin-top: 0.5rem; display: block; }

    .actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
    .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class DossierTraitementComponent implements OnInit {
  private dossierService = inject(DossierService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  dossier = signal<any>(null);
  nouveauStatut = '';
  commentaire = '';
  selectedFile: File | null = null;
  uploading = signal<boolean>(false);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.dossierService.getDossier(id).subscribe(d => {
      this.dossier.set(d);
      this.nouveauStatut = d.statut;
    });
  }

  goBack() {
    this.router.navigate(['/dossiers', this.dossier().id]);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  valider() {
    this.uploading.set(true);
    this.dossierService.changerStatut(this.dossier().id, this.nouveauStatut, this.commentaire)
      .pipe(
        switchMap(() => {
          if (this.selectedFile) {
            return this.dossierService.uploadDocument(
              this.dossier().id, 
              this.selectedFile, 
              `Réponse administrative - ${this.dossier().numero}`,
              'reponse'
            );
          }
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.uploading.set(false);
          this.router.navigate(['/dossiers', this.dossier().id]);
        },
        error: () => {
          this.uploading.set(false);
          alert('Une erreur est survenue lors du traitement.');
        }
      });
  }
}
