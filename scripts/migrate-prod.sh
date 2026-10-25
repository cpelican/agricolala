#!/usr/bin/env bash
# Runs `prisma migrate deploy` against production (credentials from the macOS
# Keychain, see scripts/with-prod-db.sh).
set -euo pipefail

exec "$(dirname "$0")/with-prod-db.sh" npx prisma migrate deploy
