import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Utilisateur } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private _user = signal<Utilisateur | null>(null);
  user = computed(() => this._user());
  isLoggedIn = computed(() => !!this._user());
  role = computed(() => this._user()?.role);

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadUser();
    }
  }

  private loadUser() {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined') {
      try {
        this._user.set(JSON.parse(savedUser));
      } catch (e) {
        console.error("Erreur lors du parsing de l'utilisateur", e);
        localStorage.removeItem('user');
      }
    }
  }

  envoyerOtp(telephone: string) {
    return this.http.post<{message: string, demo_code?: string}>('/api/auth/otp/envoyer', { telephone });
  }

  verifierOtp(telephone: string, code: string) {
    return this.http.post<{access_token: string, refresh_token: string, utilisateur: Utilisateur, nouveau: boolean}>('/api/auth/otp/verifier', { telephone, code })
      .pipe(tap(res => this.handleAuthSuccess(res)));
  }

  login(email: string, password: string) {
    return this.http.post<{access_token: string, refresh_token: string, utilisateur: Utilisateur, two_factor_required?: boolean, user_id?: number}>('/api/auth/login', { email, password })
      .pipe(tap(res => {
        if (!res.two_factor_required) {
          this.handleAuthSuccess(res);
        }
      }));
  }

  verify2FA(userId: number, code: string) {
    return this.http.post<any>('/api/auth/2fa/verify', { user_id: userId, code })
      .pipe(tap(res => this.handleAuthSuccess(res)));
  }

  forgotPassword(email: string) {
    return this.http.post('/api/auth/password-forgot', { email });
  }

  resetPassword(data: any) {
    return this.http.post('/api/auth/password-reset', data);
  }

  acceptInvitation(data: any) {
    return this.http.post('/api/auth/invitation/accept', data);
  }

  setup2FA() {
    return this.http.post<any>('/api/auth/2fa/setup', {});
  }

  enable2FA(code: string) {
    return this.http.post<any>('/api/auth/2fa/enable', { code });
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this._user.set(null);
  }

  updateUser(utilisateur: Utilisateur) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(utilisateur));
    }
    this._user.set(utilisateur);
  }

  private handleAuthSuccess(res: any) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.utilisateur));
    }
    this._user.set(res.utilisateur);
  }
}
