#!/usr/bin/env bash
set -euo pipefail

export E2E_DB_SETUP=native
exec npm run test:e2e
