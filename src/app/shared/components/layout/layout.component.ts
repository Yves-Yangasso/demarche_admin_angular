import { Component, inject, computed, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AiChatComponent } from '../ai-chat/ai-chat.component';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AiChatComponent, ToastComponent],
  template: `
    <div class="app-container" [class.sidebar-collapsed]="isCollapsed()">
      <app-toast></app-toast>
      <aside class="sidebar">
        <div class="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span class="brand-name">SunuDëkk</span>
        </div>
        
        <nav class="nav-menu">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span class="nav-label">Tableau de bord</span>
          </a>
          <!-- Dossiers : masqués pour Super Admin -->
          <a *ngIf="user()?.role !== 'super_admin'" routerLink="/dossiers" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <span class="nav-label">Dossiers</span>
          </a>
          <!-- Organisations : uniquement pour Super Admin -->
          <a *ngIf="user()?.role === 'super_admin'" routerLink="/organisations" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span class="nav-label">Organisations</span>
          </a>
          <!-- Agents et Administrateurs : Super Admin gère les admins, Admin local gère les agents. Masqué pour les agents. -->
          <a *ngIf="user()?.role === 'admin' || user()?.role === 'super_admin'" routerLink="/utilisateurs" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span class="nav-label">{{ user()?.role === 'super_admin' ? 'Administrateurs' : 'Agents' }}</span>
          </a>
          <a *ngIf="user()?.role === 'admin' || user()?.role === 'agent'" routerLink="/procedures" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M9 6h6"></path><path d="M9 10h6"></path></svg>
            <span class="nav-label">Procédures</span>
          </a>
          <a *ngIf="user()?.role === 'admin'" routerLink="/workflows" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span class="nav-label">Workflows</span>
          </a>
          <a *ngIf="user()?.role === 'admin'" routerLink="/roles" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span class="nav-label">Rôles & Privilèges</span>
          </a>
          <!-- Rapports et IA Analyse : comportement différent pour Super Admin -->
          <a *ngIf="user()?.role !== 'citoyen'" routerLink="/stats" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span class="nav-label">Rapports</span>
          </a>
          <a *ngIf="user()?.role === 'admin' || user()?.role === 'super_admin'" routerLink="/ia" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
            <span class="nav-label">Analyse IA</span>
          </a>
          <a *ngIf="user()?.role !== 'citoyen'" routerLink="/ia/assistant" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="nav-label">Assistant IA</span>
          </a>
          <div class="nav-divider"></div>
          <a routerLink="/parametres" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span class="nav-label">Paramètres</span>
          </a>
        </nav>

        <div class="user-profile">
          <div class="avatar">{{ user()?.prenom?.[0] }}{{ user()?.nom?.[0] }}</div>
          <div class="info">
            <span class="name">{{ user()?.nom_complet }}</span>
            <span class="role">{{ user()?.role }}</span>
          </div>
          <button (click)="logout()" class="logout-btn" title="Déconnexion">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </aside>

      <main class="main-content">
        <header class="top-bar">
          <div class="left-actions">
            <button class="toggle-btn" (click)="toggleSidebar()" title="Réduire la barre latérale">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div class="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Rechercher...">
            </div>
          </div>
          <div class="actions">
            <div class="notifications-dropdown">
              <button class="icon-btn" (click)="toggleNotifs()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span class="badge" *ngIf="notifService.nonLues() > 0">{{ notifService.nonLues() }}</span>
              </button>
              
              <div class="dropdown-panel" *ngIf="showNotifs()">
                <div class="dropdown-header">
                  <span>Notifications</span>
                  <button class="btn-text" (click)="toutMarquerLu()">Tout marquer lu</button>
                </div>
                <div class="notifs-list">
                  <div class="notif-item" *ngFor="let n of notifService.notifications()" [class.non-lu]="!n.lu" (click)="lireNotif(n)">
                    <div class="notif-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    </div>
                    <div class="notif-content">
                      <p class="notif-text">{{ n.message }}</p>
                      <span class="notif-time">{{ n.created_at | date:'dd/MM HH:mm' }}</span>
                    </div>
                  </div>
                  <div class="empty-notifs" *ngIf="notifService.notifications().length === 0">
                    Aucune notification
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div class="page-content">
          <ng-content></ng-content>
        </div>
        <app-ai-chat *ngIf="router.url !== '/ia/assistant'"></app-ai-chat>
      </main>
    </div>
  `,
  styles: [`
    .app-container { display: flex; height: 100vh; overflow: hidden; background-color: #f8fafc; color: #1e293b; }
    
    .sidebar {
      width: 260px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      transition: width 0.3s ease;
    }

    .sidebar-collapsed .sidebar {
      width: 80px;
      padding: 1.5rem 0.75rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 2.5rem;
      overflow: hidden;
      white-space: nowrap;
    }

    .sidebar-collapsed .brand { justify-content: center; gap: 0; }
    .sidebar-collapsed .brand-name { display: none; }

    .logo-svg { color: #2563eb; flex-shrink: 0; }

    .nav-menu { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      border-radius: 6px;
      color: #64748b;
      text-decoration: none;
      transition: all 0.15s ease;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
    }

    .sidebar-collapsed .nav-item { justify-content: center; padding: 0.625rem; }
    .sidebar-collapsed .nav-label { display: none; }

    .nav-item:hover { background: #f1f5f9; color: #0f172a; }
    .nav-item.active { background: #f1f5f9; color: #2563eb; font-weight: 600; }
    .nav-item.active svg { stroke-width: 2.5px; }

    .nav-divider { height: 1px; background: #f1f5f9; margin: 0.5rem 0; }

    .user-profile {
      margin-top: auto;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      overflow: hidden;
    }

    .sidebar-collapsed .user-profile { flex-direction: column; gap: 0.5rem; }
    .sidebar-collapsed .user-profile .info { display: none; }

    .avatar {
      width: 36px;
      height: 36px;
      background: #f1f5f9;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #475569;
      font-size: 0.8125rem;
      flex-shrink: 0;
    }

    .info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .name { font-size: 0.8125rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .role { font-size: 0.75rem; color: #94a3b8; text-transform: capitalize; }

    .logout-btn { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.375rem; border-radius: 4px; }
    .logout-btn:hover { color: #ef4444; background: #fef2f2; }

    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .top-bar {
      height: 56px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
    }

    .left-actions { display: flex; align-items: center; gap: 1rem; }
    .toggle-btn { background: none; border: none; color: #64748b; cursor: pointer; padding: 0.5rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
    .toggle-btn:hover { background: #f1f5f9; color: #0f172a; }

    .search-box { display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.375rem 0.75rem; border-radius: 6px; width: 280px; }
    .search-icon { color: #94a3b8; }
    .search-box input { border: none; background: transparent; font-size: 0.8125rem; outline: none; width: 100%; color: #1e293b; }

    .icon-btn { background: none; border: none; color: #64748b; position: relative; cursor: pointer; padding: 0.5rem; border-radius: 6px; }
    .icon-btn:hover { background: #f1f5f9; color: #0f172a; }

    .badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      padding: 1px 4px;
      border-radius: 4px;
      border: 2px solid white;
    }

    .notifications-dropdown { position: relative; }
    .dropdown-panel { position: absolute; top: 100%; right: 0; width: 320px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 50; margin-top: 0.5rem; }
    .dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #f1f5f9; font-weight: 600; font-size: 0.875rem; }
    .btn-text { background: none; border: none; color: #2563eb; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
    .notifs-list { max-height: 400px; overflow-y: auto; }
    .notif-item { display: flex; gap: 1rem; padding: 1rem; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid #f8fafc; }
    .notif-item:hover { background: #f8fafc; }
    .notif-item.non-lu { background: #eff6ff; }
    .notif-icon { width: 32px; height: 32px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; }
    .non-lu .notif-icon { background: #dbeafe; color: #2563eb; }
    .notif-text { font-size: 0.8125rem; margin: 0; color: #334155; line-height: 1.4; }
    .notif-time { font-size: 0.75rem; color: #94a3b8; }
    .empty-notifs { padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.875rem; }

    .page-content { flex: 1; overflow-y: auto; padding: 2rem; }
  `]
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  public router = inject(Router);
  public notifService = inject(NotificationService);

  user = this.authService.user;
  isAdmin = computed(() => ['admin', 'super_admin', 'agent'].includes(this.user()?.role || ''));
  isCollapsed = signal<boolean>(false);
  showNotifs = signal<boolean>(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.notifService.loadNotifications();
    }
  }

  toggleSidebar() {
    this.isCollapsed.update((v: boolean) => !v);
  }

  toggleNotifs() {
    this.showNotifs.update(v => !v);
  }

  toutMarquerLu() {
    this.notifService.toutMarquerCommeLu().subscribe();
  }

  lireNotif(n: any) {
    if (!n.lu) this.notifService.marquerCommeLue(n.id).subscribe();
    if (n.dossier_id) {
      this.router.navigate(['/dossiers', n.dossier_id]);
      this.showNotifs.set(false);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
