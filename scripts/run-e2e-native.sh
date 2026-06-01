#!/usr/bin/env bash
set -euo pipefail

POSTGRES_USER="${E2E_POSTGRES_USER:-$(whoami)}"
POSTGRES_DB="${E2E_POSTGRES_DB:-agraria_e2e}"
DATABASE_URL_VALUE="postgresql://${POSTGRES_USER}@localhost/${POSTGRES_DB}?host=/var/run/postgresql&schema=public"

sudo pg_ctlcluster 16 main start >/dev/null 2>&1 || true
sudo -u postgres createuser --superuser "${POSTGRES_USER}" >/dev/null 2>&1 || true
sudo -u postgres createdb -O "${POSTGRES_USER}" "${POSTGRES_DB}" >/dev/null 2>&1 || true

export DATABASE_URL="${DATABASE_URL:-$DATABASE_URL_VALUE}"
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

npx prisma migrate deploy
npx prisma generate
npm run test:e2e
