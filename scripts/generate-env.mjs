// Genere src/environments/environment.prod.ts a partir des variables d'env
// lues au BUILD (donc avant `ng build --configuration=production`).
// Defaults raisonnables si les vars ne sont pas definies.
//
// Lance par le Dockerfile juste avant npm run build, mais aussi utilisable
// en local : `node scripts/generate-env.mjs`.

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Traite une chaine vide comme "non defini" (cas courant quand compose
// transmet `${API_BASE_URL:-}` et que la var n'a pas ete fournie a Dokploy).
const apiBaseUrl = process.env.API_BASE_URL || 'https://sunudekk-api.djazael.com';

const content = `// FICHIER GENERE - ne pas editer a la main.
// Source : scripts/generate-env.mjs (lit API_BASE_URL au build).
export const environment = {
  production: true,
  apiBaseUrl: '${apiBaseUrl}',
};
`;

const out = resolve(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
writeFileSync(out, content, 'utf8');
console.log(`[generate-env] environment.prod.ts -> apiBaseUrl=${apiBaseUrl}`);
