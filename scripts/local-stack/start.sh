#!/usr/bin/env bash
# Docker-free local Supabase-compatible stack for development and tests.
# Requires: PostgreSQL 15+ server binaries, the Supabase Auth (GoTrue) binary,
# and the PostgREST binary. Paths are configurable via env vars.
#
#   PG_BIN=/usr/lib/postgresql/16/bin AUTH_BIN=/opt/supa/auth/auth \
#   POSTGREST_BIN=/opt/supa/postgrest scripts/local-stack/start.sh
#
# Writes .env.local values for the app (local-only keys) to .local-stack/env.
# The preferred alternative, if you have Docker, is `supabase start`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE="$ROOT/.local-stack"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
AUTH_BIN="${AUTH_BIN:-/opt/supa/auth/auth}"
AUTH_MIGRATIONS="${AUTH_MIGRATIONS:-$(dirname "$AUTH_BIN")/migrations}"
POSTGREST_BIN="${POSTGREST_BIN:-/opt/supa/postgrest}"
PGHOST_DIR="${PGHOST_DIR:-/tmp/lvt-pg}"
PGPORT="${PGPORT:-54322}"
DB="${DB:-lanka_veya}"
APP_URL="${APP_URL:-http://localhost:3000}"
RUN_AS="${RUN_AS:-postgres}"

mkdir -p "$STATE"
JWT_SECRET_FILE="$STATE/jwt_secret"
[ -f "$JWT_SECRET_FILE" ] || head -c 48 /dev/urandom | base64 | tr -d '\n/+=' > "$JWT_SECRET_FILE"
JWT_SECRET="$(cat "$JWT_SECRET_FILE")"

psql_su() { psql -h "$PGHOST_DIR" -p "$PGPORT" -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

# 1. Postgres
if [ ! -d "$PGHOST_DIR/data" ]; then
  mkdir -p "$PGHOST_DIR" && chown "$RUN_AS" "$PGHOST_DIR" 2>/dev/null || true
  su "$RUN_AS" -c "$PG_BIN/initdb -D $PGHOST_DIR/data -A trust -U postgres >/dev/null"
fi
if ! "$PG_BIN/pg_isready" -h "$PGHOST_DIR" -p "$PGPORT" >/dev/null 2>&1; then
  su "$RUN_AS" -c "$PG_BIN/pg_ctl -D $PGHOST_DIR/data -o '-p $PGPORT -k $PGHOST_DIR -c listen_addresses=127.0.0.1' -l $PGHOST_DIR/log start" >/dev/null
  sleep 2
fi

FRESH=0
if ! psql_su -tAc "select 1 from pg_database where datname='$DB'" | grep -q 1; then
  psql_su -c "create database $DB"
  FRESH=1
fi
psql_su -d "$DB" -f "$ROOT/scripts/local-stack/bootstrap.sql"

# 2. Supabase Auth (runs its own migrations into the auth schema)
pkill -f "$AUTH_BIN serve" 2>/dev/null || true
(
  export GOTRUE_DB_DRIVER=postgres
  export DATABASE_URL="postgres://supabase_auth_admin:local-auth-admin@127.0.0.1:$PGPORT/$DB?sslmode=disable&search_path=auth"
  export GOTRUE_JWT_SECRET="$JWT_SECRET"
  export GOTRUE_JWT_EXP=3600
  export GOTRUE_JWT_AUD=authenticated
  export GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated
  export GOTRUE_JWT_ADMIN_ROLES=service_role
  export API_EXTERNAL_URL="http://127.0.0.1:54321/auth/v1"
  export GOTRUE_SITE_URL="$APP_URL"
  export GOTRUE_URI_ALLOW_LIST="$APP_URL/**"
  export GOTRUE_DISABLE_SIGNUP=true
  export GOTRUE_EXTERNAL_EMAIL_ENABLED=true
  export GOTRUE_MAILER_AUTOCONFIRM=true
  export GOTRUE_SMTP_ADMIN_EMAIL=noreply@localhost
  export GOTRUE_DB_MIGRATIONS_PATH="$AUTH_MIGRATIONS"
  export PORT=9999
  export GOTRUE_API_HOST=127.0.0.1
  export GOTRUE_LOG_LEVEL=warn
  "$AUTH_BIN" migrate > "$STATE/auth-migrate.log" 2>&1
  nohup "$AUTH_BIN" serve > "$STATE/auth.log" 2>&1 &
)
for i in $(seq 1 30); do
  psql_su -d "$DB" -tAc "select to_regclass('auth.users') is not null" | grep -q t && break
  sleep 1
done

# 3. App migrations + seed (fresh database only)
if [ "$FRESH" = 1 ]; then
  for f in "$ROOT"/supabase/migrations/*.sql; do
    psql_su -d "$DB" -f "$f"
  done
  psql_su -d "$DB" -f "$ROOT/supabase/seed.sql"
  [ "${SEED_DEV:-1}" = 1 ] && psql_su -d "$DB" -f "$ROOT/supabase/seed-dev.sql"
fi
psql_su -d "$DB" -c "notify pgrst, 'reload schema'" >/dev/null

# 4. PostgREST
pkill -f "$POSTGREST_BIN" 2>/dev/null || true
cat > "$STATE/postgrest.conf" <<CONF
db-uri = "postgres://authenticator:local-authenticator@127.0.0.1:$PGPORT/$DB"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$JWT_SECRET"
server-port = 3001
server-host = "127.0.0.1"
db-channel-enabled = true
CONF
nohup "$POSTGREST_BIN" "$STATE/postgrest.conf" > "$STATE/postgrest.log" 2>&1 &

# 5. Gateway (Supabase URL layout)
pkill -f "scripts/local-stack/gateway.mjs" 2>/dev/null || true
JWT_SECRET="$JWT_SECRET" STORAGE_DIR="$STATE/storage" nohup node "$ROOT/scripts/local-stack/gateway.mjs" > "$STATE/gateway.log" 2>&1 &

# 6. Local-only API keys (HS256 JWTs signed with the local secret)
ANON_KEY="$(JWT_SECRET="$JWT_SECRET" node "$ROOT/scripts/local-stack/make-key.mjs" anon)"
SERVICE_KEY="$(JWT_SECRET="$JWT_SECRET" node "$ROOT/scripts/local-stack/make-key.mjs" service_role)"
cat > "$STATE/env" <<ENV
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
DATABASE_URL_LOCAL=postgres://postgres@127.0.0.1:$PGPORT/$DB
ENV
sleep 2
echo "Local stack running. Keys written to .local-stack/env"
