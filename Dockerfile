# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine

RUN apk add --no-cache gettext

ENV API_UPSTREAM=https://sunudekk-api.djazael.com
ENV API_HOST=sunudekk-api.djazael.com

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=build /app/dist/frontend /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
