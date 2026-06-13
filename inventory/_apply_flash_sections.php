<?php
/**
 * Apply "## Flash it and run it" sections produced by the
 * add_flash_instructions workflow.
 *
 * Usage:  php _apply_flash_sections.php <path-to-results.json>
 *
 * Each new section is inserted into the project description right after the
 * ## Wiring notes block (i.e. immediately before whatever ## heading follows
 * Wiring notes - typically Talking points). Idempotent: if a description
 * already contains "## Flash it and run it", that project is skipped.
 */
declare(strict_types=1);
require_once __DIR__ . '/src/db.php';

$path = $argv[1] ?? null;
if (!$path || !file_exists($path)) {
    fwrite(STDERR, "Usage: php _apply_flash_sections.php <path-to-results.json>\n");
    exit(1);
}

$json = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
$results = $json['results'] ?? [];
if (!$results) {
    fwrite(STDERR, "No results in input JSON.\n");
    exit(1);
}

$pdo = db();
$get = $pdo->prepare('SELECT description FROM projects WHERE id = ?');
$upd = $pdo->prepare('UPDATE projects SET description = ? WHERE id = ?');

$applied = 0; $skipped = 0; $bad = 0;
foreach ($results as $r) {
    $id      = (int) ($r['id'] ?? 0);
    $section = trim((string) ($r['section'] ?? ''));
    if ($id <= 0 || $section === '') { $bad++; continue; }

    if (!str_starts_with($section, '## Flash it and run it')) {
        $section = "## Flash it and run it\n\n" . $section;
    }

    $get->execute([$id]);
    $desc = $get->fetchColumn();
    if ($desc === false) { echo "  ! project #$id not found\n"; $bad++; continue; }
    if (str_contains($desc, '## Flash it and run it')) { $skipped++; continue; }

    // Insert immediately before the ## heading that follows "## Wiring notes".
    // If "## Wiring notes" isn't present, append at the end.
    if (!preg_match('/(\n## Wiring notes\b)(.*?)(\n## )/s', $desc, $m, PREG_OFFSET_CAPTURE)) {
        $desc = rtrim($desc) . "\n\n" . $section . "\n";
    } else {
        $insertAt = $m[3][1];  // offset of the next "## " heading after Wiring notes
        $desc = substr($desc, 0, $insertAt) . "\n\n" . $section . substr($desc, $insertAt);
    }

    $upd->execute([$desc, $id]);
    $applied++;
}

echo "\n";
echo "Applied:  $applied projects\n";
echo "Skipped:  $skipped (already had a Flash section)\n";
echo "Bad:      $bad\n";
