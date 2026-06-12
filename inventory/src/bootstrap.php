<?php
declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);

session_start();

define('BASE_DIR',   dirname(__DIR__));
define('SRC_DIR',    __DIR__);
define('PUBLIC_DIR', BASE_DIR . DIRECTORY_SEPARATOR . 'public');
define('UPLOAD_DIR', PUBLIC_DIR . DIRECTORY_SEPARATOR . 'uploads');
define('UPLOAD_URL_PREFIX', '/uploads/');

const PROJECT_STATUSES = ['planning', 'active', 'done', 'abandoned'];
const ALLOWED_IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

require_once SRC_DIR . '/db.php';
require_once SRC_DIR . '/helpers.php';
