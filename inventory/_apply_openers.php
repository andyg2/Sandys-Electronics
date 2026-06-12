<?php
/**
 * Prepend the kid-friendly "What it is" / "Why it's fun" opener to each
 * project's description. Reads the openers JSON produced by the
 * add_openers workflow.
 *
 * Usage:  php _apply_openers.php <path-to-openers.json>
 *
 * Idempotent: if a description already starts with "**What it is**" the
 * project is skipped.
 */
declare(strict_types=1);
require_once __DIR__ . '/src/db.php';

$path = $argv[1] ?? null;
if (!$path || !file_exists($path)) {
    fwrite(STDERR, "Usage: php _apply_openers.php <path-to-openers.json>\n");
    exit(1);
}

$json = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
$results = $json['results'] ?? [];
if (!$results) {
    fwrite(STDERR, "No openers in input JSON.\n");
    exit(1);
}

$pdo = db();
$get = $pdo->prepare('SELECT description FROM projects WHERE id = ?');
$upd = $pdo->prepare('UPDATE projects SET description = ? WHERE id = ?');

$applied = 0;
$skipped = 0;
foreach ($results as $r) {
    $id  = (int) ($r['id'] ?? 0);
    if ($id <= 0) continue;

    $get->execute([$id]);
    $current = $get->fetchColumn();
    if ($current === false) {
        echo "  ! project #$id not found, skipping\n";
        continue;
    }
    if (str_starts_with(ltrim($current), '**What it is**')) {
        $skipped++;
        continue;
    }

    $what = trim($r['what_it_is']  ?? '');
    $why  = trim($r['why_its_fun'] ?? '');
    if ($what === '' || $why === '') {
        echo "  ! project #$id missing opener content, skipping\n";
        continue;
    }

    $opener = "**What it is**: $what\n\n**Why it's fun**: $why\n\n";
    $upd->execute([$opener . $current, $id]);
    $applied++;
}

echo "Applied opener to $applied projects, skipped $skipped already-prepended.\n";
