<?php
declare(strict_types=1);

// Programmatic breadboard layout validator. Mirrors the geometry of
// public/assets/breadboard.js so component-body overlaps and hole conflicts
// match what gets rendered on the page.
//
// Usage:
//   php validate_breadboard.php <project_id>          # validate one project from DB
//   php validate_breadboard.php --all                 # validate every project, summarise
//   php validate_breadboard.php --json < layout.json  # validate a layout from stdin
//   php validate_breadboard.php --format=json <id>    # machine-readable output
//
// Layout JSON is the same shape stored in projects.breadboard_layout:
//   { "components": [...], "external": [...] }

require_once __DIR__ . '/src/db.php';

// ---- Geometry constants - keep in sync with public/assets/breadboard.js ----
const BB_COLS = 30;
const BB_TIE = 20;
const BB_PAD_X = 50;
const BB_PAD_TOP = 16;
const BB_RAIL_GAP = 10;
const BB_RAIL_TO_GRID = 22;
const BB_HALF_GAP = 36;
const BB_ROWS = ['A','B','C','D','E','F','G','H','I','J'];

function bb_colX(int $col): float {
    return BB_PAD_X + ($col - 1) * BB_TIE;
}

function bb_rowY(string $row): ?float {
    if ($row === '+5V_T') return BB_PAD_TOP;
    if ($row === 'GND_T') return BB_PAD_TOP + BB_RAIL_GAP;
    $topGrid = BB_PAD_TOP + BB_RAIL_GAP + BB_RAIL_TO_GRID;
    $idx = array_search($row, BB_ROWS, true);
    if ($idx !== false) {
        return ($idx <= 4)
            ? $topGrid + $idx * BB_TIE
            : $topGrid + 5 * BB_TIE + BB_HALF_GAP + ($idx - 5) * BB_TIE;
    }
    if ($row === 'GND_B') return $topGrid + 5 * BB_TIE + BB_HALF_GAP + 5 * BB_TIE + BB_RAIL_TO_GRID - 14;
    if ($row === '+5V_B') return bb_rowY('GND_B') + BB_RAIL_GAP;
    return null;
}

function bb_parsePos(string $pos): ?array {
    $pos = trim($pos);
    if (preg_match('/^(\+?5V|VCC|GND)(?:_([TB]))?(?:\s*(?:@|at)\s*(\d+))?$/i', $pos, $m)) {
        $name = strtoupper(str_replace('+', '', $m[1]));
        if ($name === 'VCC') $name = '5V';
        $tag = $name === '5V' ? '+5V' : 'GND';
        $side = isset($m[2]) ? strtoupper($m[2]) : 'T';
        $col = isset($m[3]) ? (int) $m[3] : null;
        return ['type' => 'rail', 'rail' => $tag . '_' . $side, 'col' => $col];
    }
    if (preg_match('/^([A-J])(\d{1,2})$/i', $pos, $m)) {
        $row = strtoupper($m[1]);
        $col = (int) $m[2];
        if ($col < 1 || $col > BB_COLS) return null;
        return ['type' => 'hole', 'row' => $row, 'col' => $col];
    }
    return null;
}

function bb_positionXY(?array $p, ?int $hintCol = null): ?array {
    if (!$p) return null;
    if ($p['type'] === 'rail') {
        $col = $p['col'] ?? $hintCol ?? 15;
        return ['x' => bb_colX($col), 'y' => bb_rowY($p['rail']), 'col' => $col];
    }
    return ['x' => bb_colX($p['col']), 'y' => bb_rowY($p['row']), 'col' => $p['col']];
}

// ---- Component body AABB. Returns [x1, y1, x2, y2] or null if not applicable. ----

function bb_componentBox(array $c): ?array {
    $type = $c['type'] ?? '';
    switch ($type) {
        case 'resistor': {
            $a = bb_parsePos((string) ($c['from'] ?? ''));
            $b = bb_parsePos((string) ($c['to']   ?? ''));
            if (!$a || !$b) return null;
            $aXY = bb_positionXY($a, $b['col'] ?? null);
            $bXY = bb_positionXY($b, $a['col'] ?? null);
            if (!$aXY || !$bXY) return null;
            $mx = ($aXY['x'] + $bXY['x']) / 2;
            $my = ($aXY['y'] + $bXY['y']) / 2;
            $angle = atan2($bXY['y'] - $aXY['y'], $bXY['x'] - $aXY['x']);
            // Body 30 wide x 11 tall, rotated to align with the leg axis.
            $corners = [[-15, -5.5], [15, -5.5], [15, 5.5], [-15, 5.5]];
            $xs = []; $ys = [];
            foreach ($corners as [$lx, $ly]) {
                $rx = $lx * cos($angle) - $ly * sin($angle);
                $ry = $lx * sin($angle) + $ly * cos($angle);
                $xs[] = $mx + $rx;
                $ys[] = $my + $ry;
            }
            return [min($xs), min($ys), max($xs), max($ys)];
        }
        case 'capacitor': {
            $a = bb_parsePos((string) ($c['positive'] ?? ''));
            $b = bb_parsePos((string) ($c['negative'] ?? ''));
            if (!$a || !$b) return null;
            $aXY = bb_positionXY($a); $bXY = bb_positionXY($b);
            if (!$aXY || !$bXY) return null;
            $mx = ($aXY['x'] + $bXY['x']) / 2;
            $inTop = $aXY['y'] < bb_rowY('F') && $bXY['y'] < bb_rowY('F');
            $inBot = $aXY['y'] > bb_rowY('E') + BB_TIE && $bXY['y'] > bb_rowY('E') + BB_TIE;
            if ($inBot) {
                $cand = min($aXY['y'], $bXY['y']) - 28;
                $bulbY = ($cand > bb_rowY('E') + BB_TIE / 2) ? $cand : max($aXY['y'], $bXY['y']) + 26;
            } elseif ($inTop) {
                $bulbY = min($aXY['y'], $bXY['y']) - 26;
            } else {
                $bulbY = min($aXY['y'], $bXY['y']) - 28;
            }
            return [$mx - 13, $bulbY - 13, $mx + 13, $bulbY + 13];
        }
        case 'led': {
            $a = bb_parsePos((string) ($c['anode'] ?? ''));
            $b = bb_parsePos((string) ($c['cathode'] ?? ''));
            if (!$a || !$b) return null;
            $aXY = bb_positionXY($a); $bXY = bb_positionXY($b);
            if (!$aXY || !$bXY) return null;
            $mx = ($aXY['x'] + $bXY['x']) / 2;
            $my = min($aXY['y'], $bXY['y']) - 16;
            return [$mx - 10, $my - 6, $mx + 10, $my + 10];
        }
        case 'ic': {
            $p = bb_parsePos((string) ($c['pin1_at'] ?? ''));
            if (!$p || $p['type'] !== 'hole') return null;
            $pins = max(2, (int) ($c['pins'] ?? 8));
            $perSide = (int) ceil($pins / 2);
            $x1 = bb_colX($p['col']) - BB_TIE / 2 + 2;
            $x2 = bb_colX($p['col'] + $perSide - 1) + BB_TIE / 2 - 2;
            $yTop = bb_rowY('E') + BB_TIE / 2 - 4;
            $yBot = bb_rowY('F') - BB_TIE / 2 + 4;
            return [$x1, $yTop, $x2, $yBot];
        }
        case 'transistor': {
            $p = bb_parsePos((string) ($c['at'] ?? ''));
            if (!$p || $p['type'] !== 'hole') return null;
            $cx = bb_colX($p['col']);
            $cy = bb_rowY($p['row']);
            $bw = 2 * BB_TIE + 4;
            return [$cx - $bw / 2, $cy - $bw / 2 + 6, $cx + $bw / 2, $cy + 14];
        }
        case 'button':
        case 'switch': {
            $p = bb_parsePos((string) ($c['at'] ?? ''));
            if (!$p || $p['type'] !== 'hole') return null;
            $rowIdx = array_search($p['row'], BB_ROWS, true);
            if ($rowIdx === false || $rowIdx + 2 >= 10) return null;
            $tlX = bb_colX($p['col']);
            $tlY = bb_rowY($p['row']);
            $blY = bb_rowY(BB_ROWS[$rowIdx + 2]);
            $trX = bb_colX($p['col'] + 2);
            $cx = ($tlX + $trX) / 2;
            $cy = ($tlY + $blY) / 2;
            $sz = 22;
            return [$cx - $sz / 2, $cy - $sz / 2, $cx + $sz / 2, $cy + $sz / 2];
        }
        case 'pot':
        case 'trimmer': {
            $p = bb_parsePos((string) ($c['at'] ?? ''));
            if (!$p || $p['type'] !== 'hole') return null;
            $cx = bb_colX($p['col']);
            $cy = bb_rowY($p['row']);
            return [$cx - BB_TIE - 4, $cy - 14, $cx + BB_TIE + 4, $cy + 12];
        }
        case 'module': {
            $pins = $c['pins'] ?? [];
            if (!is_array($pins) || !$pins) return null;
            $xs = []; $ys = [];
            foreach ($pins as $pp) {
                $hp = bb_parsePos((string) ($pp['at'] ?? ''));
                $xy = bb_positionXY($hp);
                if (!$xy) continue;
                $xs[] = $xy['x'];
                $ys[] = $xy['y'];
            }
            if (!$xs) return null;
            $minX = min($xs); $maxX = max($xs);
            $baseY = $ys[0];
            $above = $baseY < bb_rowY('F');
            $bodyW = ($maxX - $minX) + BB_TIE + 8;
            $bodyH = 30;
            $bodyY = $above ? $baseY - $bodyH - 6 : $baseY + 6;
            return [$minX - 6, $bodyY, $minX - 6 + $bodyW, $bodyY + $bodyH];
        }
        case 'servo': {
            $pins = [];
            foreach (['signal', 'power', 'ground'] as $k) {
                if (!empty($c[$k])) $pins[] = ['at' => $c[$k]];
            }
            return bb_componentBox(['type' => 'module', 'pins' => $pins]);
        }
        case 'wire':
            return null; // Wires don't have a body bounding-box.
    }
    return null;
}

// All grid holes a component plugs into.
function bb_legHoles(array $c): array {
    $type = $c['type'] ?? '';
    $holes = [];
    $add = static function ($pos) use (&$holes) {
        if (!$pos || !is_string($pos)) return;
        $p = bb_parsePos($pos);
        if ($p && $p['type'] === 'hole') $holes[] = $p['row'] . $p['col'];
    };
    switch ($type) {
        case 'resistor':
        case 'wire':
            $add($c['from'] ?? null);
            $add($c['to'] ?? null);
            break;
        case 'capacitor':
            $add($c['positive'] ?? null);
            $add($c['negative'] ?? null);
            break;
        case 'led':
            $add($c['anode'] ?? null);
            $add($c['cathode'] ?? null);
            break;
        case 'ic':
            $p = bb_parsePos((string) ($c['pin1_at'] ?? ''));
            $pins = (int) ($c['pins'] ?? 8);
            if ($p && $p['type'] === 'hole') {
                $perSide = (int) ceil($pins / 2);
                $opp = $p['row'] === 'E' ? 'F' : ($p['row'] === 'F' ? 'E' : null);
                for ($i = 0; $i < $perSide; $i++) {
                    $holes[] = $p['row'] . ($p['col'] + $i);
                    if ($opp) $holes[] = $opp . ($p['col'] + $i);
                }
            }
            break;
        case 'transistor':
        case 'pot':
        case 'trimmer':
            $p = bb_parsePos((string) ($c['at'] ?? ''));
            if ($p && $p['type'] === 'hole') {
                $holes[] = $p['row'] . ($p['col'] - 1);
                $holes[] = $p['row'] . $p['col'];
                $holes[] = $p['row'] . ($p['col'] + 1);
            }
            break;
        case 'button':
        case 'switch':
            $p = bb_parsePos((string) ($c['at'] ?? ''));
            if ($p && $p['type'] === 'hole') {
                $idx = array_search($p['row'], BB_ROWS, true);
                if ($idx !== false && $idx + 2 < 10) {
                    $r2 = BB_ROWS[$idx + 2];
                    $holes[] = $p['row'] . $p['col'];
                    $holes[] = $p['row'] . ($p['col'] + 2);
                    $holes[] = $r2 . $p['col'];
                    $holes[] = $r2 . ($p['col'] + 2);
                }
            }
            break;
        case 'module':
            foreach ($c['pins'] ?? [] as $pp) {
                $add($pp['at'] ?? null);
            }
            break;
        case 'servo':
            foreach (['signal', 'power', 'ground'] as $k) {
                $add($c[$k] ?? null);
            }
            break;
    }
    return $holes;
}

function bb_describe(array $c): string {
    $t = $c['type'] ?? '?';
    $hint = $c['value'] ?? $c['name'] ?? $c['color'] ?? $c['label'] ?? null;
    $pos = $c['at']
        ?? $c['from']
        ?? $c['pin1_at']
        ?? $c['anode']
        ?? $c['positive']
        ?? $c['signal']
        ?? null;
    return $t . ($hint ? " $hint" : '') . ($pos ? " @ $pos" : '');
}

function bb_rectsOverlap(array $a, array $b, float $margin = 0): bool {
    return ($a[0] < $b[2] - $margin) && ($b[0] < $a[2] - $margin)
        && ($a[1] < $b[3] - $margin) && ($b[1] < $a[3] - $margin);
}

function bb_validate(array $layout): array {
    $issues = [];
    $components = $layout['components'] ?? [];

    $boxes = [];
    foreach ($components as $i => $c) {
        $b = bb_componentBox($c);
        if ($b) $boxes[$i] = $b;
    }
    foreach ($boxes as $i => $bi) {
        foreach ($boxes as $j => $bj) {
            if ($j <= $i) continue;
            if (bb_rectsOverlap($bi, $bj, 1.5)) {
                $issues[] = [
                    'kind' => 'body_overlap',
                    'severity' => 'error',
                    'indices' => [$i, $j],
                    'a' => bb_describe($components[$i]),
                    'b' => bb_describe($components[$j]),
                ];
            }
        }
    }

    $holeMap = [];
    foreach ($components as $i => $c) {
        foreach (bb_legHoles($c) as $h) {
            $holeMap[$h][] = $i;
        }
    }
    foreach ($holeMap as $hole => $idxs) {
        if (count($idxs) > 1) {
            $unique = array_values(array_unique($idxs));
            if (count($unique) > 1) {
                $issues[] = [
                    'kind' => 'hole_conflict',
                    'severity' => 'error',
                    'indices' => $unique,
                    'hole' => $hole,
                    'components' => array_map(fn($i) => bb_describe($components[$i]), $unique),
                ];
            }
        }
    }

    foreach ($components as $i => $c) {
        $t = $c['type'] ?? '';
        if (!in_array($t, ['resistor', 'capacitor', 'led', 'wire'], true)) continue;
        $h = bb_legHoles($c);
        if (count($h) !== 2) continue;
        $half = fn(string $hole) => preg_match('/^([A-J])\d+$/', $hole, $m)
            ? (in_array($m[1], ['A','B','C','D','E'], true) ? 'T' : 'B') : null;
        $h1 = $half($h[0]);
        $h2 = $half($h[1]);
        if ($h1 && $h2 && $h1 !== $h2
            && preg_match('/^[A-J](\d+)$/', $h[0], $a)
            && preg_match('/^[A-J](\d+)$/', $h[1], $b)
            && $a[1] === $b[1]
            && $t !== 'wire') {
            $issues[] = [
                'kind' => 'gully_crossing',
                'severity' => 'warning',
                'indices' => [$i],
                'component' => bb_describe($c),
                'hint' => "{$h[0]} and {$h[1]} are in different halves of the same column - separate nodes, no electrical connection",
            ];
        }
    }

    return $issues;
}

// ---- Brute-force fixer ----
//
// Within each column-half (rows A-E top, F-J bottom), all five rows share
// one electrical node, so a leg can move freely between them without
// changing the circuit. Greedy hill-climb: at each step pick the single
// component+leg swap that drops the issue count by the most.

function bb_legFields(string $type): array {
    return match ($type) {
        'resistor', 'wire' => ['from', 'to'],
        'led'              => ['anode', 'cathode'],
        'capacitor'        => ['positive', 'negative'],
        default            => [],
    };
}

function bb_altRows(string $row): array {
    if (in_array($row, ['A','B','C','D','E'], true)) return ['A','B','C','D','E'];
    if (in_array($row, ['F','G','H','I','J'], true)) return ['F','G','H','I','J'];
    return [];
}

// Generate every variant of one component where each subset of its legs is
// moved to a different row in the same column-half. For 2-leg components
// that's at most 5*5 - 1 = 24 variants.
function bb_variants(array $c): array {
    $fields = bb_legFields($c['type'] ?? '');
    if (!$fields) return [];

    $perField = [];
    foreach ($fields as $f) {
        if (!isset($c[$f]) || !is_string($c[$f])) return [];
        $p = bb_parsePos($c[$f]);
        if (!$p || $p['type'] !== 'hole') {
            $perField[$f] = [$c[$f]]; // rail / unparseable - leave as-is
            continue;
        }
        $opts = [];
        foreach (bb_altRows($p['row']) as $r) $opts[] = $r . $p['col'];
        $perField[$f] = $opts;
    }

    $variants = [];
    $combo = function (array $keys, array $acc) use (&$combo, $perField, &$variants, $c) {
        if (!$keys) {
            $v = $c;
            foreach ($acc as $k => $val) $v[$k] = $val;
            $variants[] = $v;
            return;
        }
        $k = array_shift($keys);
        foreach ($perField[$k] as $val) {
            $combo($keys, $acc + [$k => $val]);
        }
    };
    $combo($fields, []);

    return array_values(array_filter($variants, fn($v) => $v !== $c));
}

function bb_layoutKey(array $c): string {
    $fields = bb_legFields($c['type'] ?? '');
    $bits = [$c['type'] ?? ''];
    foreach ($fields as $f) $bits[] = $c[$f] ?? '';
    return implode('|', $bits);
}

function bb_fixLayout(array $layout, int $maxIter = 200): array {
    $current = $layout;
    $issues = bb_validate($current);
    $score = count($issues);
    $start = $score;
    $moves = [];
    $seen = [];

    for ($iter = 0; $iter < $maxIter; $iter++) {
        if (!$score) break;

        // Components involved in current issues are the only ones worth moving.
        $candidates = [];
        foreach ($issues as $iss) {
            foreach ($iss['indices'] ?? [] as $i) $candidates[$i] = true;
        }
        if (!$candidates) break;

        $bestScore = $score;
        $bestIndex = null;
        $bestVariant = null;
        $bestMoveDesc = null;

        foreach (array_keys($candidates) as $i) {
            $orig = $current['components'][$i] ?? null;
            if (!$orig) continue;
            foreach (bb_variants($orig) as $v) {
                $trial = $current;
                $trial['components'][$i] = $v;

                $key = md5(json_encode($trial['components']));
                if (isset($seen[$key])) continue;

                $trialIssues = bb_validate($trial);
                $trialScore = count($trialIssues);

                if ($trialScore < $bestScore) {
                    $bestScore = $trialScore;
                    $bestIndex = $i;
                    $bestVariant = $v;
                    $bestMoveDesc = bb_layoutKey($orig) . '  =>  ' . bb_layoutKey($v);
                }
            }
        }

        if ($bestVariant === null) break; // no improving single-leg swap

        $current['components'][$bestIndex] = $bestVariant;
        $seen[md5(json_encode($current['components']))] = true;
        $issues = bb_validate($current);
        $score = count($issues);
        $moves[] = $bestMoveDesc;
    }

    return [
        'layout'   => $current,
        'issues'   => $issues,
        'before'   => $start,
        'after'    => $score,
        'moves'    => $moves,
        'changed'  => $start !== $score,
    ];
}

function bb_format_issues(int $pid, ?string $name, array $issues): string {
    $head = "#$pid" . ($name ? "  $name" : '');
    if (!$issues) return $head . "  OK";
    $lines = [$head . "  " . count($issues) . " issue(s)"];
    foreach ($issues as $iss) {
        $kind = strtoupper($iss['kind']);
        if ($iss['kind'] === 'body_overlap') {
            $lines[] = "  [$kind]  {$iss['a']}  <->  {$iss['b']}";
        } elseif ($iss['kind'] === 'hole_conflict') {
            $lines[] = "  [$kind]  hole {$iss['hole']}: " . implode(' / ', $iss['components']);
        } elseif ($iss['kind'] === 'gully_crossing') {
            $lines[] = "  [$kind]  {$iss['component']}  ({$iss['hint']})";
        } else {
            $lines[] = "  [$kind]  " . json_encode($iss);
        }
    }
    return implode("\n", $lines);
}

// ---- CLI entry point ----

// Only run the CLI entry point when this file is the script being executed,
// not when required as a library.
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') !== realpath(__FILE__)) {
    return;
}

$argvCopy = $argv;
array_shift($argvCopy);
$format = 'text';
$mode = null;
$pid = null;
$fix = false;
$apply = false;

foreach ($argvCopy as $arg) {
    if ($arg === '--all') $mode = 'all';
    elseif ($arg === '--json') $mode = 'stdin';
    elseif ($arg === '--fix') $fix = true;
    elseif ($arg === '--apply') { $fix = true; $apply = true; }
    elseif (str_starts_with($arg, '--format=')) $format = substr($arg, 9);
    elseif (is_numeric($arg)) { $pid = (int) $arg; $mode = $mode ?? 'one'; }
}

function bb_processOne(int $pid, string $name, array $layout, bool $fix, string $format): array {
    if ($fix) {
        $res = bb_fixLayout($layout);
        if ($format === 'json') {
            return [
                'output' => json_encode([
                    'id' => $pid, 'name' => $name,
                    'before' => $res['before'], 'after' => $res['after'],
                    'moves' => $res['moves'],
                    'remaining_issues' => $res['issues'],
                    'layout' => $res['layout'],
                ], JSON_PRETTY_PRINT) . "\n",
                'fixed_layout' => $res['layout'],
                'issues_after' => $res['after'],
            ];
        }
        $lines = ["#$pid  $name  before={$res['before']}  after={$res['after']}"];
        foreach ($res['moves'] as $m) $lines[] = "  MOVE  $m";
        foreach ($res['issues'] as $iss) {
            if ($iss['kind'] === 'body_overlap') $lines[] = "  REMAINS  body_overlap: {$iss['a']} <-> {$iss['b']}";
            elseif ($iss['kind'] === 'hole_conflict') $lines[] = "  REMAINS  hole_conflict {$iss['hole']}: " . implode(' / ', $iss['components']);
            elseif ($iss['kind'] === 'gully_crossing') $lines[] = "  REMAINS  gully_crossing: {$iss['component']}";
        }
        return ['output' => implode("\n", $lines) . "\n", 'fixed_layout' => $res['layout'], 'issues_after' => $res['after']];
    }
    $issues = bb_validate($layout);
    if ($format === 'json') {
        return ['output' => json_encode(['id' => $pid, 'name' => $name, 'issues' => $issues, 'ok' => empty($issues)], JSON_PRETTY_PRINT) . "\n",
                'issues_after' => count($issues)];
    }
    return ['output' => bb_format_issues($pid, $name, $issues) . "\n", 'issues_after' => count($issues)];
}

if ($mode === 'stdin') {
    $layout = json_decode(stream_get_contents(STDIN), true);
    if (!$layout) { fwrite(STDERR, "stdin: not valid JSON\n"); exit(2); }
    $r = bb_processOne(0, '(stdin)', $layout, $fix, $format);
    echo $r['output'];
    exit($r['issues_after'] ? 1 : 0);
}

if ($mode === 'all') {
    $rows = db()->query(
        'SELECT id, name, breadboard_layout FROM projects
          WHERE breadboard_layout IS NOT NULL AND breadboard_layout != ""
          ORDER BY id'
    )->fetchAll(PDO::FETCH_ASSOC);
    $bad = 0; $total = 0; $fixed = 0; $reduced = 0;
    $upd = db()->prepare('UPDATE projects SET breadboard_layout = ? WHERE id = ?');
    foreach ($rows as $r) {
        $L = json_decode($r['breadboard_layout'], true);
        if (!$L) continue;
        $total++;
        if ($fix) {
            $res = bb_fixLayout($L);
            if ($res['before'] > 0) {
                printf("#%3d  %-50s  %d -> %d  (%d moves)\n",
                    $r['id'], substr($r['name'], 0, 50),
                    $res['before'], $res['after'], count($res['moves']));
            }
            if ($res['before'] > $res['after']) $reduced++;
            if ($res['after'] === 0 && $res['before'] > 0) $fixed++;
            if ($res['after'] > 0) $bad++;
            if ($apply && $res['changed']) {
                $upd->execute([
                    json_encode($res['layout'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                    (int) $r['id'],
                ]);
            }
        } else {
            $issues = bb_validate($L);
            if ($issues) {
                $bad++;
                echo bb_format_issues((int) $r['id'], $r['name'], $issues) . "\n";
            }
        }
    }
    echo "\nSummary: $total projects checked\n";
    if ($fix) {
        echo "  reduced any:       $reduced\n";
        echo "  fully cleaned:     $fixed\n";
        echo "  still have issues: $bad\n";
        echo "  applied to DB:     " . ($apply ? 'yes' : 'no (add --apply to write)') . "\n";
    } else {
        echo "  with issues:       $bad\n";
    }
    exit($bad ? 1 : 0);
}

if ($mode === 'one' && $pid) {
    $stmt = db()->prepare('SELECT id, name, breadboard_layout FROM projects WHERE id = ?');
    $stmt->execute([$pid]);
    $r = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$r) { fwrite(STDERR, "Project $pid not found\n"); exit(2); }
    $L = json_decode($r['breadboard_layout'] ?? 'null', true);
    if (!$L) { echo "#$pid has no breadboard layout\n"; exit(0); }
    $out = bb_processOne((int) $r['id'], $r['name'], $L, $fix, $format);
    echo $out['output'];
    if ($apply && $fix && isset($out['fixed_layout'])) {
        db()->prepare('UPDATE projects SET breadboard_layout = ? WHERE id = ?')
            ->execute([
                json_encode($out['fixed_layout'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                (int) $r['id'],
            ]);
        echo "  applied to DB\n";
    }
    exit($out['issues_after'] ? 1 : 0);
}

echo "Usage:\n";
echo "  php validate_breadboard.php <id>              # validate one project\n";
echo "  php validate_breadboard.php --all             # validate the corpus\n";
echo "  php validate_breadboard.php --json < L.json   # validate stdin JSON\n";
echo "  php validate_breadboard.php --fix <id>        # greedy hill-climb fix\n";
echo "  php validate_breadboard.php --fix --all       # fix everything (dry run)\n";
echo "  php validate_breadboard.php --apply --all     # fix and write back to DB\n";
echo "  php validate_breadboard.php --format=json     # machine-readable\n";
exit(2);
