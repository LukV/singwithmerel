#!/usr/bin/env bash
# npm run dev:phone: the dev server on the local network over HTTPS, so a phone can use the
# microphone (browsers only allow it on a secure page). The certificate is made once, signed by
# itself, and kept in .cert/ (never committed); the phone warns about it once, then lets you through.
set -euo pipefail
mkdir -p .cert
if [[ ! -f .cert/dev.pem ]]; then
  openssl req -x509 -newkey rsa:2048 -nodes -days 825 -subj "/CN=merel-dev" \
    -keyout .cert/dev-key.pem -out .cert/dev.pem >/dev/null 2>&1
fi
MEREL_HTTPS=1 exec npx vite --host "$@"
