import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DossierService {
  private http = inject(HttpClient);
  private apiUrl = '/api/dossiers';

  getDossiers(params: any = {}): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  getDossier(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  creerDossier(dossier: any): Observable<any> {
    return this.http.post(this.apiUrl, dossier);
  }

  changerStatut(id: number, statut: string, commentaire: string = ''): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/statut`, { statut, commentaire });
  }

  uploadDocument(dossierId: number, file: File, nom: string, type: string = 'justificatif', estRequis: boolean = false): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nom', nom);
    formData.append('type_document', type);
    formData.append('est_requis', estRequis ? 'true' : 'false');
    return this.http.post(`/api/documents/dossier/${dossierId}`, formData);
  }

  // ── Catégories de Dossiers ──
  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  creerCategorie(cat: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, cat);
  }

  modifierCategorie(id: number, cat: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, cat);
  }

  // ── Types de Démarches (Procédures) ──
  getDemarches(params: any = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/demarches`, { params });
  }

  getDemarche(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/demarches/${id}`);
  }

  creerDemarche(dem: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/demarches`, dem);
  }

  modifierDemarche(id: number, dem: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/demarches/${id}`, dem);
  }

  supprimerDemarche(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/demarches/${id}`);
  }

  approveDocument(docId: number, commentaire: string): Observable<any> {
    return this.http.post(`/api/documents/${docId}/approve`, { commentaire });
  }

  rejectDocument(docId: number, commentaire: string): Observable<any> {
    return this.http.post(`/api/documents/${docId}/reject`, { commentaire });
  }
}
