import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/// Prefixe environment.apiBaseUrl devant les URLs relatives commencant par
/// `/api`, `/uploads` ou `/socket.io`. Garde inchangees les URLs absolues
/// (http(s)://...) et les autres chemins (assets etc.).
///
/// En dev, apiBaseUrl est vide -> proxy.conf.json fait le job.
/// En prod, apiBaseUrl pointe sur le backend -> appels directs avec CORS.
const API_PREFIXES = ['/api', '/uploads', '/socket.io'];

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.apiBaseUrl) return next(req);
  const isAbsolute = /^https?:\/\//i.test(req.url);
  if (isAbsolute) return next(req);
  if (!API_PREFIXES.some((p) => req.url.startsWith(p))) return next(req);
  return next(req.clone({ url: `${environment.apiBaseUrl}${req.url}` }));
};
