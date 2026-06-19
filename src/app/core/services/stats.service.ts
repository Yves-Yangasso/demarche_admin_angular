import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/stats';

  getDashboardStats(filters: any = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`, { params: filters });
  }

  getAgentsStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/agents`);
  }

  getPrevisions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/previsions`);
  }

  getGlobalStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/globales`);
  }

  // Backend attendu : [{ date, taux_rejet, taux_traite }]
  getRejectionTrend(
    filters: any = {},
  ): Observable<{ date: string; taux_rejet: number; taux_traite: number }[]> {
    return this.http.get<{ date: string; taux_rejet: number; taux_traite: number }[]>(
      `${this.apiUrl}/rejection-trend`,
      { params: filters },
    );
  }

  // Backend attendu : [{ agent, dossiers_traites, taux_reussite }]
  getAgentPerformance(
    filters: any = {},
  ): Observable<{ agent: string; dossiers_traites: number; taux_reussite: number }[]> {
    return this.http.get<{ agent: string; dossiers_traites: number; taux_reussite: number }[]>(
      `${this.apiUrl}/agent-performance`,
      { params: filters },
    );
  }
}
