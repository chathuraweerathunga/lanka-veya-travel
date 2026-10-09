#!/usr/bin/env bash
# Runs the database RLS/workflow tests against a LOCAL database (never production).
# Usage: DATABASE_URL_LOCAL=postgres://postgres@127.0.0.1:54322/postgres npm run test:db
set -euo pipefail
URL="${DATABASE_URL_LOCAL:-}"
if [ -z "$URL" ] && [ -f .local-stack/env ]; then URL="$(grep ^DATABASE_URL_LOCAL= .local-stack/env | cut -d= -f2-)"; fi
if [ -z "$URL" ]; then echo "Set DATABASE_URL_LOCAL to a local database URL"; exit 1; fi
case "$URL" in *supabase.co*|*pooler.supabase.com*) echo "Refusing to run tests against a hosted Supabase database."; exit 1;; esac
psql "$URL" -v ON_ERROR_STOP=1 -q -f supabase/tests/rls_and_workflow.sql 2>&1 | grep -E "PASS|FAIL|ERROR|PASSED" | sed 's/^psql:[^ ]* //; s/^NOTICE:  //'
