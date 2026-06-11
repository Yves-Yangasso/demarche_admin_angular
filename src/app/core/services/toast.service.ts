import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  toasts = this._toasts.asReadonly();
  private counter = 0;

  show(message: string, type: ToastType = 'info', title?: string) {
    const id = this.counter++;
    const toast: Toast = { id, message, type, title };
    
    this._toasts.update(toasts => [...toasts, toast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.remove(id);
    }, 5000);
  }

  success(message: string, title: string = 'Succès') {
    this.show(message, 'success', title);
  }

  error(message: string, title: string = 'Erreur') {
    this.show(message, 'error', title);
  }

  info(message: string, title: string = 'Information') {
    this.show(message, 'info', title);
  }

  warning(message: string, title: string = 'Attention') {
    this.show(message, 'warning', title);
  }

  remove(id: number) {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
