#!/usr/bin/env bash
# scripts/set-test-env.sh — load Vitest env for shell scripts (migrate deploy, etc.)

set -a

if [[ -f .env.test ]]; then
	# shellcheck disable=SC1091
	source .env.test
else
	echo "Note: .env.test not found — using defaults (port 5433). Run: cp .env.test.example .env.test"
fi

# Defaults match docker-compose.test.yml and test/load-test-env.ts
export DATABASE_URL="${DATABASE_URL:-postgresql://agraria:agraria@localhost:5433/agraria?schema=public}"
export DIRECT_URL="${DIRECT_URL:-postgresql://agraria:agraria@localhost:5433/agraria?schema=public}"
export POSTGRES_USER="${POSTGRES_USER:-agraria}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-agraria}"

set +a
