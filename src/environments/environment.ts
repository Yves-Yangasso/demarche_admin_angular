// Environment de developpement. En dev, on garde les URLs relatives
// (`/api/...`) et c'est proxy.conf.json qui route vers http://localhost:5001.
// L'interceptor `apiBase` voit apiBaseUrl vide et laisse les URLs telles quelles.
export const environment = {
  production: false,
  apiBaseUrl: '',
};
