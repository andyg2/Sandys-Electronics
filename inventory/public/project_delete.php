<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_post();

$id = input_int('id');
if ($id <= 0) {
    flash('No project id given.');
    redirect('/projects.php');
}

$stmt = db()->prepare('DELETE FROM projects WHERE id = ?');
$stmt->execute([$id]);

flash('Project deleted, allocations released.');
redirect('/projects.php');
