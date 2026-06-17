# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Defauts qui peuvent etre override depuis Dokploy (Environment).
ENV API_UPSTREAM=https://sunudekk-api.djazael.com
ENV API_HOST=sunudekk-api.djazael.com

# nginx:alpine sait deja templatiser tout fichier dans /etc/nginx/templates/
# (script natif /docker-entrypoint.d/20-envsubst-on-templates.sh). Pas besoin
# d'entrypoint custom : on evite le piege CRLF des scripts edites sous Windows.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Angular 17+ split l'output : dist/frontend/browser = SPA client, dist/frontend/server = SSR.
# On ne sert QUE le client. Sans ce sous-chemin, le placeholder est copie et nginx
# sert sa page "Welcome to nginx!" par defaut.
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
