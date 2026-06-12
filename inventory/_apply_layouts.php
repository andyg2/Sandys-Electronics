<?php
/**
 * Apply breadboard_layout JSON to projects based on the output of the
 * add_breadboard_layouts workflow.
 *
 * Usage:  php _apply_layouts.php <path-to-results.json>
 *
 * The input JSON is { results: [{id, skip, skip_reason?, layout?}, ...] }.
 * Idempotent: projects with an existing non-empty layout are left alone.
 */
declare(strict_types=1);
require_once __DIR__ . '/src/db.php';

$path = $argv[1] ?? null;
if (!$path || !file_exists($path)) {
    fwrite(STDERR, "Usage: php _apply_layouts.php <path-to-results.json>\n");
    exit(1);
}

$json = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
$results = $json['results'] ?? [];
if (!$results) {
    fwrite(STDERR, "No results in input JSON.\n");
    exit(1);
}

$pdo = db();
$existing = $pdo->prepare('SELECT breadboard_layout FROM projects WHERE id = ?');
$upd      = $pdo->prepare('UPDATE projects SET breadboard_layout = ? WHERE id = ?');

$applied = 0;
$skippedAgent = 0;
$skippedAlready = 0;
$bad = 0;

foreach ($results as $r) {
    $id = (int) ($r['id'] ?? 0);
    if ($id <= 0) { $bad++; continue; }

    $existing->execute([$id]);
    $cur = $existing->fetchColumn();
    if ($cur !== false && $cur !== null && trim((string) $cur) !== '') {
        $skippedAlready++;
        continue;
    }

    if (!empty($r['skip'])) {
        echo "  - skipped #$id: " . ($r['skip_reason'] ?? '(no reason)') . "\n";
        $skippedAgent++;
        continue;
    }

    $layout = $r['layout'] ?? null;
    if (!is_array($layout) || empty($layout['components'])) {
        echo "  ! bad layout for #$id (no components)\n";
        $bad++;
        continue;
    }

    $upd->execute([
        json_encode($layout, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        $id,
    ]);
    $applied++;
}

echo "\n";
echo "Applied:        $applied projects\n";
echo "Skipped (agent):$skippedAgent (no breadboard parts)\n";
echo "Skipped (had):  $skippedAlready (existing layout preserved)\n";
echo "Bad responses:  $bad\n";
