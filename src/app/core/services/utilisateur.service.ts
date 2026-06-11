import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Utilisateur } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private http = inject(HttpClient);

  getUtilisateurs(params: any = {}) {
    return this.http.get<Utilisateur[]>('/api/utilisateurs', { params });
  }

  getUtilisateur(id: number) {
    return this.http.get<Utilisateur>(`/api/utilisateurs/${id}`);
  }

  updateUtilisateur(id: number, data: Partial<Utilisateur>) {
    return this.http.patch<Utilisateur>(`/api/utilisateurs/${id}`, data);
  }

  creerUtilisateur(data: any) {
    return this.http.post<Utilisateur>('/api/utilisateurs', data);
  }
}
