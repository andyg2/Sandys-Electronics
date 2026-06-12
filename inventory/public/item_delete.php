<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_post();

$id = input_int('id');
if ($id <= 0) {
    flash('No item id given.');
    redirect('/items.php');
}

$stmt = db()->prepare('DELETE FROM items WHERE id = ?');
$stmt->execute([$id]);

flash('Item deleted.');
redirect('/items.php');
