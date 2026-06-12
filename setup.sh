#!/usr/bin/env bash
# Edge Devices Inventory - first-time setup script.
#
# Checks prerequisites, ensures src/config.php exists, creates the database
# if it doesn't, runs the schema seed, and optionally loads the 39 example
# projects. Idempotent: safe to re-run.
#
# Usage:
#     bash setup.sh                  # interactive
#     bash setup.sh --yes            # accept all defaults (no prompts)
#     bash setup.sh --empty          # schema only (no inventory items)

set -e

INTERACTIVE=1
SEED_FLAGS=""
LOAD_EXAMPLES=ask

for arg in "$@"; do
    case "$arg" in
        --yes|-y)   INTERACTIVE=0 ;;
        --empty)    SEED_FLAGS="--empty"; LOAD_EXAMPLES=no ;;
        --no-examples) LOAD_EXAMPLES=no ;;
        -h|--help)
            grep -E '^# ' "$0" | sed 's/^# //'
            exit 0
            ;;
        *)
            echo "Unknown option: $arg" >&2
            exit 1
            ;;
    esac
done

cd "$(dirname "$0")"
ROOT=$(pwd)

echo "=== Edge Devices Inventory - setup ==="
echo

# --- prerequisites ---
if ! command -v php >/dev/null 2>&1; then
    echo "ERROR: php not found in PATH. Install PHP 8.2+ first." >&2
    exit 1
fi
PHP_VERSION=$(php -r 'echo PHP_VERSION;')
echo "  PHP $PHP_VERSION"

if ! php -m | grep -qi pdo_mysql; then
    echo "ERROR: pdo_mysql PHP extension missing. Install php-mysql." >&2
    exit 1
fi

# --- config ---
CFG="inventory/src/config.php"
if [ ! -f "$CFG" ]; then
    cp inventory/src/config.example.php "$CFG"
    echo "  Created $CFG from example."
fi

DB_HOST=$(php -r "echo (require '$CFG')['host'];")
DB_PORT=$(php -r "echo (require '$CFG')['port'];")
DB_NAME=$(php -r "echo (require '$CFG')['database'];")
DB_USER=$(php -r "echo (require '$CFG')['user'];")
DB_PASS=$(php -r "echo (require '$CFG')['password'];")

echo "  DB target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# --- create database if absent ---
if command -v mysql >/dev/null 2>&1; then
    PASS_ARG=()
    [ -n "$DB_PASS" ] && PASS_ARG=(-p"$DB_PASS")
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "${PASS_ARG[@]}" \
       -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep -q "$DB_NAME"; then
        echo "  Database $DB_NAME already exists."
    else
        echo "  Creating database $DB_NAME ..."
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "${PASS_ARG[@]}" \
            -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    fi
else
    echo "  WARN: mysql CLI not found. Make sure the database '$DB_NAME' exists already."
fi

# --- seed schema + inventory ---
echo
echo "  Running seed ..."
(cd inventory && php seed.php $SEED_FLAGS)

# --- load example projects ---
if [ "$LOAD_EXAMPLES" = "ask" ] && [ $INTERACTIVE -eq 1 ]; then
    read -rp "  Load 39 example projects from examples/projects.json? [Y/n] " yn
    case "$yn" in [Nn]*) LOAD_EXAMPLES=no ;; *) LOAD_EXAMPLES=yes ;; esac
elif [ "$LOAD_EXAMPLES" = "ask" ]; then
    LOAD_EXAMPLES=yes
fi

if [ "$LOAD_EXAMPLES" = "yes" ]; then
    echo
    echo "  Loading example projects ..."
    (cd inventory && php _insert_generated_projects.php examples/projects.json)
fi

echo
cat <<EOF
=== Setup complete ===

To serve the app, point a web server at:
    $ROOT/inventory/public/

Quick local test (PHP built-in server):
    php -S localhost:8080 -t inventory/public

Then open http://localhost:8080 and run:
    bash tests/smoke.sh http://localhost:8080
EOF
