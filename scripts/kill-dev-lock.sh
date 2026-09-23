#!/usr/bin/env bash
# Clears a stale `next dev` instance before starting a new one.
# Next keeps a singleton lock at .next/dev/lock (keyed by PID, not port), so a
# leftover process from a previous session blocks new dev servers even on a
# different port. Also frees Next's default port in case something else is
# squatting on it.
set -uo pipefail

LOCK_FILE=".next/dev/lock"
DEFAULT_PORT="${PORT:-3000}"

kill_pid() {
  local pid="$1"
  kill "$pid" 2>/dev/null || return 0
  for _ in 1 2 3 4 5; do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 0.5
  done
  kill -9 "$pid" 2>/dev/null || true
}

if [ -f "$LOCK_FILE" ]; then
  LOCK_PID=$(node -e "try{process.stdout.write(String(JSON.parse(require('fs').readFileSync('$LOCK_FILE')).pid))}catch(e){}")
  if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
    kill_pid "$LOCK_PID"
  fi
  rm -f "$LOCK_FILE"
fi

PORT_PIDS=$(lsof -ti tcp:"$DEFAULT_PORT" -sTCP:LISTEN 2>/dev/null || true)
if [ -n "$PORT_PIDS" ]; then
  while IFS= read -r port_pid; do
    [ -n "$port_pid" ] && kill_pid "$port_pid"
  done <<< "$PORT_PIDS"
fi

exit 0
