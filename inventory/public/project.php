<?php
require_once __DIR__ . '/../src/bootstrap.php';

$id = input_int('id');
if ($id <= 0) {
    http_response_code(404);
    exit('Project not found');
}

$stmt = db()->prepare('SELECT * FROM projects WHERE id = ?');
$stmt->execute([$id]);
$project = $stmt->fetch();
if (!$project) {
    http_response_code(404);
    exit('Project not found');
}

$alloc = db()->prepare("
    SELECT a.id, a.qty, a.notes, a.created_at,
           i.id AS item_id, i.name AS item_name,
           i.category, i.subcategory, i.value, i.image_path
      FROM allocations a
      JOIN items i ON i.id = a.item_id
     WHERE a.project_id = ?
  ORDER BY i.category, i.name
");
$alloc->execute([$id]);
$allocations = $alloc->fetchAll();

$statusClasses = [
    'planning'  => 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    'active'    => 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    'done'      => 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'abandoned' => 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
];
$statusClass = $statusClasses[$project['status']] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

$difficultyClasses = [
    'absolute beginner' => 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    'beginner'          => 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    'intermediate'      => 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    'advanced'          => 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
];
$difficulty = $project['difficulty'] ?? null;
$difficultyClass = $difficulty ? ($difficultyClasses[$difficulty] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300') : null;

$learningConcepts = [];
if (!empty($project['learning_concepts'])) {
    $decoded = json_decode((string) $project['learning_concepts'], true);
    if (is_array($decoded)) {
        $learningConcepts = array_values(array_filter($decoded, 'is_string'));
    }
}

$projectTags = get_project_tags(db(), $id);

$codeLang = $project['code_language'] ?: 'cpp';

$page_title = $project['name'];
include SRC_DIR . '/header.php';
?>

<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css">

<div class="flex items-start justify-between gap-4 mb-6 flex-wrap">
  <div>
    <a href="/projects.php" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 no-underline">&larr; All projects</a>
    <h1 class="text-2xl font-bold mt-1 m-0">
      <?= e($project['name']) ?>
      <span class="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium align-middle <?= $statusClass ?>">
        <?= e($project['status']) ?>
      </span>
      <?php if ($difficulty): ?>
        <span class="ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium align-middle <?= $difficultyClass ?>">
          <?= e($difficulty) ?>
        </span>
      <?php endif ?>
    </h1>
    <?php if ($learningConcepts): ?>
      <div class="flex flex-wrap gap-1 mt-2">
        <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mr-1 self-center">Teaches</span>
        <?php foreach ($learningConcepts as $concept): ?>
          <span class="inline-block px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800/60">
            <?= e($concept) ?>
          </span>
        <?php endforeach ?>
      </div>
    <?php endif ?>

    <?php if ($projectTags): ?>
      <div class="flex flex-wrap gap-1 mt-2">
        <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mr-1 self-center">Tags</span>
        <?php foreach ($projectTags as $t): ?>
          <a href="/projects.php?tags=<?= e($t['slug']) ?>"
             class="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 no-underline transition-colors">
            <?= e($t['name']) ?>
          </a>
        <?php endforeach ?>
      </div>
    <?php endif ?>
  </div>
  <div class="flex items-center gap-2">
    <a href="/project_edit.php?id=<?= (int) $project['id'] ?>" class="btn">Edit</a>
    <form method="post" action="/project_delete.php" class="inline"
          onsubmit="return confirm('Delete this project and release its allocations?');">
      <input type="hidden" name="id" value="<?= (int) $project['id'] ?>">
      <button type="submit" class="btn btn-danger">Delete</button>
    </form>
  </div>
</div>

<nav id="project-nav" class="mb-6 hidden">
  <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1.5">On this page</div>
  <div id="project-nav-links" class="flex flex-wrap gap-1.5"></div>
</nav>

<?php if (!empty($project['power_supply'])): ?>
<div class="mb-6 flex items-start gap-3 px-4 py-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
  <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold mt-0.5" aria-hidden="true">P</span>
  <div>
    <div class="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Power supply</div>
    <div class="text-sm text-amber-900 dark:text-amber-100"><?= e($project['power_supply']) ?></div>
  </div>
</div>
<?php endif ?>

<?php if ($project['description']): ?>
<div class="card mb-6">
  <div class="card-body">
    <script type="text/markdown" id="md-source"><?= e($project['description']) ?></script>
    <div class="prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none
                prose-pre:bg-gray-900 prose-pre:text-gray-100
                prose-code:before:content-[''] prose-code:after:content-['']
                prose-headings:scroll-mt-20" id="md-rendered">
      <pre class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 bg-transparent p-0"><?= e($project['description']) ?></pre>
    </div>
  </div>
</div>
<?php endif ?>

<?php if ($project['wiring_diagram']): ?>
<div class="card mb-6" id="section-wiring-diagram" data-project-section="Wiring diagram">
  <div class="card-body">
    <h2 class="text-lg font-semibold mb-3 mt-0">Wiring diagram</h2>
    <div class="bg-white dark:bg-gray-100 rounded border border-gray-100 dark:border-gray-700 p-4 overflow-x-auto">
      <div class="mermaid"><?= e($project['wiring_diagram']) ?></div>
    </div>
  </div>
</div>
<?php endif ?>

<?php if (!empty($project['breadboard_layout'])): ?>
<?php
  $bbItems = [];
  foreach ($allocations as $a) {
      $bbItems[(int) $a['item_id']] = [
          'id'         => (int) $a['item_id'],
          'name'       => $a['item_name'],
          'image_path' => $a['image_path'] ? UPLOAD_URL_PREFIX . $a['image_path'] : null,
          'category'   => $a['category'],
          'value'      => $a['value'],
      ];
  }
?>
<div class="card mb-6" id="section-breadboard-layout" data-project-section="Breadboard layout">
  <div class="card-body">
    <h2 class="text-lg font-semibold mb-3 mt-0">Breadboard layout</h2>
    <div class="bg-white dark:bg-gray-100 rounded border border-gray-100 dark:border-gray-700 p-2 sm:p-4 overflow-x-auto">
      <pre data-breadboard data-items="<?= e(json_encode($bbItems, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_FORCE_OBJECT)) ?>" hidden><?= e($project['breadboard_layout']) ?></pre>
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
      Rows A-J, columns 1-30. Red rail = + power, dark rail = ground. Yellow dot on a chip marks pin 1.
      Hover a component or off-board line for the part's photo.
    </p>
  </div>
</div>
<?php endif ?>

<?php if ($project['code']): ?>
<div class="card mb-6" id="section-code" data-project-section="Code">
  <div class="card-body">
    <h2 class="text-lg font-semibold mb-3 mt-0 flex items-center gap-2">
      Code
      <span class="text-xs font-normal text-gray-500 dark:text-gray-400 font-mono"><?= e($codeLang) ?></span>
    </h2>
    <pre class="rounded-md"><code class="language-<?= e($codeLang) ?>"><?= e($project['code']) ?></code></pre>
  </div>
</div>
<?php endif ?>

<div class="card mb-6" id="section-allocated-parts" data-project-section="Allocated parts">
  <div class="card-body">
    <h2 class="text-lg font-semibold mb-3 m-0">Allocated parts</h2>
    <?php if ($allocations): ?>
      <div class="overflow-x-auto">
        <table class="table-default">
          <thead>
            <tr>
              <th class="w-12"></th>
              <th>Item</th>
              <th>Category</th>
              <th>Value</th>
              <th class="num">Qty</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($allocations as $a): ?>
              <tr>
                <td>
                  <?php if ($a['image_path']): ?>
                    <img src="<?= e(UPLOAD_URL_PREFIX . $a['image_path']) ?>"
                         class="w-12 h-12 rounded object-cover border border-gray-200 dark:border-gray-700" alt="">
                  <?php endif ?>
                </td>
                <td>
                  <a href="/item.php?id=<?= (int) $a['item_id'] ?>"
                     class="text-blue-600 dark:text-blue-400 hover:underline"><?= e($a['item_name']) ?></a>
                </td>
                <td class="text-sm text-gray-700 dark:text-gray-300">
                  <?= e($a['category']) ?><?php if ($a['subcategory']): ?> / <?= e($a['subcategory']) ?><?php endif ?>
                </td>
                <td class="text-sm text-gray-700 font-mono"><?= e($a['value']) ?></td>
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
      <p class="text-gray-500 dark:text-gray-400 italic m-0">
        No parts assigned yet. Go to <a href="/items.php" class="text-blue-600 dark:text-blue-400 hover:underline">Items</a> and allocate some.
      </p>
    <?php endif ?>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
  }
</script>
<script src="/assets/breadboard.js?v=10"></script>
<script src="/assets/project_render.js?v=3"></script>

<?php include SRC_DIR . '/footer.php';
