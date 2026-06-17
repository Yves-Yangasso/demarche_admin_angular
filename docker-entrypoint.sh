#!/bin/sh
set -eu

API_UPSTREAM="${API_UPSTREAM:-https://sunudekk-api.djazael.com}"
API_HOST="${API_HOST:-sunudekk-api.djazael.com}"

export API_UPSTREAM API_HOST
envsubst '${API_UPSTREAM} ${API_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
