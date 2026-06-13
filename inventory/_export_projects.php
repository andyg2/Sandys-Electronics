<?php
/**
 * Dump current projects + allocations + tags + breadboard layouts to JSON for
 * examples/projects.json. Round-trips with _insert_generated_projects.php.
 *
 * Usage:  php _export_projects.php <output-path>
 */
declare(strict_types=1);
require_once __DIR__ . '/src/db.php';
require_once __DIR__ . '/src/helpers.php';

$out = $argv[1] ?? null;
if (!$out) {
    fwrite(STDERR, "Usage: php _export_projects.php <output-path>\n");
    exit(1);
}

$pdo = db();
$projects = $pdo->query(
    'SELECT id, name, description, wiring_diagram, breadboard_layout, code, code_language,
            power_supply, difficulty, learning_concepts, status
       FROM projects
   ORDER BY id'
)->fetchAll();

$allocStmt = $pdo->prepare(
    'SELECT i.name AS item_name, a.qty, a.notes
       FROM allocations a JOIN items i ON i.id = a.item_id
      WHERE a.project_id = ?
   ORDER BY i.category, i.name'
);

$result = ['count' => count($projects), 'projects' => []];
foreach ($projects as $p) {
    $allocStmt->execute([(int) $p['id']]);
    $concepts = null;
    if (!empty($p['learning_concepts'])) {
        $d = json_decode((string) $p['learning_concepts'], true);
        if (is_array($d)) $concepts = array_values(array_filter($d, 'is_string'));
    }
    $result['projects'][] = [
        'name'              => $p['name'],
        'power_supply'      => $p['power_supply'],
        'description'       => $p['description'],
        'wiring_diagram'    => $p['wiring_diagram'],
        'breadboard_layout' => $p['breadboard_layout'],
        'code'              => $p['code'],
        'code_language'     => $p['code_language'] ?: 'cpp',
        'difficulty'        => $p['difficulty'],
        'learning_concepts' => $concepts,
        'tags'              => array_column(get_project_tags($pdo, (int) $p['id']), 'name'),
        'status'            => $p['status'],
        'allocations'       => array_map(fn($a) => [
            'item_name' => $a['item_name'],
            'qty'       => (int) $a['qty'],
            'notes'     => $a['notes'],
        ], $allocStmt->fetchAll()),
    ];
}

file_put_contents($out, json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
echo "Exported " . count($projects) . " projects to $out (" . filesize($out) . " bytes)\n";
