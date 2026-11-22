#!/usr/bin/env bash
# Teste les migrations et les règles de sécurité sur un PostgreSQL local (16+).
# Usage : PGHOST=... PGPORT=... PGUSER=postgres supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")"
psql -q -c "drop database if exists tremplin_test" -c "create database tremplin_test"
psql -q -d tremplin_test -f 00-stub-supabase.sql 2>&1 | grep -v "already exists" || true
for m in ../migrations/*.sql; do
  psql -q -d tremplin_test -v ON_ERROR_STOP=1 -f "$m"
done
for t in rls.sql acces.sql; do
  psql -q -d tremplin_test -v ON_ERROR_STOP=1 -f "$t" 2>&1 | grep -E "✓|✗|ERROR|tests sont passés" | sed 's/^.*NOTICE:  //'
done
