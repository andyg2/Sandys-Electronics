#!/usr/bin/env bash
# Entry point for the app container.
#
# 1. Wait for the DB to accept connections.
# 2. If the schema isn't there yet, run seed.php + load example projects.
# 3. Hand off to apache.
#
# Re-running the container with a populated DB is a no-op (idempotent).

set -e

cd /var/www/html

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-}"
DB_NAME="${DB_DATABASE:-edgedevices}"

echo "init: waiting for $DB_HOST:$DB_PORT ..."
for i in $(seq 1 60); do
    if php -r "
        try {
            new PDO('mysql:host=$DB_HOST;port=$DB_PORT', '$DB_USER', '$DB_PASS');
            exit(0);
        } catch (Throwable \$e) { exit(1); }
    " 2>/dev/null; then
        echo "init: DB reachable"
        break
    fi
    sleep 1
done

# Decide whether to seed. If items table has rows, skip everything.
NEED_SEED=$(php -r "
    try {
        \$pdo = new PDO('mysql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME', '$DB_USER', '$DB_PASS');
        \$c = \$pdo->query('SELECT COUNT(*) FROM items')->fetchColumn();
        echo (\$c > 0 ? '0' : '1');
    } catch (Throwable \$e) { echo '1'; }
")

if [ "$NEED_SEED" = "1" ]; then
    echo "init: seeding inventory ..."
    php seed.php

    if [ -f examples/projects.json ]; then
        echo "init: loading example projects ..."
        php _insert_generated_projects.php examples/projects.json
    fi
else
    echo "init: items table already populated, skipping seed."
fi

# Ensure uploads dir is writable (mounted as a volume in production).
mkdir -p public/uploads
chown -R www-data:www-data public/uploads || true

echo "init: starting apache"
exec apache2-foreground
