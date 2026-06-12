<?php
/**
 * Copy this file to src/config.php and edit to suit your environment.
 * src/config.php is gitignored. Env vars (DB_HOST, DB_PORT, DB_DATABASE,
 * DB_USER, DB_PASSWORD) take precedence over the values here when set -
 * convenient for Docker / CI.
 */
return [
    'host'     => getenv('DB_HOST')     ?: 'localhost',
    'port'     => (int) (getenv('DB_PORT') ?: 3306),
    'database' => getenv('DB_DATABASE') ?: 'edgedevices',
    'user'     => getenv('DB_USER')     ?: 'root',
    'password' => getenv('DB_PASSWORD') ?: '',
];
