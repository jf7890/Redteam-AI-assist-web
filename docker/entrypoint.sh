#!/bin/sh
set -eu

# Render /env.js at container start from /env.template.js
if [ -f /usr/share/nginx/html/env.template.js ]; then
  envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js
fi

exec "$@"
