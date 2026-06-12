<?php
require_once __DIR__ . '/../src/bootstrap.php';

$id = input_int('id');
$project = null;

if ($id > 0) {
    $stmt = db()->prepare('SELECT * FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    $project = $stmt->fetch();
    if (!$project) {
        http_response_code(404);
        exit('Project not found');
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = input_str('name');
    if ($name === '') {
        flash('Project name is required.');
        redirect($_SERVER['REQUEST_URI']);
    }
    $description       = input_text('description');
    $wiring_diagram    = input_text('wiring_diagram');
    $breadboard_layout = input_text('breadboard_layout');
    $code              = input_text('code');
    $code_language  = input_str('code_language', 'cpp');
    if ($code_language === '') {
        $code_language = 'cpp';
    }
    $power_supply   = input_text('power_supply');
    $difficulty     = input_text('difficulty');
    $allowedDifficulty = ['absolute beginner', 'beginner', 'intermediate', 'advanced'];
    if ($difficulty !== null && !in_array($difficulty, $allowedDifficulty, true)) {
        $difficulty = null;
    }
    $rawConcepts = input_str('learning_concepts');
    $conceptList = array_values(array_filter(array_map('trim', explode(',', $rawConcepts))));
    $learning_concepts = $conceptList ? json_encode($conceptList) : null;

    $rawTags = input_str('tags');
    $tagNames = parse_tag_csv($rawTags);

    $status = input_str('status', 'active');
    if (!in_array($status, PROJECT_STATUSES, true)) {
        $status = 'active';
    }

    try {
        if ($project === null) {
            $stmt = db()->prepare("
                INSERT INTO projects
                    (name, description, wiring_diagram, breadboard_layout, code, code_language,
                     power_supply, difficulty, learning_concepts, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$name, $description, $wiring_diagram, $breadboard_layout, $code, $code_language,
                            $power_supply, $difficulty, $learning_concepts, $status]);
            $newId = (int) db()->lastInsertId();
            sync_project_tags(db(), $newId, $tagNames);
            redirect('/project.php?id=' . $newId);
        } else {
            $stmt = db()->prepare("
                UPDATE projects
                   SET name=?, description=?, wiring_diagram=?, breadboard_layout=?,
                       code=?, code_language=?, power_supply=?,
                       difficulty=?, learning_concepts=?, status=?
                 WHERE id=?
            ");
            $stmt->execute([$name, $description, $wiring_diagram, $breadboard_layout, $code, $code_language,
                            $power_supply, $difficulty, $learning_concepts, $status, (int) $project['id']]);
            sync_project_tags(db(), (int) $project['id'], $tagNames);
            redirect('/project.php?id=' . (int) $project['id']);
        }
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            flash('A project with that name already exists.');
            redirect($_SERVER['REQUEST_URI']);
        }
        throw $e;
    }
}

$page_title = $project === null ? 'New project' : 'Edit ' . $project['name'];
include SRC_DIR . '/header.php';
?>

<div class="mb-4">
  <a href="<?= $project ? '/project.php?id=' . (int) $project['id'] : '/projects.php' ?>"
     class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 no-underline">&larr; Back</a>
  <h1 class="text-2xl font-bold mt-1 m-0">
    <?= $project === null ? 'New project' : 'Edit ' . e($project['name']) ?>
  </h1>
</div>

<div class="card max-w-2xl">
  <div class="card-body">
    <form method="post"
          action="<?= $project === null ? '/project_edit.php' : '/project_edit.php?id=' . (int) $project['id'] ?>"
          class="space-y-4">

      <label class="block">
        <span class="form-label">Name</span>
        <input type="text" name="name" value="<?= e($project['name'] ?? '') ?>" required class="form-input">
      </label>

      <label class="block">
        <span class="form-label">Description</span>
        <textarea name="description" rows="10" class="form-input font-mono text-sm"><?= e($project['description'] ?? '') ?></textarea>
        <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
          Markdown supported: headings (<code># H1</code>, <code>## H2</code>), fenced code blocks (<code>```cpp</code>), lists, links. Fenced <code>```mermaid</code> blocks render as diagrams.
        </span>
      </label>

      <label class="block">
        <span class="form-label">Power supply
          <span class="text-xs font-normal text-amber-700 dark:text-amber-300">(required - shown as a callout)</span>
        </span>
        <input type="text" name="power_supply"
               value="<?= e($project['power_supply'] ?? '') ?>"
               placeholder="e.g. USB cable to laptop (5V), 9V wall wart into DC jack, 4xAA pack"
               class="form-input">
        <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
          Tell the builder where the power comes from. Include it as a node in the wiring diagram below too.
        </span>
      </label>

      <?php
        $existingTags    = $project ? get_project_tags(db(), (int) $project['id']) : [];
        $existingTagsCsv = implode(', ', array_column($existingTags, 'name'));
        $allTagNames     = get_all_tag_names(db());
      ?>
      <label class="block">
        <span class="form-label">Tags <span class="text-xs font-normal text-gray-500 dark:text-gray-400">(comma-separated)</span></span>
        <input type="text" name="tags" id="project-tags-input"
               value="<?= e($existingTagsCsv) ?>"
               placeholder="e.g. WiFi, OLED, Game"
               class="form-input">
        <?php if ($allTagNames): ?>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">Click to add an existing tag:</div>
          <div class="flex flex-wrap gap-1" id="project-tag-suggestions">
            <?php foreach ($allTagNames as $tn): ?>
              <button type="button"
                      class="inline-block px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                      data-tag-name="<?= e($tn) ?>"><?= e($tn) ?></button>
            <?php endforeach ?>
          </div>
        <?php endif ?>
      </label>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="block">
          <span class="form-label">Difficulty</span>
          <select name="difficulty" class="form-input">
            <?php
              $diffOpts = ['' => '- not set -', 'absolute beginner' => 'absolute beginner', 'beginner' => 'beginner', 'intermediate' => 'intermediate', 'advanced' => 'advanced'];
              $cur = $project['difficulty'] ?? '';
              foreach ($diffOpts as $val => $label):
            ?>
              <option value="<?= e($val) ?>" <?= $cur === $val ? 'selected' : '' ?>><?= e($label) ?></option>
            <?php endforeach ?>
          </select>
        </label>
        <label class="block">
          <span class="form-label">Learning concepts <span class="text-xs font-normal text-gray-500 dark:text-gray-400">(comma-separated)</span></span>
          <?php
            $existingConceptsStr = '';
            if (!empty($project['learning_concepts'])) {
                $d = json_decode((string) $project['learning_concepts'], true);
                if (is_array($d)) $existingConceptsStr = implode(', ', $d);
            }
          ?>
          <input type="text" name="learning_concepts"
                 value="<?= e($existingConceptsStr) ?>"
                 placeholder="e.g. PWM, I2C, Interrupts, Pull-up resistor"
                 class="form-input">
        </label>
      </div>

      <label class="block">
        <span class="form-label">Wiring diagram
          <span class="text-xs font-normal text-gray-500 dark:text-gray-400">(Mermaid)</span>
        </span>
        <textarea name="wiring_diagram" rows="10" class="form-input font-mono text-sm"
                  placeholder="flowchart LR&#10;    P9[Pin 9] --> LED((Red LED))&#10;    LED --> R[220&#937;]&#10;    R --> GND"><?= e($project['wiring_diagram'] ?? '') ?></textarea>
        <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
          See <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" class="underline">flowchart syntax</a>. Leave blank to omit the wiring section.
        </span>
      </label>

      <label class="block">
        <span class="form-label">Breadboard layout
          <span class="text-xs font-normal text-gray-500 dark:text-gray-400">(JSON - see AGENTS.md)</span>
        </span>
        <textarea name="breadboard_layout" rows="10" class="form-input font-mono text-sm"
                  placeholder='{ "components": [ { "type": "led", "anode": "B10", "cathode": "C10", "color": "red" } ] }'><?= e($project['breadboard_layout'] ?? '') ?></textarea>
        <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
          Positions are <code>{ROW}{COL}</code> on a 30-column half-size board (rows A-J, +5V, GND). Leave blank to omit.
        </span>
      </label>

      <div class="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
        <label class="block">
          <span class="form-label">Code</span>
          <textarea name="code" rows="16" class="form-input font-mono text-sm"
                    placeholder="// project code"><?= e($project['code'] ?? '') ?></textarea>
        </label>
        <label class="block">
          <span class="form-label">Language</span>
          <input type="text" name="code_language"
                 value="<?= e($project['code_language'] ?? 'cpp') ?>"
                 placeholder="cpp" class="form-input">
          <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            cpp, python, javascript, bash, etc. - drives syntax highlighting.
          </span>
        </label>
      </div>

      <label class="block">
        <span class="form-label">Status</span>
        <select name="status" class="form-input">
          <?php foreach (PROJECT_STATUSES as $s): ?>
            <?php
              $selected = ($project && $project['status'] === $s)
                || (!$project && $s === 'active');
            ?>
            <option value="<?= e($s) ?>" <?= $selected ? 'selected' : '' ?>><?= e($s) ?></option>
          <?php endforeach ?>
        </select>
      </label>

      <div class="flex items-center gap-2 pt-2">
        <button type="submit" class="btn btn-primary">Save</button>
        <a class="btn-link"
           href="<?= $project ? '/project.php?id=' . (int) $project['id'] : '/projects.php' ?>">Cancel</a>
      </div>
    </form>
  </div>
</div>

<script>
(function () {
  const input = document.getElementById('project-tags-input');
  if (!input) return;
  document.querySelectorAll('#project-tag-suggestions [data-tag-name]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tagName;
      const current = input.value.split(',').map(s => s.trim()).filter(Boolean);
      if (current.some(c => c.toLowerCase() === name.toLowerCase())) return;
      current.push(name);
      input.value = current.join(', ');
      input.focus();
    });
  });
})();
</script>

<?php include SRC_DIR . '/footer.php';
