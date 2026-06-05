#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"

POSTGRES_USER="${E2E_POSTGRES_USER:-$(whoami)}"
POSTGRES_DB="${E2E_POSTGRES_DB:-agraria_e2e}"
DATABASE_URL="${DATABASE_URL:-postgresql://${POSTGRES_USER}@localhost/${POSTGRES_DB}?host=/var/run/postgresql&schema=public}"

export DATABASE_URL
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

sudo pg_ctlcluster 16 main start >/dev/null 2>&1 || true
sudo -u postgres createuser --superuser "${POSTGRES_USER}" >/dev/null 2>&1 || true
sudo -u postgres createdb -O "${POSTGRES_USER}" "${POSTGRES_DB}" >/dev/null 2>&1 || true

cd "$ROOT"
npx prisma migrate deploy
npx prisma generate
