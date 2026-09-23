#!/usr/bin/env bash
# scripts/run-test-integration.sh — start Docker Postgres for Vitest (port 5433)

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
source "$DIR/set-test-env.sh"

echo "DATABASE_URL: $DATABASE_URL"
echo "DIRECT_URL: $DIRECT_URL"
echo "POSTGRES_USER: $POSTGRES_USER"

docker compose -f docker-compose.test.yml down -v --remove-orphans
docker compose -f docker-compose.test.yml up -d --wait

echo "PostgreSQL is ready on localhost:5433"

# Apply existing migrations to test database
npx prisma migrate deploy

npx prisma generate
