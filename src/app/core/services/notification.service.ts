import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = '/api/notifications';

  private _notifications = signal<any[]>([]);
  private _nonLues = signal<number>(0);

  notifications = computed(() => this._notifications());
  nonLues = computed(() => this._nonLues());

  loadNotifications() {
    this.http.get<any>(this.apiUrl).subscribe(res => {
      this._notifications.set(res.notifications);
      this._nonLues.set(res.non_lues);
    });
  }

  marquerCommeLue(id: number) {
    return this.http.patch(`${this.apiUrl}/${id}/lire`, {}).pipe(
      tap(() => {
        this._notifications.update(list => list.map(n => n.id === id ? { ...n, lu: true } : n));
        this._nonLues.update(n => Math.max(0, n - 1));
      })
    );
  }

  toutMarquerCommeLu() {
    return this.http.patch(`${this.apiUrl}/tout-lire`, {}).pipe(
      tap(() => {
        this._notifications.update(list => list.map(n => ({ ...n, lu: true })));
        this._nonLues.set(0);
      })
    );
  }
}
