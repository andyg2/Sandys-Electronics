<?php
require_once __DIR__ . '/../src/bootstrap.php';

$id = input_int('id');
if ($id <= 0) {
    http_response_code(404);
    exit('Item not found');
}

$item = db()->prepare('SELECT * FROM items WHERE id = ?');
$item->execute([$id]);
$item = $item->fetch();
if (!$item) {
    http_response_code(404);
    exit('Item not found');
}

$allocStmt = db()->prepare("
    SELECT a.id, a.qty, a.notes, a.created_at,
           p.id AS project_id, p.name AS project_name, p.status AS project_status
      FROM allocations a
      JOIN projects p ON p.id = a.project_id
     WHERE a.item_id = ?
  ORDER BY p.name
");
$allocStmt->execute([$id]);
$allocations = $allocStmt->fetchAll();

$projects = db()->query("
    SELECT id, name FROM projects
     WHERE status NOT IN ('done', 'abandoned')
  ORDER BY name
")->fetchAll();

$tags = get_item_tags(db(), $id);

$qty_allocated = 0;
$qty_in_use    = 0;
foreach ($allocations as $a) {
    $qty_allocated += (int) $a['qty'];
    if ($a['project_status'] === 'active') {
        $qty_in_use += (int) $a['qty'];
    }
}
$qty_free = (int) $item['qty_total'] - $qty_in_use;

$page_title = $item['name'];
include SRC_DIR . '/header.php';
?>

<div class="flex items-start justify-between gap-4 mb-6 flex-wrap">
  <div>
    <a href="/items.php" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 no-underline">&larr; All items</a>
    <h1 class="text-2xl font-bold mt-1 m-0"><?= e($item['name']) ?></h1>
  </div>
  <div class="flex items-center gap-2">
    <a href="/item_edit.php?id=<?= (int) $item['id'] ?>" class="btn">Edit</a>
    <form method="post" action="/item_delete.php" class="inline"
          onsubmit="return confirm('Delete this item and all its allocations?');">
      <input type="hidden" name="id" value="<?= (int) $item['id'] ?>">
      <button type="submit" class="btn btn-danger">Delete</button>
    </form>
  </div>
</div>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <div class="md:col-span-2 card">
    <div class="card-body">
      <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
        <dt class="text-gray-500 dark:text-gray-400">Category</dt>
        <dd><?= e($item['category'] ?: '-') ?><?php if ($item['subcategory']): ?>
          <span class="text-gray-500 dark:text-gray-400"> / <?= e($item['subcategory']) ?></span>
        <?php endif ?></dd>

        <dt class="text-gray-500 dark:text-gray-400">Value / part</dt>
        <dd class="font-mono"><?= e($item['value'] ?: '-') ?></dd>

        <dt class="text-gray-500 dark:text-gray-400">Total</dt>
        <dd class="font-mono"><?= (int) $item['qty_total'] ?></dd>

        <dt class="text-gray-500 dark:text-gray-400" title="Sum across all project statuses">Allocated</dt>
        <dd class="font-mono"><?= $qty_allocated ?></dd>

        <dt class="text-gray-500 dark:text-gray-400" title="Sum across active projects only">In use</dt>
        <dd class="font-mono <?= $qty_in_use === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-orange-700 dark:text-orange-400 font-semibold' ?>">
          <?= $qty_in_use ?>
        </dd>

        <dt class="text-gray-500 dark:text-gray-400" title="Total - In use">Free</dt>
        <dd class="font-mono <?= $qty_free === 0 ? 'text-gray-400 dark:text-gray-500' : ($qty_free < 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-green-700 dark:text-green-400 font-semibold') ?>">
          <?= $qty_free ?>
        </dd>

        <?php if ($item['notes']): ?>
          <dt class="text-gray-500 dark:text-gray-400">Notes</dt>
          <dd class="whitespace-pre-wrap"><?= e($item['notes']) ?></dd>
        <?php endif ?>
      </dl>

      <?php if ($tags): ?>
        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tags</div>
          <div class="flex flex-wrap gap-2">
            <?php foreach ($tags as $t): ?>
              <a href="/items.php?tags=<?= e($t['slug']) ?>"
                 class="tag-chip"><?= e($t['name']) ?></a>
            <?php endforeach ?>
          </div>
        </div>
      <?php endif ?>
    </div>
  </div>

  <div class="card">
    <div class="card-body">
      <?php if ($item['image_path']): ?>
        <img src="<?= e(UPLOAD_URL_PREFIX . $item['image_path']) ?>"
             class="w-full max-h-64 rounded object-contain bg-gray-50 dark:bg-gray-900/60" alt="">
      <?php else: ?>
        <div class="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-gray-400 text-sm">
          No image
        </div>
      <?php endif ?>
    </div>
  </div>
</div>

<div class="card mb-6">
  <div class="card-body">
    <h2 class="text-lg font-semibold mb-3 m-0">Allocations</h2>
    <?php if ($allocations): ?>
      <div class="overflow-x-auto">
        <table class="table-default">
          <thead>
            <tr><th>Project</th><th class="num">Qty</th><th>Notes</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($allocations as $a): ?>
              <tr>
                <td>
                  <a href="/project.php?id=<?= (int) $a['project_id'] ?>" class="text-blue-600 dark:text-blue-400 hover:underline">
                    <?= e($a['project_name']) ?>
                  </a>
                  <span class="text-xs text-gray-500 dark:text-gray-400">(<?= e($a['project_status']) ?>)</span>
                </td>
                <td class="num font-mono"><?= (int) $a['qty'] ?></td>
                <td class="text-sm text-gray-600 dark:text-gray-400"><?= e($a['notes']) ?></td>
                <td>
                  <form method="post" action="/return_allocation.php" class="inline-flex gap-1">
                    <input type="hidden" name="alloc_id" value="<?= (int) $a['id'] ?>">
                    <input type="number" name="qty" min="1" max="<?= (int) $a['qty'] ?>" placeholder="all"
                           class="form-input w-20 py-1">
                    <button type="submit" class="btn btn-sm">Return</button>
                  </form>
                </td>
              </tr>
            <?php endforeach ?>
          </tbody>
        </table>
      </div>
    <?php else: ?>
      <p class="text-gray-500 dark:text-gray-400 italic m-0">Nothing allocated yet.</p>
    <?php endif ?>
  </div>
</div>

<?php if ($qty_free > 0): ?>
<div class="card">
  <div class="card-body">
    <h2 class="text-lg font-semibold mb-3 m-0">Allocate to a project</h2>
    <?php if ($projects): ?>
      <form method="post" action="/allocate.php" class="grid grid-cols-1 sm:grid-cols-[2fr_1fr_2fr_auto] gap-3 items-end">
        <input type="hidden" name="item_id" value="<?= (int) $item['id'] ?>">
        <label class="block">
          <span class="form-label">Project</span>
          <select name="project_id" required class="form-input">
            <?php foreach ($projects as $p): ?>
              <option value="<?= (int) $p['id'] ?>"><?= e($p['name']) ?></option>
            <?php endforeach ?>
          </select>
        </label>
        <label class="block">
          <span class="form-label">Qty</span>
          <input type="number" name="qty" min="1" max="<?= $qty_free ?>" value="1" required class="form-input">
        </label>
        <label class="block">
          <span class="form-label">Note (optional)</span>
          <input type="text" name="notes" class="form-input">
        </label>
        <button type="submit" class="btn btn-primary">Allocate</button>
      </form>
    <?php else: ?>
      <p class="text-gray-500 dark:text-gray-400 italic m-0">
        No active projects yet. <a href="/project_edit.php" class="text-blue-600 dark:text-blue-400 hover:underline">Create one</a>.
      </p>
    <?php endif ?>
  </div>
</div>
<?php endif ?>

<?php include SRC_DIR . '/footer.php';
