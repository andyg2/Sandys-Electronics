# Authoring projects (AI agent operating manual)

If you are an AI agent helping with this repository - whether you are writing a single project by hand or driving one of the multi-agent workflows - read this file before producing any project record.

The audience for the projects is **a 10-year-old building with his dad**. Default to **no soldering**, kid-readable explanations (5th grade), and immediate visible feedback (LED, OLED, servo, sound). The dad can do moderate adult-only steps (programming a sketch, configuring WiFi), but the kid should be the one wiring the breadboard and watching the magic happen.

Do NOT author projects that:

- Require soldering as part of the core build (the Double-Sided Prototype PCB is currently off the menu).
- Lean on deep adult-level circuit theory (Schmitt triggers, Sallen-Key filters, flyback SMPS topology, op-amp open-loop gain, etc.) as the WHY of the project. A kid project can USE those parts, but the explanation has to be "watch this happen", not "the small-signal model of the LM358 ...".
- Have no kid-visible output (an unloaded bench power supply, a calibration jig, etc.).

## The project-record contract

Every row in the `projects` table has these fields. The web UI renders all of them; missing fields just suppress their section.

| Field               | Required             | Format                     | Notes                                                                        |
| ------------------- | -------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `name`              | Yes                  | varchar(255) UNIQUE        | <= 60 chars preferred                                                        |
| `description`       | Yes                  | TEXT (markdown)            | Five-section template, see below                                             |
| `wiring_diagram`    | Yes                  | TEXT (Mermaid `flowchart`) | Must include a green power-source node                                       |
| `code`              | Yes                  | TEXT                       | Complete, runnable, no TODOs                                                 |
| `code_language`     | Yes                  | varchar(32)                | `cpp` / `python` / `bash` - drives highlight.js                              |
| `power_supply`      | Yes                  | varchar(255)               | One-line plain English; surfaces as the amber callout at the top of the page |
| `difficulty`        | Yes                  | varchar(32)                | `absolute beginner` / `beginner` / `intermediate` / `advanced`               |
| `learning_concepts` | No                   | JSON array of strings      | Renders as "Teaches" chips                                                   |
| `status`            | Defaults to `active` | varchar(20)                | Workflow-created projects default to `planning`                              |

Plus:

- `allocations` - one row per linked inventory item with `qty` + optional `notes`
- `project_tags` - categorical tags (auto-derived if not provided; see "Tags" below)

## Description markdown template

The description starts with a **two-paragraph kid-friendly opener** placed ABOVE all `##` sections. Then five `##` sections in order:

```markdown
**What it is**: 1-2 plain-English sentences describing what the finished thing
DOES. Use 5th-grade language. No chip names or circuit theory - just what it
looks like, sounds like, or what you do with it. Imagine a kid flipping
through the curriculum asking "but what does it actually DO?"

**Why it's fun**: 1-2 sentences explaining the wow factor, framed for a
10-year-old. Compete-with-siblings, look-cool, make-something-react, or
this-is-magic angles.

## Parts list

Bulleted list. Each bullet matches an allocated inventory item (or is an external
item like a USB cable that's intentionally out of inventory).

## Wiring notes

Push-fit instructions on top of the diagram. Mention pull-up resistors, jumper
orientation, anything the diagram doesn't capture.

## Flash it and run it

How the kid+dad actually get the thing working once it's wired. For MCU projects
this is a numbered, click-by-click walkthrough of installing the Arduino IDE,
adding the board manager (URL inlined for ESP32 projects), selecting the right
board, picking the port, setting any required passwords/constants in the sketch,
uploading, opening Serial Monitor at the right baud, and what to expect to see
when it works. For pure-analog projects (NE555 only, etc.) this is the
power-up and multimeter probe procedure - no IDE talk, just "plug in 5V, watch
the LED, probe test point 3 and confirm a square wave between 0V and 3.5V".

Always include a "Common gotchas" mini-section at the end with the 2-3 most
likely failure modes (wrong baud, missing board package, holding BOOT during
upload, wrong WiFi band).

## Talking points

3-5 conceptual nuggets the builder can use to explain what's happening as they
build. Drip-feed, not all at once. Kid-friendly framing.

## Things to change once it works

3-5 challenges that build on the working circuit. Each should be a concrete,
testable change ("make the random pause longer" - not "improve the code").

## Why this is interesting

1-2 sentences on the "wow" factor - why a 10-year-old or a beginner adult would
want to build this.
```

## Breadboard layout DSL

In addition to the high-level Mermaid wiring diagram, projects can carry a `breadboard_layout` field that paints an SVG picture of which holes the kid plugs into. The renderer (`public/assets/breadboard.js`) understands a small JSON DSL targeting a half-size, 30-column breadboard.

### Position format

`{ROW}{COL}` where ROW is `A`-`J` and COL is `1`-`30`. Examples: `E5`, `B12`, `J27`.

Power rails are named `+5V` (or `VCC`) and `GND`. They can be qualified `_T` (top) or `_B` (bottom) - the renderer guesses based on whichever rail is closer to the component it connects to. Examples: `+5V_T`, `GND_B`, or just `+5V`.

### Breadboard topology reminder

- A column on the top half (rows A-E) is one electrical node. All five A-E holes in that column are the same wire.
- A column on the bottom half (rows F-J) is a separate node from the top half (the centre gully splits them).
- The four side rails (`+5V_T`, `GND_T`, `+5V_B`, `GND_B`) each run the full length of the board.

### Components

```json
{
  "components": [
    { "type": "ic", "name": "NE555", "pin1_at": "E5", "pins": 8 },
    { "type": "led", "color": "red", "anode": "B15", "cathode": "B16" },
    { "type": "resistor", "value": "10K", "from": "B12", "to": "F12" },
    {
      "type": "capacitor",
      "value": "47uF",
      "positive": "B14",
      "negative": "GND_B"
    },
    { "type": "wire", "from": "A5", "to": "GND_T", "color": "#1f2937" },
    { "type": "button", "at": "C8", "label": "S1" }
  ],
  "external": [
    { "from": "Arduino Uno 5V", "to": "+5V" },
    { "from": "Arduino Uno GND", "to": "GND" }
  ]
}
```

- `ic` - DIP chip straddling the gully. `pin1_at` is the bottom-left pin (row E or F, choose so the chip sits across the centre). `pins` defaults to 8.
- `led` - `color` is `red` / `green` / `blue` / `yellow` / `white`. Anode and cathode are individual holes (usually adjacent columns on the same half).
- `resistor` - `value` is the readable label ("220R", "10K", "1M"). `from` and `to` are the two leg positions.
- `capacitor` - `value` and `positive` / `negative`. Electrolytics are polarised by default.
- `wire` - colour any CSS colour. Use `#ef4444` for +V wires, `#1f2937` for ground, `#f59e0b` for signal jumpers as a convention.
- `button` - 4-pin tactile at the position. `label` is a small text annotation.

### Off-board

`external` lists everything that lives OFF the breadboard - the Arduino, the USB charger, sensors that connect via dupont jumpers. Free-form text on both sides. Renders as a "Off-board:" list under the board.

### How to lay out a chip

Take an NE555 at `pin1_at: "E5"`. The chip body sits across the gully between rows E and F. Pin numbering counter-clockwise from the notch:

- Pin 1 (bottom-left): col 5 top half -> any of A5/B5/C5/D5
- Pin 2: col 6 top
- Pin 3: col 7 top
- Pin 4 (bottom-right): col 8 top
- Pin 5 (top-right): col 8 bottom -> any of F8/G8/H8/I8/J8
- Pin 6: col 7 bottom
- Pin 7: col 6 bottom
- Pin 8 (top-left): col 5 bottom

So wiring pin 4 to +5V means a wire from any A-D in col 8 to the +5V rail.

### When to include a breadboard_layout

- Always, if the project is buildable on a breadboard.
- Skip when the project is just an MCU + WiFi with no breadboard parts (e.g., the XIAO chip-temperature web page).
- Don't try to draw projects that need a perfboard / proto PCB / soldering. The DSL doesn't render those, and that audience is out of scope anyway.

### Validating a layout (`validate_breadboard.php`)

`inventory/validate_breadboard.php` mirrors the renderer geometry exactly. It catches three classes of bug that don't show up by eye until the SVG renders:

| Check            | What it flags                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `body_overlap`   | Two component bodies (resistor / cap / IC / module / button / pot / transistor / LED) whose axis-aligned bounding boxes intersect on the SVG.          |
| `hole_conflict`  | Two component legs that need the same physical breadboard hole. Real-world: only one lead fits per hole. Move one leg to a different row.              |
| `gully_crossing` | A non-IC component (resistor / cap / LED / wire) with one leg in rows A-E and the other in F-J of the **same column** - separate nodes, no connection. |

Use it three ways:

```bash
# Validate a stored project from the DB
php inventory/validate_breadboard.php 69

# Audit the whole corpus
php inventory/validate_breadboard.php --all

# Validate a layout JSON via stdin (handy from a workflow agent)
cat proposed_layout.json | php inventory/validate_breadboard.php --json --format=json
```

Add `--fix` to greedy hill-climb a repair: at each step the tool tries every alternative row (within the same column-half, so the circuit is unchanged) for every leg of every component currently involved in an issue and picks the single swap that drops the issue count the most. Add `--apply` to write the cleaned layout back to the DB:

```bash
php inventory/validate_breadboard.php --fix 69          # dry-run, show proposed moves
php inventory/validate_breadboard.php --apply --all     # fix every project and write back
```

This is the fastest way to clean up most layout collisions because rows A-E share an electrical node and so do F-J - moving a leg between them is electrically free. ~80% of corpus issues evaporate from this alone; what remains usually needs a structural change (different column, fewer components, or a wire bridge).

JSON output mode (`--format=json`) returns `{ "issues": [...], "ok": true|false }` and exits non-zero if any issue is found, so a workflow agent can iterate until it's clean:

```js
const proposed = JSON.stringify(layout);
const out = require("child_process")
  .execSync("php inventory/validate_breadboard.php --json --format=json", {
    input: proposed,
  })
  .toString();
const { issues, ok } = JSON.parse(out);
if (!ok) /* feed issues back to the agent and ask it to fix */ ;
```

**Rule of thumb when authoring a new layout:** keep component bodies in rows D/E (top half) and F/G (bottom half) so they cluster around the gully, route rail wires from rows A and J, and never let two leg positions collide. `validate_breadboard.php` flags the rest.

## Mermaid wiring diagram conventions

- Use `flowchart` syntax (`LR` or `TD`). Group the MCU as a subgraph; group the breadboard as a subgraph if there is significant on-breadboard wiring.
- **Always include a power-source node styled in the green `pwr` classDef.** The power node must visibly connect to whatever consumes power (USB-B port, VIN, JST connector, etc.).
- Use this colour scheme exactly so diagrams render consistently across the corpus:

```txt
classDef pwr  fill:#10b981,color:#fff,stroke:#047857
classDef pin  fill:#1e6fd6,color:#fff,stroke:#003c80
classDef gnd  fill:#333,color:#fff,stroke:#000
classDef sensor fill:#dbeafe,stroke:#1e40af,color:#1e3a8a
classDef out  fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d
classDef res  fill:#fef3c7,stroke:#b45309,color:#78350f
classDef mod  fill:#e9d5ff,stroke:#7c3aed,color:#581c87
```

Apply with `class NODE_ID classname` lines after the classDefs.

## Power supply rule

`power_supply` is required and surfaces as the amber callout at the top of the project page. One line of plain English. Examples:

- `USB cable from a laptop (5V via the Uno's USB-B port)`
- `USB-C cable from a laptop or USB charger to the XIAO (5V)`
- `4xAA pack into Vin, separated grounds tied together`

The wiring diagram **must** reflect the power source as a node styled with the `pwr` classDef.

## Code rules

- Complete and runnable - no TODOs, no pseudocode, no `// ...` placeholders.
- For Arduino: include `setup()` + `loop()` with `pinMode` + everything else needed to upload and run.
- For ESP32 over WiFi: hardcode `SSID = "GeeFam"` and use the placeholder string `"PASSWORD_HERE"` for the password.
- Pin numbers in the code MUST match pin numbers in the wiring diagram.
- LEDs ALWAYS need a current-limiting resistor (220R-470R). Allocate one per LED.
- ESP32 boards are 3.3V GPIO. Arduino Uno is 5V GPIO. Pick the right MCU for 5V-only modules.

## Item name conventions (allocations)

The `item_name` field in each allocation MUST match an entry in `items.name` exactly - same case, same punctuation, same parenthesised qualifiers.

Common gotchas (these will silently drop unless you fix them):

| Wrong                                                   | Right                                              |
| ------------------------------------------------------- | -------------------------------------------------- |
| `Resistor 220 Ohm`, `220R resistor`, `220 ohm resistor` | `Resistor 220R (1/8W 1%)`                          |
| `Yellow LED`                                            | `LED 5mm Yellow`                                   |
| `ESP32 NodeMCU`                                         | `ESP32 NodeMCU-32S`                                |
| `XIAO ESP32-C3`                                         | `Seeed XIAO ESP32-C3`                              |
| `Breadboard`, `Breadboard 830-point`                    | `Breadboard 4.5x9.5cm (~400 tie-points)`           |
| `Jumper Wires M-M`, `DuPont jumpers`                    | `Jumper Wire M-M, 40pc`                            |
| `SG90 Servo`                                            | `SG90 Servo (9g micro)`                            |
| `8x8 LED Matrix`                                        | `8x8 LED Dot-matrix Display (red)`                 |
| `4-digit Digital Tube`                                  | `4-digit 7-segment Display Module`                 |
| `MPU-6500 IMU`                                          | `MPU-6500 6-Axis IMU (GY-6500)`                    |
| `0.96 OLED`                                             | `0.96" OLED Display (I2C)`                         |
| `2-ch Songle relay board`                               | `2-channel Songle relay module`                    |
| `HC-SR04 Ultrasonic Module`                             | `HC-SR04 Ultrasonic Distance Sensor`               |
| `Angle Tilt Switch Sensor`                              | `Angle / Tilt Switch (ball)`                       |
| `TP4056 Charging Module`                                | `18650 Charger / Protection Board (TP4056, USB-C)` |

The full alias map lives at the top of `inventory/_insert_generated_projects.php`. Add new aliases there as you discover them.

### Items intentionally NOT in inventory

These commonly appear in project descriptions but should NOT be put in `allocations`. Mention them in the description's parts list instead.

- USB cables of any flavour (assumed to come with the boards)
- 18650 cells (only the TP4056 charger module is stocked)
- 12V LED strips, wall warts, fans (outside the kit)
- Ceramic capacitors (only electrolytic caps are stocked)
- Heat-shrink tubing, electrical tape

## Tags

Project tags are categorical (`OLED`, `WiFi`, `MQTT`, `Game`, `Servo`, ...) and drive the filter cloud on `/projects.php`.

- If you provide `tags: [...]` on a project, those are used verbatim.
- If you don't, `_insert_generated_projects.php` auto-derives them via `derive_project_tags_from_items()` in `inventory/src/helpers.php` - which walks the allocated items' subcategories through a known mapping and keyword-scrapes the name / description / power_supply.

Workflow agents don't currently emit `tags` explicitly - auto-derivation runs at insert time and is good enough.

## How to run the multi-agent workflows

The two complete workflows in `inventory/workflows/` are designed for the Claude Code Workflow tool with the Anthropic API.

### `generate_projects.workflow.js`

Original 20-project run. Six brainstorm lenses fan out in parallel, a shortlist agent picks 22-26, each shortlisted idea pipelines through Author → Critique → Refine independently, a judge picks the final 20 for variety.

```txt
args:
  inventory: <text snapshot from _generate_inventory_snapshot.php>

returns:
  { projects: [...], count: N, selection_rationale: "..." }
```

Run via `Workflow({scriptPath: "inventory/workflows/generate_projects.workflow.js", args: {inventory: "..."}})`.

### `fill_gaps.workflow.template.js` + `fill_gaps.workflow.js`

Coverage-gap pipeline. Takes a list of "target" items (boards / modules / sensors with no allocations yet) and authors one project per target. Three-stage pipeline (Author → Critique → Refine), no brainstorm, shortlist, or judge.

The template has `__INVENTORY__` and `__TARGETS__` placeholders. To rebuild:

```bash
# 1. Build the inventory snapshot
php inventory/_generate_inventory_snapshot.php > C:/tmp/inv.txt

# 2. Build the targets JSON (uncovered boards/modules/sensors)
php -r '
require "inventory/src/db.php";
$rows = db()->query("
    SELECT i.category, i.subcategory, i.name
      FROM items i
      LEFT JOIN allocations a ON a.item_id = i.id
     WHERE i.category IN (\"Board\",\"Sensor\",\"Module\")
  GROUP BY i.id
    HAVING COUNT(DISTINCT a.project_id) = 0
  ORDER BY i.category, i.subcategory, i.name
");
file_put_contents("C:/tmp/targets.json", json_encode($rows->fetchAll(), JSON_PRETTY_PRINT));
'

# 3. Substitute placeholders (see _build.php pattern in earlier commits)
# 4. Run Workflow({scriptPath: "inventory/workflows/fill_gaps.workflow.js"})
```

## After a workflow returns

```bash
# 1. Extract the projects array from the task output JSON
php -r '
  $d = json_decode(file_get_contents($argv[1]), true);
  file_put_contents($argv[2], json_encode($d["result"], JSON_PRETTY_PRINT));
' /path/to/task.output C:/tmp/projects.json

# 2. Insert
cd inventory
php _insert_generated_projects.php C:/tmp/projects.json
```

`_insert_generated_projects.php` handles:

- Name collisions (suffixes `(v2)`, `(v3)`, ...)
- Duplicate `(item, project)` allocations (sums qtys via `ON DUPLICATE KEY UPDATE`)
- Item-name aliasing via the `$ITEM_ALIASES` map at the top
- Skipping items intentionally outside inventory (USB cables, etc.)
- Tag derivation when `tags` is not present on the project

After insert, hit a few generated projects in the browser to verify Mermaid renders, code highlights, and allocations resolved.

## When to extend the schema

The schema captures the core data. Don't add fields for things that should live inline in the description (e.g., "BOM with prices") - keep those in the markdown.

DO add fields if you need a new user-facing affordance the description can't express:

- `wiring_diagram` and `code` were separate from `description` because they need structured access for syntax highlighting, Mermaid rendering, and the copy button.
- `power_supply` was promoted because it deserved a prominent callout.
- `difficulty` and `learning_concepts` were promoted so they could render as badges and chips, not buried prose.

When extending:

1. Update `seed.php` `CREATE TABLE projects` for fresh installs.
2. Write a one-shot `_migrate_<field>.php` (delete after running) for the live DB.
3. Update `public/project.php` (render) and `public/project_edit.php` (form handler).
4. Update `_insert_generated_projects.php` and the export script to round-trip the new field.
5. Update `examples/projects.json` by re-running the export.

## Sanity checks after a batch insert

```bash
# 1. Every allocation resolves to a real inventory row
php -r '
require "inventory/src/db.php";
$bad = db()->query("
  SELECT p.name, COUNT(*) c FROM allocations a
   JOIN projects p ON p.id = a.project_id
   LEFT JOIN items i ON i.id = a.item_id
  WHERE i.id IS NULL GROUP BY p.id
")->fetchAll();
echo $bad ? json_encode($bad, JSON_PRETTY_PRINT) . PHP_EOL : "OK: no orphan allocations" . PHP_EOL;
'

# 2. Coverage gaps in Board / Sensor / Module
php -r '
require "inventory/src/db.php";
$gaps = db()->query("
  SELECT i.category, i.name FROM items i
   LEFT JOIN allocations a ON a.item_id = i.id
  WHERE i.category IN (\"Board\",\"Sensor\",\"Module\")
  GROUP BY i.id HAVING COUNT(a.project_id) = 0
")->fetchAll();
echo $gaps ? json_encode($gaps, JSON_PRETTY_PRINT) . PHP_EOL : "OK: full coverage" . PHP_EOL;
'

# 3. Every project has the required fields
php -r '
require "inventory/src/db.php";
$missing = db()->query("
  SELECT id, name FROM projects
   WHERE wiring_diagram IS NULL OR code IS NULL OR power_supply IS NULL OR difficulty IS NULL
")->fetchAll();
echo $missing ? json_encode($missing, JSON_PRETTY_PRINT) . PHP_EOL : "OK: all projects complete" . PHP_EOL;
'
```

## TL;DR for authoring a single project

1. Pick an inventory item (or set of items) to centre on.
2. Write a concrete, kid-engaging one-sentence goal.
3. Pick the right MCU for the voltage levels involved.
4. Draft the wiring diagram first (Mermaid `flowchart`, with the green power node).
5. Write the code so pin numbers match the diagram.
6. Write the description sections in the template order.
7. State the `power_supply` as one clear line.
8. List allocations using **exact** inventory names.
9. Pick a `difficulty` consistent with the code complexity.
10. List 1-4 `learning_concepts` that the project actually teaches.
