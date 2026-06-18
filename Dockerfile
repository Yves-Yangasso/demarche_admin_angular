# --- Build SPA Angular ---
FROM node:22-alpine AS build
WORKDIR /app

# Variables d'environnement consommees au BUILD via scripts/generate-env.mjs.
# Override depuis Dokploy (compose build.args) ou en local
# (docker build --build-arg API_BASE_URL=https://staging-api.exemple.com).
ARG API_BASE_URL=https://sunudekk-api.djazael.com
ENV API_BASE_URL=${API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN node scripts/generate-env.mjs && npm run build -- --configuration=production

# --- Serve static via nginx ---
FROM nginx:alpine

# Config nginx statique : pas de template, pas d'envsubst, pas d'entrypoint custom.
# L'app appelle directement environment.prod.ts::apiBaseUrl en cross-origin (CORS backend).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular `application` builder sans outputMode genere directement dans
# outputPath (pas de sous-dossier browser/).
COPY --from=build /app/dist/frontend /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
