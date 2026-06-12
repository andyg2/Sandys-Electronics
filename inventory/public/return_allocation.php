<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_post();

$alloc_id = input_int('alloc_id');
$qty      = input_int('qty');

if ($alloc_id <= 0) {
    flash('No allocation id given.');
    redirect('/items.php');
}

$row = db()->prepare('SELECT * FROM allocations WHERE id = ?');
$row->execute([$alloc_id]);
$row = $row->fetch();
if (!$row) {
    http_response_code(404);
    exit('Allocation not found');
}
$item_id = (int) $row['item_id'];

if ($qty <= 0 || $qty >= (int) $row['qty']) {
    db()->prepare('DELETE FROM allocations WHERE id = ?')->execute([$alloc_id]);
} else {
    db()->prepare('UPDATE allocations SET qty = qty - ? WHERE id = ?')
        ->execute([$qty, $alloc_id]);
}

$back = $_SERVER['HTTP_REFERER'] ?? ('/item.php?id=' . $item_id);
redirect($back);
