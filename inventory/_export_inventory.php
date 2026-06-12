<?php
/**
 * Dump the current inventory to JSON. Used to produce examples/inventory.json
 * for the public repo and as a personal backup tool.
 *
 * Usage:  php _export_inventory.php <output-path>
 */
declare(strict_types=1);
require_once __DIR__ . '/src/db.php';
require_once __DIR__ . '/src/helpers.php';

$out = $argv[1] ?? null;
if (!$out) {
    fwrite(STDERR, "Usage: php _export_inventory.php <output-path>\n");
    exit(1);
}

$pdo = db();
$items = $pdo->query(
    'SELECT name, category, subcategory, value, qty_total, notes
       FROM items
   ORDER BY category, subcategory, name'
)->fetchAll();

$tagMap = get_item_tag_map($pdo);

$payload = ['count' => count($items), 'items' => []];
foreach ($items as $i => $row) {
    $payload['items'][] = [
        'name'        => $row['name'],
        'category'    => $row['category'],
        'subcategory' => $row['subcategory'],
        'value'       => $row['value'],
        'qty_total'   => (int) $row['qty_total'],
        'notes'       => $row['notes'],
        'tags'        => array_column($tagMap[(int)($pdo->query("SELECT id FROM items WHERE name = " . $pdo->quote($row['name']))->fetchColumn())] ?? [], 'name'),
    ];
}

file_put_contents($out, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
echo "Exported " . count($items) . " items to $out (" . filesize($out) . " bytes)\n";
