#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.e2e.yml"

export DATABASE_URL="${DATABASE_URL:-postgresql://agraria:agraria@127.0.0.1:5434/agraria?schema=public}"
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

docker compose -f "$COMPOSE_FILE" up -d

# Host may not have pg_isready; check readiness inside the container.
"$DIR/wait-until.sh" "docker compose -f \"$COMPOSE_FILE\" exec -T postgres-e2e pg_isready -U agraria -d agraria" 60

cd "$ROOT"

if ! npx prisma migrate deploy; then
	echo "E2e migrate failed — resetting disposable e2e volume and retrying once."
	docker compose -f "$COMPOSE_FILE" down -v
	docker compose -f "$COMPOSE_FILE" up -d
	"$DIR/wait-until.sh" "docker compose -f \"$COMPOSE_FILE\" exec -T postgres-e2e pg_isready -U agraria -d agraria" 60
	npx prisma migrate deploy
fi

npx prisma generate
