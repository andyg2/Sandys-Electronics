<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_post();

$item_id    = input_int('item_id');
$project_id = input_int('project_id');
$qty        = input_int('qty');
$notes      = input_text('notes');

if ($item_id <= 0) {
    flash('No item given.');
    redirect('/items.php');
}
$itemBack = '/item.php?id=' . $item_id;

if ($project_id <= 0 || $qty <= 0) {
    flash('Project and a positive quantity are required.');
    redirect($itemBack);
}

$item = db()->prepare('SELECT * FROM items WHERE id = ?');
$item->execute([$item_id]);
$item = $item->fetch();
if (!$item) {
    http_response_code(404);
    exit('Item not found');
}

$existing = db()->prepare("
    SELECT id, qty FROM allocations WHERE item_id = ? AND project_id = ?
");
$existing->execute([$item_id, $project_id]);
$existing = $existing->fetch();
$existing_qty = $existing ? (int) $existing['qty'] : 0;
$new_pair_qty = $existing_qty + $qty;

// Sanity guard only: can't earmark more for a single project than the total
// qty you physically own. Cross-project competition is fine - multiple
// planning projects can earmark the same parts (only active ones consume
// stock for "In use" / "Free" math).
if ($new_pair_qty > (int) $item['qty_total']) {
    flash("That's more than the total on hand (" . (int) $item['qty_total'] . ").");
    redirect($itemBack);
}

// Active-project competition: if THIS allocation pushes total active
// usage over the physical limit, warn but don't block - the user might be
// staging up for a future cutover.
$targetStatus = db()->prepare('SELECT status FROM projects WHERE id = ?');
$targetStatus->execute([$project_id]);
$status = $targetStatus->fetchColumn();
if ($status === 'active') {
    $activeStmt = db()->prepare("
        SELECT COALESCE(SUM(a.qty), 0) AS s
          FROM allocations a
          JOIN projects p ON p.id = a.project_id
         WHERE a.item_id = ? AND a.project_id != ? AND p.status = 'active'
    ");
    $activeStmt->execute([$item_id, $project_id]);
    $otherActive = (int) $activeStmt->fetchColumn();
    if ($otherActive + $new_pair_qty > (int) $item['qty_total']) {
        flash("Heads-up: total in-use across active projects would be "
            . ($otherActive + $new_pair_qty)
            . " but you only have " . (int) $item['qty_total'] . ".");
    }
}

if ($existing) {
    $stmt = db()->prepare("
        UPDATE allocations
           SET qty = ?, notes = COALESCE(?, notes)
         WHERE id = ?
    ");
    $stmt->execute([$new_pair_qty, $notes, (int) $existing['id']]);
} else {
    $stmt = db()->prepare("
        INSERT INTO allocations (item_id, project_id, qty, notes)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$item_id, $project_id, $qty, $notes]);
}

redirect($itemBack);
