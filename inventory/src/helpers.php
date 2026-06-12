<?php
declare(strict_types=1);

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function flash(string $msg): void
{
    $_SESSION['flash'][] = $msg;
}

function get_flashes(): array
{
    $out = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $out;
}

function redirect(string $url): never
{
    header('Location: ' . $url, true, 303);
    exit;
}

function require_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        header('Allow: POST');
        exit('Method not allowed');
    }
}

function input_int(string $name, int $default = 0): int
{
    $v = $_REQUEST[$name] ?? null;
    if ($v === null || $v === '') {
        return $default;
    }
    return (int) $v;
}

function input_str(string $name, string $default = ''): string
{
    return trim((string) ($_REQUEST[$name] ?? $default));
}

function input_text(string $name): ?string
{
    $v = trim((string) ($_REQUEST[$name] ?? ''));
    return $v === '' ? null : $v;
}


// --- tags ---

function tag_slug(string $name): string
{
    $s = strtolower($name);
    $s = preg_replace('/[^a-z0-9]+/i', '-', $s);
    $s = preg_replace('/-+/', '-', $s);
    return trim($s, '-');
}

function derive_initial_tags(?string $category, ?string $subcategory): array
{
    $tags = [];
    if ($category !== null && $category !== '') {
        $tags[] = $category;
    }
    if ($subcategory !== null && $subcategory !== '') {
        $pieces = preg_split('/\s+\/\s+|\s*[,()]\s*/', $subcategory);
        foreach ($pieces as $p) {
            $p = trim($p);
            if ($p !== '') {
                $tags[] = $p;
            }
        }
    }
    return array_values(array_unique($tags));
}

function parse_tag_csv(string $csv): array
{
    $names = array_map('trim', explode(',', $csv));
    $names = array_filter($names, fn($n) => $n !== '');
    $seen = [];
    $out = [];
    foreach ($names as $n) {
        $slug = tag_slug($n);
        if ($slug === '' || isset($seen[$slug])) {
            continue;
        }
        $seen[$slug] = true;
        $out[] = $n;
    }
    return $out;
}

function upsert_tag(PDO $pdo, string $name): int
{
    $slug = tag_slug($name);
    if ($slug === '') {
        throw new InvalidArgumentException('Empty tag slug for "' . $name . '"');
    }
    $pdo->prepare('INSERT IGNORE INTO tags (name, slug) VALUES (?, ?)')
        ->execute([$name, $slug]);
    $stmt = $pdo->prepare('SELECT id FROM tags WHERE slug = ?');
    $stmt->execute([$slug]);
    return (int) $stmt->fetchColumn();
}

function sync_item_tags(PDO $pdo, int $itemId, array $tagNames): void
{
    $pdo->prepare('DELETE FROM item_tags WHERE item_id = ?')->execute([$itemId]);
    $link = $pdo->prepare('INSERT IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)');
    foreach ($tagNames as $name) {
        $tagId = upsert_tag($pdo, $name);
        $link->execute([$itemId, $tagId]);
    }
}

function get_item_tags(PDO $pdo, int $itemId): array
{
    $stmt = $pdo->prepare(
        'SELECT t.id, t.name, t.slug
           FROM tags t
           JOIN item_tags it ON it.tag_id = t.id
          WHERE it.item_id = ?
       ORDER BY t.name'
    );
    $stmt->execute([$itemId]);
    return $stmt->fetchAll();
}

function get_tag_cloud(PDO $pdo): array
{
    return $pdo->query(
        'SELECT t.id, t.name, t.slug, COUNT(it.item_id) AS cnt
           FROM tags t
           LEFT JOIN item_tags it ON it.tag_id = t.id
       GROUP BY t.id
         HAVING cnt > 0
       ORDER BY t.name'
    )->fetchAll();
}

function get_all_tag_names(PDO $pdo): array
{
    return $pdo->query('SELECT name FROM tags ORDER BY name')
               ->fetchAll(PDO::FETCH_COLUMN);
}

function get_item_tag_map(PDO $pdo): array
{
    $rows = $pdo->query(
        'SELECT it.item_id, t.id AS tag_id, t.name, t.slug
           FROM item_tags it
           JOIN tags t ON t.id = it.tag_id
       ORDER BY t.name'
    )->fetchAll();
    $map = [];
    foreach ($rows as $r) {
        $map[(int) $r['item_id']][] = [
            'id' => (int) $r['tag_id'],
            'name' => $r['name'],
            'slug' => $r['slug'],
        ];
    }
    return $map;
}


// --- project tags (reuse the tags table; project_tags join table) ---

function sync_project_tags(PDO $pdo, int $projectId, array $tagNames): void
{
    $pdo->prepare('DELETE FROM project_tags WHERE project_id = ?')->execute([$projectId]);
    $link = $pdo->prepare('INSERT IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)');
    foreach ($tagNames as $name) {
        $tagId = upsert_tag($pdo, $name);
        $link->execute([$projectId, $tagId]);
    }
}

function get_project_tags(PDO $pdo, int $projectId): array
{
    $stmt = $pdo->prepare(
        'SELECT t.id, t.name, t.slug
           FROM tags t
           JOIN project_tags pt ON pt.tag_id = t.id
          WHERE pt.project_id = ?
       ORDER BY t.name'
    );
    $stmt->execute([$projectId]);
    return $stmt->fetchAll();
}

function get_project_tag_cloud(PDO $pdo): array
{
    return $pdo->query(
        'SELECT t.id, t.name, t.slug, COUNT(pt.project_id) AS cnt
           FROM tags t
           LEFT JOIN project_tags pt ON pt.tag_id = t.id
       GROUP BY t.id
         HAVING cnt > 0
       ORDER BY t.name'
    )->fetchAll();
}

function get_project_tag_map(PDO $pdo): array
{
    $rows = $pdo->query(
        'SELECT pt.project_id, t.id AS tag_id, t.name, t.slug
           FROM project_tags pt
           JOIN tags t ON t.id = pt.tag_id
       ORDER BY t.name'
    )->fetchAll();
    $map = [];
    foreach ($rows as $r) {
        $map[(int) $r['project_id']][] = [
            'id'   => (int) $r['tag_id'],
            'name' => $r['name'],
            'slug' => $r['slug'],
        ];
    }
    return $map;
}

// Derive a sensible starter tag list for a project, given the project row plus
// the rows of items it's allocated to. Used at migration time and when a new
// project is created without explicit tags.
function derive_project_tags_from_items(array $project, array $allocatedItems): array
{
    // subcategory  ->  list of tags to emit
    static $SUBCATEGORY_TAGS = [
        'OLED display'                     => ['OLED'],
        'Character LCD + I2C'              => ['LCD'],
        'LED matrix'                       => ['LED Matrix'],
        'Numeric display'                  => ['7-segment'],
        'Servo'                            => ['Servo'],
        'Relay'                            => ['Relay'],
        'Relay, optocoupler-isolated'      => ['Relay'],
        'Distance / ToF'                   => ['Distance', 'ToF'],
        'Distance / ultrasonic'            => ['Distance', 'Ultrasonic'],
        'PIR motion'                       => ['PIR', 'Motion'],
        'Touch'                            => ['Touch'],
        'IMU (gyro + accel)'               => ['IMU'],
        'Audio / microphone'               => ['Sound'],
        'Light (LDR)'                      => ['Light'],
        'Hall (digital)'                   => ['Hall'],
        'Hall (linear)'                    => ['Hall'],
        'IR receiver (~38kHz)'             => ['IR'],
        'IR reflective'                    => ['IR'],
        'Temperature + humidity'           => ['Temperature', 'Humidity'],
        'Pressure / altitude'              => ['Pressure'],
        'Moisture'                         => ['Moisture'],
        'Water level (resistive comb)'     => ['Water'],
        'Water (resistive comb)'           => ['Water'],
        'Vibration / tilt'                 => ['Vibration'],
        'Voltage divider'                  => ['Voltage'],
        'Optical slot (encoder)'           => ['Encoder'],
        'Laser emitter'                    => ['Laser'],
        'Tilt switch'                      => ['Tilt'],
        'Input / joystick'                 => ['Joystick'],
        'Tactile push-button'              => ['Button'],
        'ESP32 dev board'                  => ['ESP32'],
        'AVR dev board'                    => ['Arduino'],
        'Single-board Linux'               => ['Linux', 'SBC'],
        'Power / charger'                  => ['Battery'],
    ];

    $tags = [];

    // NOTE: Deliberately NOT seeding from learning_concepts. Those tend to be
    // long specific phrases like "WiFi web server on ESP32" that pollute the
    // tag cloud with tag-of-one entries. They stay visible as "Teaches" chips
    // on the project page; tags here are categorical (OLED, WiFi, Game, ...).

    foreach ($allocatedItems as $row) {
        $sub = $row['subcategory'] ?? '';
        if (isset($SUBCATEGORY_TAGS[$sub])) {
            foreach ($SUBCATEGORY_TAGS[$sub] as $t) $tags[] = $t;
        }
    }

    $haystack = strtolower(
        ($project['name'] ?? '') . ' ' .
        ($project['description'] ?? '') . ' ' .
        ($project['power_supply'] ?? '')
    );

    if (preg_match('/\bmqtt\b/', $haystack))                          $tags[] = 'MQTT';
    if (preg_match('/\bwifi\b|\bweb page\b|\bweb server\b/', $haystack)) $tags[] = 'WiFi';
    if (preg_match('/\bgame\b|\bsimon\b|\bdice\b/', $haystack))      $tags[] = 'Game';
    if (preg_match('/\balarm\b|\btripwire\b/', $haystack))            $tags[] = 'Alarm';
    if (preg_match('/\bnight light\b|\bnight-light\b/', $haystack))   $tags[] = 'Light';
    if (preg_match('/\bweather\b|\bforecast\b/', $haystack))          $tags[] = 'Weather';
    if (preg_match('/\bplant\b/', $haystack))                         $tags[] = 'Plant';
    if (preg_match('/\bbattery\b|\b18650\b|\baa pack\b/', $haystack)) $tags[] = 'Battery';

    return array_values(array_unique($tags));
}
