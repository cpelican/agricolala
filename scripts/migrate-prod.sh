#!/usr/bin/env bash
# Runs `prisma migrate deploy` against production without keeping the
# production DATABASE_URL/DIRECT_URL in .env. The secrets live in the macOS
# Keychain and are only exported into this process's environment.
#
# prisma/schema.prisma sets both `url` (DATABASE_URL) and `directUrl`
# (DIRECT_URL) — `migrate deploy` connects via directUrl, so both must be
# exported or it silently falls back to whatever DIRECT_URL is in .env.
set -euo pipefail

DB_URL_SERVICE="agricolala-prod-db-url"
DIRECT_URL_SERVICE="agricolala-prod-direct-url"

if ! DATABASE_URL=$(security find-generic-password -a "$USER" -s "$DB_URL_SERVICE" -w 2>/dev/null); then
  echo "No Keychain entry found for service '$DB_URL_SERVICE'." >&2
  echo "Add one with:" >&2
  echo "  security add-generic-password -a \"\$USER\" -s $DB_URL_SERVICE -w 'postgresql://...'" >&2
  exit 1
fi

if ! DIRECT_URL=$(security find-generic-password -a "$USER" -s "$DIRECT_URL_SERVICE" -w 2>/dev/null); then
  # No separate direct-connection URL stored; reuse DATABASE_URL (fine if
  # you don't route through a connection pooler).
  DIRECT_URL="$DATABASE_URL"
fi

export DATABASE_URL DIRECT_URL

HOST=$(node -e "console.log(new URL(process.env.DIRECT_URL).hostname)")
if [[ "$HOST" == "localhost" || "$HOST" == "127.0.0.1" ]]; then
  echo "Refusing to run: resolved DIRECT_URL host is '$HOST' (looks like a local DB, not production)." >&2
  exit 1
fi
echo "Migrating production database at host: $HOST"
npx prisma migrate deploy
