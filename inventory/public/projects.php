<?php
require_once __DIR__ . '/../src/bootstrap.php';

$projects = db()->query("
    SELECT p.*,
           COUNT(DISTINCT a.item_id) AS distinct_items,
           COALESCE(SUM(a.qty), 0)   AS total_units
      FROM projects p
 LEFT JOIN allocations a ON a.project_id = p.id
  GROUP BY p.id
  ORDER BY (p.status = 'active') DESC, p.name
")->fetchAll();

$tagMap = get_project_tag_map(db());
$cloud  = get_project_tag_cloud(db());

$maxTagCount = 1;
foreach ($cloud as $t) {
    $maxTagCount = max($maxTagCount, (int) $t['cnt']);
}

$difficulties = ['absolute beginner', 'beginner', 'intermediate', 'advanced'];
$statusClasses = [
    'planning'  => 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    'active'    => 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    'done'      => 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'abandoned' => 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
];
$difficultyClasses = [
    'absolute beginner' => 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    'beginner'          => 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    'intermediate'      => 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    'advanced'          => 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
];

$page_title = 'Projects';
include SRC_DIR . '/header.php';
?>

<div class="flex items-center justify-between mb-6 flex-wrap gap-2">
  <h1 class="text-2xl font-bold m-0">Projects <span class="text-gray-500 dark:text-gray-400 text-base font-normal">(<?= count($projects) ?>)</span></h1>
  <a href="/project_edit.php" class="btn btn-primary">+ New project</a>
</div>

<?php if ($cloud): ?>
<div class="card mb-4">
  <div class="card-body">
    <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
      Tags - click to filter (narrows progressively)
    </div>
    <div class="flex flex-wrap gap-2 items-baseline" id="tag-cloud">
      <?php foreach ($cloud as $t):
        $cnt = (int) $t['cnt'];
        $size = $maxTagCount > 1 ? 12 + (log($cnt) / log($maxTagCount)) * 12 : 14;
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
      <input id="project-search" type="search" placeholder="Search name, description, tag..."
             class="form-input flex-1 min-w-[200px]" autocomplete="off">
      <button type="button" id="clear-filters" class="btn btn-sm">Clear</button>
      <span id="result-count" class="text-sm text-gray-500 dark:text-gray-400 ml-auto"></span>
    </div>

    <div class="mt-3 flex flex-wrap gap-1.5 items-center" id="difficulty-filter">
      <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-1">Level</span>
      <button type="button" class="diff-pill" data-diff="">All</button>
      <?php foreach ($difficulties as $d): ?>
        <button type="button" class="diff-pill" data-diff="<?= e($d) ?>"><?= e($d) ?></button>
      <?php endforeach ?>
    </div>

    <div class="flex flex-wrap gap-2 mt-3" id="active-tags"></div>
  </div>
</div>

<div class="card overflow-hidden">
  <div class="overflow-x-auto">
    <table class="table-default" id="projects-table">
      <thead>
        <tr>
          <th class="num sortable" data-sort-key="id" data-sort-type="number" title="Project ID - sort descending to find the most recently added projects">ID <span class="sort-arrow"></span></th>
          <th class="sortable" data-sort-key="name"   data-sort-type="string">Name <span class="sort-arrow"></span></th>
          <th class="sortable" data-sort-key="status" data-sort-type="string">Status <span class="sort-arrow"></span></th>
          <th class="sortable" data-sort-key="diff"   data-sort-type="string">Level <span class="sort-arrow"></span></th>
          <th>Tags</th>
          <th class="num sortable" data-sort-key="items" data-sort-type="number">Items <span class="sort-arrow"></span></th>
          <th class="num sortable" data-sort-key="units" data-sort-type="number">Units <span class="sort-arrow"></span></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($projects as $p):
          $pid   = (int) $p['id'];
          $tags  = $tagMap[$pid] ?? [];
          $tagSlugs = implode(',', array_column($tags, 'slug'));
          $diff  = $p['difficulty'] ?? '';
          $statusCls = $statusClasses[$p['status']] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
          $diffCls   = $diff ? ($difficultyClasses[$diff] ?? 'bg-gray-100 text-gray-700') : '';
          $firstLine = trim(explode("\n", (string) $p['description'])[0] ?? '');
          $blurb = mb_strlen($firstLine) > 140 ? mb_substr($firstLine, 0, 140) . '...' : $firstLine;
          $searchable = strtolower(implode(' ', array_filter([
              $p['name'], $firstLine, implode(' ', array_column($tags, 'name'))
          ])));
          $diffSortKey = ['absolute beginner' => '1', 'beginner' => '2', 'intermediate' => '3', 'advanced' => '4'][$diff] ?? '9';
        ?>
          <tr data-search="<?= e($searchable) ?>"
              data-diff="<?= e($diff) ?>"
              data-status="<?= e($p['status']) ?>"
              data-tags="<?= e($tagSlugs) ?>"
              data-sort-id="<?= $pid ?>"
              data-sort-name="<?= e(mb_strtolower($p['name'])) ?>"
              data-sort-status="<?= e($p['status']) ?>"
              data-sort-diff="<?= e($diffSortKey) ?>"
              data-sort-items="<?= (int) $p['distinct_items'] ?>"
              data-sort-units="<?= (int) $p['total_units'] ?>">
            <td class="num text-xs text-gray-500 dark:text-gray-400 font-mono">
              <a href="/project.php?id=<?= $pid ?>" class="hover:underline">#<?= $pid ?></a>
            </td>
            <td>
              <a href="/project.php?id=<?= $pid ?>"
                 class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                <?= e($p['name']) ?>
              </a>
              <?php if ($blurb): ?>
                <div class="text-xs text-gray-500 dark:text-gray-400"><?= e($blurb) ?></div>
              <?php endif ?>
            </td>
            <td>
              <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium <?= $statusCls ?>">
                <?= e($p['status']) ?>
              </span>
            </td>
            <td>
              <?php if ($diff): ?>
                <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium <?= $diffCls ?>">
                  <?= e($diff) ?>
                </span>
              <?php endif ?>
            </td>
            <td>
              <div class="flex flex-wrap gap-1 max-w-md">
                <?php foreach ($tags as $t): ?>
                  <span class="inline-block px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <?= e($t['name']) ?>
                  </span>
                <?php endforeach ?>
              </div>
            </td>
            <td class="num font-mono"><?= (int) $p['distinct_items'] ?></td>
            <td class="num font-mono"><?= (int) $p['total_units'] ?></td>
          </tr>
        <?php endforeach ?>
      </tbody>
    </table>
  </div>
  <div id="empty-state" class="hidden p-8 text-center text-gray-500 dark:text-gray-400 italic">
    No projects match the current filters.
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

  .diff-pill {
    cursor: pointer;
    border: 1px solid rgb(209 213 219);
    background: #fff;
    color: rgb(75 85 99);
    padding: 0.15rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    transition: background-color 0.15s;
  }
  .dark .diff-pill { background: rgb(31 41 55); border-color: rgb(75 85 99); color: rgb(209 213 219); }
  .diff-pill:hover { background: rgb(243 244 246); }
  .dark .diff-pill:hover { background: rgb(55 65 81); }
  .diff-pill.active {
    background: rgb(37 99 235);
    border-color: rgb(37 99 235);
    color: white;
  }
  .dark .diff-pill.active { background: rgb(59 130 246); border-color: rgb(59 130 246); }
</style>

<script src="/assets/projects.js?v=1"></script>

<?php include SRC_DIR . '/footer.php';
