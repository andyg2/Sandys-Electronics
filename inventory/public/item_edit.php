<?php
require_once __DIR__ . '/../src/bootstrap.php';

$id = input_int('id');
$item = null;

if ($id > 0) {
    $stmt = db()->prepare('SELECT * FROM items WHERE id = ?');
    $stmt->execute([$id]);
    $item = $stmt->fetch();
    if (!$item) {
        http_response_code(404);
        exit('Item not found');
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = input_str('name');
    if ($name === '') {
        flash('Name is required.');
        redirect($_SERVER['REQUEST_URI']);
    }
    $category    = input_text('category');
    $subcategory = input_text('subcategory');
    $value       = input_text('value');
    $notes       = input_text('notes');
    $qty_total   = max(0, input_int('qty_total'));
    $tagsCsv     = input_str('tags');

    $new_image_path = null;
    $file = $_FILES['image'] ?? null;
    if ($file && isset($file['error']) && $file['error'] === UPLOAD_ERR_OK) {
        if ($file['size'] > MAX_UPLOAD_BYTES) {
            flash('Image too large (8 MB max). Ignored.');
        } else {
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ALLOWED_IMAGE_EXT, true)) {
                if (!is_dir(UPLOAD_DIR)) {
                    mkdir(UPLOAD_DIR, 0777, true);
                }
                $stored = bin2hex(random_bytes(16)) . '.' . $ext;
                if (move_uploaded_file($file['tmp_name'], UPLOAD_DIR . DIRECTORY_SEPARATOR . $stored)) {
                    $new_image_path = $stored;
                } else {
                    flash('Could not save uploaded image.');
                }
            } else {
                flash('Image must be PNG / JPG / GIF / WebP. Ignored.');
            }
        }
    }

    if ($item === null) {
        $stmt = db()->prepare("
            INSERT INTO items (name, category, subcategory, value, qty_total, image_path, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$name, $category, $subcategory, $value, $qty_total, $new_image_path, $notes]);
        $itemId = (int) db()->lastInsertId();
    } else {
        $itemId = (int) $item['id'];
        if ($new_image_path !== null) {
            $stmt = db()->prepare("
                UPDATE items
                   SET name=?, category=?, subcategory=?, value=?,
                       qty_total=?, image_path=?, notes=?
                 WHERE id=?
            ");
            $stmt->execute([$name, $category, $subcategory, $value, $qty_total, $new_image_path, $notes, $itemId]);
        } else {
            $stmt = db()->prepare("
                UPDATE items
                   SET name=?, category=?, subcategory=?, value=?,
                       qty_total=?, notes=?
                 WHERE id=?
            ");
            $stmt->execute([$name, $category, $subcategory, $value, $qty_total, $notes, $itemId]);
        }
    }

    sync_item_tags(db(), $itemId, parse_tag_csv($tagsCsv));
    redirect('/item.php?id=' . $itemId);
}

$existingTags = $item ? get_item_tags(db(), (int) $item['id']) : [];
$existingTagsCsv = implode(', ', array_column($existingTags, 'name'));
$allTagNames = get_all_tag_names(db());

$usedInProjects = [];
if ($item) {
    $u = db()->prepare("
        SELECT p.id, p.name, p.status, p.difficulty, a.qty, a.notes
          FROM allocations a
          JOIN projects p ON p.id = a.project_id
         WHERE a.item_id = ?
      ORDER BY (p.status = 'active') DESC, (p.status = 'planning') DESC, p.name
    ");
    $u->execute([(int) $item['id']]);
    $usedInProjects = $u->fetchAll();
}

$statusBadgeClasses = [
    'planning'  => 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    'active'    => 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    'done'      => 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'abandoned' => 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
];

$page_title = $item === null ? 'New item' : 'Edit ' . $item['name'];
include SRC_DIR . '/header.php';
?>

<div class="mb-4">
  <a href="<?= $item ? '/item.php?id=' . (int) $item['id'] : '/items.php' ?>"
     class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 no-underline">&larr; Back</a>
  <h1 class="text-2xl font-bold mt-1 m-0">
    <?= $item === null ? 'New item' : 'Edit ' . e($item['name']) ?>
  </h1>
</div>

<div class="card max-w-2xl">
  <div class="card-body">
    <form method="post"
          action="<?= $item === null ? '/item_edit.php' : '/item_edit.php?id=' . (int) $item['id'] ?>"
          enctype="multipart/form-data"
          class="space-y-4">

      <label class="block">
        <span class="form-label">Name</span>
        <input type="text" name="name" value="<?= e($item['name'] ?? '') ?>" required class="form-input">
      </label>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="block">
          <span class="form-label">Category</span>
          <input type="text" name="category"
                 value="<?= e($item['category'] ?? '') ?>"
                 placeholder="e.g. Resistor, Sensor, IC, Module"
                 class="form-input">
        </label>
        <label class="block">
          <span class="form-label">Sub-category</span>
          <input type="text" name="subcategory"
                 value="<?= e($item['subcategory'] ?? '') ?>"
                 placeholder="e.g. 1/8W 1% metal film"
                 class="form-input">
        </label>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="block">
          <span class="form-label">Value / part number</span>
          <input type="text" name="value"
                 value="<?= e($item['value'] ?? '') ?>"
                 placeholder="e.g. 10K, BC547, VL53L0X"
                 class="form-input">
        </label>
        <label class="block">
          <span class="form-label">Quantity on hand</span>
          <input type="number" name="qty_total" min="0"
                 value="<?= (int) ($item['qty_total'] ?? 0) ?>" required class="form-input">
        </label>
      </div>

      <label class="block">
        <span class="form-label">Tags (comma-separated)</span>
        <input type="text" name="tags" id="tags-input"
               value="<?= e($existingTagsCsv) ?>"
               placeholder="e.g. i2c, sensor, low-power"
               class="form-input">
        <?php if ($allTagNames): ?>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">Click to add an existing tag:</div>
          <div class="flex flex-wrap gap-1" id="tag-suggestions">
            <?php foreach ($allTagNames as $tn): ?>
              <button type="button"
                      class="inline-block px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                      data-tag-name="<?= e($tn) ?>"><?= e($tn) ?></button>
            <?php endforeach ?>
          </div>
        <?php endif ?>
      </label>

      <label class="block">
        <span class="form-label">Image (optional)</span>
        <input type="file" name="image" accept="image/png,image/jpeg,image/gif,image/webp"
               class="block text-sm text-gray-700 dark:text-gray-300">
        <?php if (!empty($item['image_path'])): ?>
          <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">Current:
            <img src="<?= e(UPLOAD_URL_PREFIX . $item['image_path']) ?>"
                 class="inline-block w-12 h-12 rounded object-cover border border-gray-200 dark:border-gray-700 align-middle" alt="">
          </div>
        <?php endif ?>
      </label>

      <label class="block">
        <span class="form-label">Notes</span>
        <textarea name="notes" rows="4" class="form-input"><?= e($item['notes'] ?? '') ?></textarea>
      </label>

      <div class="flex items-center gap-2 pt-2">
        <button type="submit" class="btn btn-primary">Save</button>
        <a class="btn-link"
           href="<?= $item ? '/item.php?id=' . (int) $item['id'] : '/items.php' ?>">Cancel</a>
      </div>
    </form>
  </div>
</div>

<?php if ($item): ?>
<div class="card max-w-2xl mt-4">
  <div class="card-body">
    <h2 class="text-base font-semibold m-0 mb-2 flex items-center gap-2">
      Used in
      <span class="inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 rounded-full text-xs font-medium
                   <?= count($usedInProjects) > 0
                       ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                       : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' ?>">
        <?= count($usedInProjects) ?>
      </span>
      project<?= count($usedInProjects) === 1 ? '' : 's' ?>
    </h2>
    <?php if ($usedInProjects): ?>
      <ul class="divide-y divide-gray-100 dark:divide-gray-700 -mx-2">
        <?php foreach ($usedInProjects as $up):
              $cls = $statusBadgeClasses[$up['status']] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        ?>
          <li class="px-2 py-2 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <a href="/project.php?id=<?= (int) $up['id'] ?>"
                 class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                <?= e($up['name']) ?>
              </a>
              <span class="ml-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium align-middle <?= $cls ?>">
                <?= e($up['status']) ?>
              </span>
              <?php if ($up['notes']): ?>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5"><?= e($up['notes']) ?></div>
              <?php endif ?>
            </div>
            <div class="text-right shrink-0">
              <span class="font-mono text-sm">x<?= (int) $up['qty'] ?></span>
            </div>
          </li>
        <?php endforeach ?>
      </ul>
    <?php else: ?>
      <p class="text-sm text-gray-500 dark:text-gray-400 italic m-0">
        Not allocated to any project yet.
      </p>
    <?php endif ?>
  </div>
</div>
<?php endif ?>

<script>
(function () {
  const input = document.getElementById('tags-input');
  document.querySelectorAll('#tag-suggestions [data-tag-name]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tagName;
      const current = input.value
        .split(',').map(s => s.trim()).filter(Boolean);
      if (current.some(c => c.toLowerCase() === name.toLowerCase())) return;
      current.push(name);
      input.value = current.join(', ');
      input.focus();
    });
  });
})();
</script>

<?php include SRC_DIR . '/footer.php';
