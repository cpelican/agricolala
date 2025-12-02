#!/usr/bin/env bash
# scripts/run-integration.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/set-test-env.sh

echo "DATABASE_URL: $DATABASE_URL"
echo "DIRECT_URL: $DIRECT_URL"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"

docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d

# Wait for database to be ready before running Prisma commands
echo "Waiting for PostgreSQL to be ready..."
$DIR/wait-until.sh "pg_isready -h localhost -p 5433 -U agraria -d agraria" 60

# Apply existing migrations to test database
npx prisma migrate deploy

npx prisma generate
