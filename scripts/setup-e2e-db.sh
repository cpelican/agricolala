#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

export DATABASE_URL="${DATABASE_URL:-postgresql://agraria:agraria@localhost:5434/agraria?schema=public}"
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

docker compose -f docker-compose.e2e.yml up -d

"$DIR/wait-until.sh" "pg_isready -h localhost -p 5434 -U agraria -d agraria" 60

npx prisma migrate deploy
npx prisma generate
