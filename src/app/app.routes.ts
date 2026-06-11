import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) 
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  { 
    path: 'dashboard', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  {
    path: 'dossiers',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dossiers/dossier-list.component').then(m => m.DossierListComponent)
      },
      {
        path: 'verification',
        loadComponent: () => import('./features/dossiers/verification.component').then(m => m.VerificationComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/dossiers/dossier-detail.component').then(m => m.DossierDetailComponent)
      },
      {
        path: ':id/traitement',
        loadComponent: () => import('./features/dossiers/dossier-traitement.component').then(m => m.DossierTraitementComponent)
      }
    ]
  },
  {
    path: 'organisations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/organisations/organisations.component').then(m => m.OrganisationsComponent)
  },
  {
    path: 'utilisateurs',
    canActivate: [authGuard],
    loadComponent: () => import('./features/utilisateurs/utilisateur-list.component').then(m => m.UtilisateurListComponent)
  },
  {
    path: 'procedures',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dossiers/procedures-admin.component').then(m => m.ProceduresAdminComponent)
  },
  {
    path: 'stats',
    canActivate: [authGuard],
    loadComponent: () => import('./features/stats/stats-report.component').then(m => m.StatsReportComponent)
  },
  {
    path: 'ia',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/ia/ia-page.component').then(m => m.IaPageComponent)
      },
      {
        path: 'assistant',
        loadComponent: () => import('./features/ia/ia-chat.component').then(m => m.IaChatPageComponent)
      }
    ]
  },
  {
    path: 'workflows',
    canActivate: [authGuard],
    loadComponent: () => import('./features/workflows/workflow-list.component').then(m => m.WorkflowListComponent)
  },
  {
    path: 'roles',
    canActivate: [authGuard],
    loadComponent: () => import('./features/roles/role-list.component').then(m => m.RoleListComponent)
  },
  {
    path: 'parametres',
    canActivate: [authGuard],
    loadComponent: () => import('./features/utilisateurs/parametres.component').then(m => m.ParametresComponent)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
