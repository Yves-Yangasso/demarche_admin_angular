import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
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
}
