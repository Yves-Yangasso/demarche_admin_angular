import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LayoutComponent } from '../../shared/components/layout/layout.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="header">
        <div>
          <h1>Rôles et Privilèges</h1>
          <p class="subtitle">Gérez les rôles personnalisés de votre organisation et définissez leurs habilitations.</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nouveau Rôle
        </button>
      </div>

      <div class="roles-grid">
        <div class="card role-card" *ngFor="let role of roles()">
          <div class="role-header">
            <h3>{{ role.nom }}</h3>
            <span class="status-pill" [class.active]="role.actif">{{ role.actif ? 'Actif' : 'Désactivé' }}</span>
          </div>
          <p class="desc">{{ role.description || 'Pas de description' }}</p>
          
          <div class="privileges-list">
            <span class="priv-badge" *ngFor="let p of role.privileges">{{ p }}</span>
          </div>

          <div class="role-actions">
            <button class="btn-icon" (click)="editRole(role)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon delete" (click)="deleteRole(role.id)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL CRÉATION / EDITION -->
      <div class="modal-overlay" *ngIf="showModal()">
        <div class="modal-content glass-modal animate-scale">
          <div class="modal-header">
            <h3>{{ editingId ? 'Modifier le Rôle' : 'Nouveau Rôle' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nom du rôle</label>
              <input type="text" [(ngModel)]="form.nom" placeholder="ex: Chef de Service" class="form-control">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="form.description" class="form-control"></textarea>
            </div>
            
            <div class="privileges-selector">
              <label>Privilèges accordés</label>
              <div class="priv-grid">
                <label class="priv-item" *ngFor="let p of catalog()">
                  <input type="checkbox" [checked]="hasPrivilege(p.code)" (change)="togglePrivilege(p.code)">
                  <div class="priv-info">
                    <div class="priv-label">{{ p.label }}</div>
                    <div class="priv-desc">{{ p.description }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
            <button class="btn btn-primary" (click)="save()">{{ editingId ? 'Mettre à jour' : 'Créer le rôle' }}</button>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }

    .roles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .role-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    
    .role-header { display: flex; justify-content: space-between; align-items: center; }
    .role-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
    .status-pill { font-size: 0.7rem; padding: 2px 8px; border-radius: 99px; background: #f1f5f9; color: #64748b; font-weight: 600; }
    .status-pill.active { background: #e6f4ea; color: #34a853; }
    
    .desc { font-size: 0.85rem; color: #64748b; margin: 0; }
    
    .privileges-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .priv-badge { font-size: 0.7rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #475569; }

    .role-actions { display: flex; gap: 0.5rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    .btn-icon { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.375rem; border-radius: 6px; }
    .btn-icon:hover { color: #2563eb; background: #eff6ff; }
    .btn-icon.delete:hover { color: #ef4444; background: #fef2f2; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
    .glass-modal { background: white; border-radius: 12px; width: 100%; max-width: 600px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.75rem; }

    .form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .form-control { padding: 0.625rem; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; }

    .priv-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; margin-top: 0.5rem; }
    .priv-item { display: flex; gap: 1rem; padding: 0.75rem; border: 1px solid #f1f5f9; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
    .priv-item:hover { background: #f8fafc; }
    .priv-label { font-size: 0.85rem; font-weight: 600; color: #1e293b; }
    .priv-desc { font-size: 0.75rem; color: #64748b; }
  `]
})
export class RoleListComponent implements OnInit {
  private http = inject(HttpClient);

  roles = signal<any[]>([]);
  catalog = signal<any[]>([]);
  showModal = signal<boolean>(false);
  editingId: number | null = null;
  
  form = { nom: '', description: '', privileges: [] as string[] };

  ngOnInit() {
    this.loadRoles();
    this.loadCatalog();
  }

  loadRoles() {
    this.http.get<any[]>('/api/roles').subscribe(data => this.roles.set(data));
  }

  loadCatalog() {
    this.http.get<any[]>('/api/roles/privileges').subscribe(data => this.catalog.set(data));
  }

  openModal() {
    this.editingId = null;
    this.form = { nom: '', description: '', privileges: [] };
    this.showModal.set(true);
  }

  editRole(role: any) {
    this.editingId = role.id;
    this.form = { nom: role.nom, description: role.description, privileges: [...role.privileges] };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  hasPrivilege(code: string) { return this.form.privileges.includes(code); }

  togglePrivilege(code: string) {
    if (this.hasPrivilege(code)) {
      this.form.privileges = this.form.privileges.filter(p => p !== code);
    } else {
      this.form.privileges.push(code);
    }
  }

  save() {
    if (this.editingId) {
      this.http.put(`/api/roles/${this.editingId}`, this.form).subscribe(() => {
        this.closeModal();
        this.loadRoles();
      });
    } else {
      this.http.post('/api/roles', this.form).subscribe(() => {
        this.closeModal();
        this.loadRoles();
      });
    }
  }

  deleteRole(id: number) {
    if (confirm('Voulez-vous vraiment désactiver ce rôle ?')) {
      this.http.delete(`/api/roles/${id}`).subscribe(() => this.loadRoles());
    }
  }
}
