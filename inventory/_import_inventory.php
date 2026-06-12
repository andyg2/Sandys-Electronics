<?php
/**
 * Load inventory items from a JSON file into the live database. Designed to
 * round-trip with _export_inventory.php and let users start from the example
 * inventory or seed their own kit without editing PHP.
 *
 * Usage:  php _import_inventory.php <path-to-json>
 *
 * Behavior:
 * - Skips items whose name already exists (idempotent).
 * - Derives initial tags from each new item's category + subcategory and links
 *   them through item_tags. Any explicit tags array on the JSON row is also
 *   linked (so a hand-curated kit can carry its own tag taxonomy).
 */
declare(strict_types=1);
require_once __DIR__ . '/src/db.php';
require_once __DIR__ . '/src/helpers.php';

$path = $argv[1] ?? null;
if (!$path || !file_exists($path)) {
    fwrite(STDERR, "Usage: php _import_inventory.php <path-to-json>\n");
    exit(1);
}

$json = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
$rows = $json['items'] ?? (is_array($json) ? $json : []);
if (!$rows) {
    fwrite(STDERR, "No items in input JSON.\n");
    exit(1);
}

$pdo = db();
$check  = $pdo->prepare('SELECT id FROM items WHERE name = ?');
$insert = $pdo->prepare(
    'INSERT INTO items (name, category, subcategory, value, qty_total, notes)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$link   = $pdo->prepare('INSERT IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)');

$added = 0;
$skipped = 0;
foreach ($rows as $row) {
    $name = (string) ($row['name'] ?? '');
    if ($name === '') continue;

    $check->execute([$name]);
    if ($check->fetchColumn()) {
        $skipped++;
        continue;
    }

    $insert->execute([
        $name,
        $row['category']    ?? null,
        $row['subcategory'] ?? null,
        $row['value']       ?? null,
        (int) ($row['qty_total'] ?? 0),
        $row['notes']       ?? null,
    ]);
    $itemId = (int) $pdo->lastInsertId();
    $added++;

    $tagNames = derive_initial_tags($row['category'] ?? null, $row['subcategory'] ?? null);
    if (!empty($row['tags']) && is_array($row['tags'])) {
        foreach ($row['tags'] as $t) {
            if (is_string($t) && trim($t) !== '') $tagNames[] = trim($t);
        }
    }
    foreach (array_unique($tagNames) as $tn) {
        $tagId = upsert_tag($pdo, $tn);
        $link->execute([$itemId, $tagId]);
    }
}

echo "Imported $added items, skipped $skipped already-present.\n";
