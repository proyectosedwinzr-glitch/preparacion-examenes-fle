#!/usr/bin/env bash
# Teste la migration et les règles de sécurité sur un PostgreSQL local (16+).
# Usage : PGHOST=... PGPORT=... PGUSER=postgres supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")"
psql -q -c "drop database if exists tremplin_test" -c "create database tremplin_test"
psql -q -d tremplin_test -f 00-stub-supabase.sql 2>&1 | grep -v "already exists" || true
psql -q -d tremplin_test -v ON_ERROR_STOP=1 -f ../migrations/001_init.sql
psql -q -d tremplin_test -v ON_ERROR_STOP=1 -f rls.sql 2>&1 | grep -E "✓|✗|ERROR|Tous" | sed 's/^.*NOTICE:  //'
