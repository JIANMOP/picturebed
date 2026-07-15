#!/bin/sh
set -e

# Generate env.js from mounted .env file (runtime config)
ENV_FILE="${ENV_FILE:-/etc/picturebed/.env}"
if [ -f "$ENV_FILE" ]; then
  echo "// Picturebed runtime config" > /usr/share/nginx/html/env.js
  echo "window.__PICTUREBED_CONFIG__ = {" >> /usr/share/nginx/html/env.js
  grep -v '^#' "$ENV_FILE" | grep '=' | while IFS='=' read -r key value; do
    [ -n "$key" ] && echo "  \"$key\": \"$value\"," >> /usr/share/nginx/html/env.js
  done
  echo "};" >> /usr/share/nginx/html/env.js
  echo "Generated env.js from $ENV_FILE"
else
  echo "window.__PICTUREBED_CONFIG__ = {};" > /usr/share/nginx/html/env.js
  echo "No .env file found at $ENV_FILE, using empty config"
fi

# Start Go proxy in background
/usr/local/bin/proxy &

# Start nginx in foreground
exec nginx -g "daemon off;"
