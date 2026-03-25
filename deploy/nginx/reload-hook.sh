#!/usr/bin/env sh
# Certbot deploy hook: reload nginx after renew. Reference in /etc/letsencrypt/cli.ini:
#   deploy-hook = /opt/todoflow/deploy/nginx/reload-hook.sh
# Or: certbot renew --deploy-hook "/path/to/reload-hook.sh"

set -e
if command -v systemctl >/dev/null 2>&1; then
    systemctl reload nginx
elif command -v service >/dev/null 2>&1; then
    service nginx reload
else
    nginx -s reload
fi
