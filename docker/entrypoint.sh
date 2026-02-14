#!/bin/sh
set -eu

# Render /env.js from env.template.js (runtime config)
if [ -f /usr/share/nginx/html/env.template.js ]; then
  envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js
fi

exec "$@"
