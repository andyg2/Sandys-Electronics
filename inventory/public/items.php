<?php
require_once __DIR__ . '/../src/bootstrap.php';

$items = db()->query(
    "SELECT * FROM items ORDER BY category, subcategory, name"
)->fetchAll();

$allocByItem  = [];
$inUseByItem  = [];
$projsByItem  = [];
foreach (db()->query(
    "SELECT a.item_id,
            COALESCE(SUM(a.qty), 0) AS allocated,
            COALESCE(SUM(CASE WHEN p.status = 'active' THEN a.qty ELSE 0 END), 0) AS in_use,
            COUNT(DISTINCT a.project_id) AS projects
       FROM allocations a
       JOIN projects p ON p.id = a.project_id
   GROUP BY a.item_id"
) as $r) {
    $iid = (int) $r['item_id'];
    $allocByItem[$iid] = (int) $r['allocated'];
    $inUseByItem[$iid] = (int) $r['in_use'];
    $projsByItem[$iid] = (int) $r['projects'];
}

$categories = db()->query(
    "SELECT DISTINCT category FROM items WHERE category IS NOT NULL ORDER BY category"
)->fetchAll(PDO::FETCH_COLUMN);

$itemTagMap = get_item_tag_map(db());
$cloud      = get_tag_cloud(db());

$maxTagCount = 1;
foreach ($cloud as $t) {
    $maxTagCount = max($maxTagCount, (int) $t['cnt']);
}

$page_title = 'Items';
include SRC_DIR . '/header.php';
?>

<div class="flex items-center justify-between mb-6 flex-wrap gap-2">
  <h1 class="text-2xl font-bold m-0">Items</h1>
  <a href="/item_edit.php" class="btn btn-primary">+ Add item</a>
</div>

<?php if ($cloud): ?>
<div class="card mb-4">
  <div class="card-body">
    <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
      Tags - click to filter (narrows progressively)
    </div>
    <div class="flex flex-wrap gap-2 items-baseline" id="tag-cloud">
      <?php foreach ($cloud as $t): ?>
        <?php
          $cnt = (int) $t['cnt'];
          $size = $maxTagCount > 1
            ? 12 + (log($cnt) / log($maxTagCount)) * 12
            : 14;
        ?>
        <a href="?tags=<?= e($t['slug']) ?>"
           class="tag-chip"
           data-tag-slug="<?= e($t['slug']) ?>"
           data-tag-name="<?= e($t['name']) ?>"
           style="font-size: <?= number_format($size, 1) ?>px">
          <span class="tag-name"><?= e($t['name']) ?></span>
          <span class="tag-count opacity-60 text-xs">(<?= $cnt ?>)</span>
        </a>
      <?php endforeach ?>
    </div>
  </div>
</div>
<?php endif ?>

<div class="card mb-4">
  <div class="card-body">
    <div class="flex flex-wrap gap-2 items-center">
      <input id="item-search" type="search" placeholder="Search name, value, sub-category, tag ..."
             class="form-input flex-1 min-w-[200px]" autocomplete="off">
      <select id="category-filter" class="form-input max-w-xs">
        <option value="">All categories</option>
        <?php foreach ($categories as $c): ?>
          <option value="<?= e($c) ?>"><?= e($c) ?></option>
        <?php endforeach ?>
      </select>
      <button type="button" id="clear-filters" class="btn btn-sm">Clear</button>
      <span id="result-count" class="text-sm text-gray-500 dark:text-gray-400 ml-auto"></span>
    </div>
    <div class="flex flex-wrap gap-2 mt-2" id="active-tags"></div>
  </div>
</div>

<div class="card overflow-hidden">
  <div class="overflow-x-auto">
    <table class="table-default" id="items-table">
      <thead>
        <tr>
          <th class="w-12"></th>
          <th class="sortable" data-sort-key="name"     data-sort-type="string">Name <span class="sort-arrow"></span></th>
          <th class="sortable" data-sort-key="category" data-sort-type="string">Category <span class="sort-arrow"></span></th>
          <th class="sortable" data-sort-key="value"    data-sort-type="string">Value <span class="sort-arrow"></span></th>
          <th>Tags</th>
          <th class="num sortable" data-sort-key="total" data-sort-type="number">Total <span class="sort-arrow"></span></th>
          <th class="num sortable" data-sort-key="alloc" data-sort-type="number" title="Sum across all projects (planning, active, done, abandoned)">Alloc <span class="sort-arrow"></span></th>
          <th class="num sortable" data-sort-key="inuse" data-sort-type="number" title="Sum across active projects only (parts physically committed right now)">In use <span class="sort-arrow"></span></th>
          <th class="num sortable" data-sort-key="free"  data-sort-type="number" title="Total minus In use - what's available to start a new project today">Free <span class="sort-arrow"></span></th>
          <th class="num sortable" data-sort-key="proj"  data-sort-type="number" title="Number of projects this item is allocated to">Proj <span class="sort-arrow"></span></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($items as $item): ?>
          <?php
            $iid       = (int) $item['id'];
            $tags      = $itemTagMap[$iid] ?? [];
            $allocated = $allocByItem[$iid] ?? 0;
            $inUse     = $inUseByItem[$iid] ?? 0;
            $projCount = $projsByItem[$iid] ?? 0;
            $free      = (int) $item['qty_total'] - $inUse;
            $searchable = strtolower(implode(' ', array_filter([
                $item['name'], $item['value'], $item['subcategory'],
                $item['notes'],
                implode(' ', array_column($tags, 'name')),
            ])));
            $tagSlugs = implode(',', array_column($tags, 'slug'));
          ?>
          <tr data-search="<?= e($searchable) ?>"
              data-category="<?= e($item['category']) ?>"
              data-tags="<?= e($tagSlugs) ?>"
              data-sort-name="<?= e(mb_strtolower($item['name'] ?? '')) ?>"
              data-sort-category="<?= e(mb_strtolower($item['category'] ?? '')) ?>"
              data-sort-value="<?= e(mb_strtolower($item['value'] ?? '')) ?>"
              data-sort-total="<?= (int) $item['qty_total'] ?>"
              data-sort-alloc="<?= $allocated ?>"
              data-sort-inuse="<?= $inUse ?>"
              data-sort-free="<?= $free ?>"
              data-sort-proj="<?= $projCount ?>">
            <td>
              <?php if ($item['image_path']): ?>
                <img src="<?= e(UPLOAD_URL_PREFIX . $item['image_path']) ?>"
                     class="w-12 h-12 rounded object-cover border border-gray-200 dark:border-gray-700" alt="">
              <?php endif ?>
            </td>
            <td>
              <a href="/item.php?id=<?= $iid ?>" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                <?= e($item['name']) ?>
              </a>
              <?php if ($item['subcategory']): ?>
                <div class="text-xs text-gray-500 dark:text-gray-400"><?= e($item['subcategory']) ?></div>
              <?php endif ?>
            </td>
            <td class="text-sm text-gray-700 dark:text-gray-300"><?= e($item['category']) ?></td>
            <td class="text-sm text-gray-700 dark:text-gray-300 font-mono"><?= e($item['value']) ?></td>
            <td>
              <div class="flex flex-wrap gap-1">
                <?php foreach ($tags as $t): ?>
                  <span class="inline-block px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <?= e($t['name']) ?>
                  </span>
                <?php endforeach ?>
              </div>
            </td>
            <td class="num"><?= (int) $item['qty_total'] ?></td>
            <td class="num text-gray-500 dark:text-gray-400"><?= $allocated ?></td>
            <td class="num <?= $inUse === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-orange-700 dark:text-orange-400 font-medium' ?>">
              <?= $inUse ?>
            </td>
            <td class="num <?= $free === 0 ? 'text-gray-400 dark:text-gray-500' : ($free < 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-green-700 dark:text-green-400 font-medium') ?>">
              <?= $free ?>
            </td>
            <td class="num <?= $projCount === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-blue-700 dark:text-blue-400 font-medium' ?>">
              <?php if ($projCount > 0): ?>
                <a href="/item.php?id=<?= $iid ?>#allocations"
                   class="hover:underline"
                   title="<?= $projCount ?> project<?= $projCount === 1 ? '' : 's' ?>"><?= $projCount ?></a>
              <?php else: ?>
                <?= $projCount ?>
              <?php endif ?>
            </td>
          </tr>
        <?php endforeach ?>
      </tbody>
    </table>
  </div>
  <div id="empty-state" class="hidden p-8 text-center text-gray-500 dark:text-gray-400 italic">
    No items match the current filters.
  </div>
</div>

<style>
  th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
  th.sortable:hover { background-color: rgb(241 245 249); }
  .dark th.sortable:hover { background-color: rgba(31, 41, 55, 0.7); }
  th.sortable .sort-arrow { font-size: 10px; opacity: 0.3; margin-left: 2px; }
  th.sortable[data-sort-active="asc"] .sort-arrow,
  th.sortable[data-sort-active="desc"] .sort-arrow { opacity: 1; }
  th.sortable[data-sort-active="asc"] .sort-arrow::after { content: "\25B2"; }
  th.sortable[data-sort-active="desc"] .sort-arrow::after { content: "\25BC"; }
  th.sortable:not([data-sort-active]) .sort-arrow::after { content: "\21F5"; }
</style>

<script src="/assets/inventory.js?v=3"></script>

<?php include SRC_DIR . '/footer.php';
