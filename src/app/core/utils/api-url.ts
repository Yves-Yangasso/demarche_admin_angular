import { environment } from '../../../environments/environment';

/// Prefixe environment.apiBaseUrl devant une URL relative `/api/...` ou
/// `/uploads/...` pour que les balises DOM (<img>, <iframe>, <a href>, etc.)
/// pointent sur le backend en prod plutot que sur l'origine du frontend.
///
/// A utiliser pour tout binding [src] / [href] (l'apiBaseInterceptor ne couvre
/// que les requetes HttpClient, pas les ressources statiques du DOM).
const API_PREFIXES = ['/api', '/uploads'];

export function toApiUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (!environment.apiBaseUrl) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  if (!API_PREFIXES.some((p) => url.startsWith(p))) return url;
  return `${environment.apiBaseUrl}${url}`;
}
