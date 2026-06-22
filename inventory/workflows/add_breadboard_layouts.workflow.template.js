export const meta = {
  name: 'add-breadboard-layouts',
  description: 'Generate a breadboard_layout JSON for each existing project that has breadboard parts',
  phases: [{ title: 'Layout' }],
}

const PROJECTS = __PROJECTS__

const DSL_GUIDE = [
  'BREADBOARD LAYOUT DSL',
  '',
  'Target board: half-size, 30 columns (1-30), rows A-J. Top half rows A-E are one electrical node per column;',
  'bottom half rows F-J are another node per column; the centre gully separates them.',
  'Power rails: +5V and GND, available on both top (_T) and bottom (_B) sides of the board.',
  '',
  'Position format: "{ROW}{COL}" e.g. "E5", "B12", "J27". For rails: "+5V", "GND", or qualified "+5V_T", "GND_B".',
  'The renderer auto-picks top or bottom rail based on which is closer to the other end of the wire.',
  '',
  'COMPONENT TYPES (always use "type" + the specific fields shown):',
  '',
  '- ic: { type:"ic", name, pin1_at, pins }',
  '    DIP chip straddles the gully. pin1_at is the BOTTOM-LEFT pin (in row E or F).',
  '    Standard placement: pin 1 in row E (so chip body sits in cols pin1.col..pin1.col+pins/2-1 with',
  '    pins on rows E and F). DIP-8: pin1_at "E5" -> pin 1 at E5 (top-half col 5), pin 8 at F5.',
  '    Pin counting: bottom-left = 1, counter-clockwise from notch.',
  '',
  '- led: { type:"led", color, anode, cathode }',
  '    color is red / green / blue / yellow / white. anode is the LONG leg (+), cathode the short (-).',
  '    Anode and cathode should be in adjacent columns in the same half.',
  '',
  '- resistor: { type:"resistor", value, from, to }',
  '    value is the human label ("220R", "10K", "4.7K", "1M").',
  '',
  '- capacitor: { type:"capacitor", value, positive, negative, polarised? }',
  '    Set polarised:false for ceramic caps. Default polarised:true (electrolytics).',
  '    IMPORTANT: do NOT place capacitor legs in the same columns as a nearby IC body - the cap bulb',
  '    renders above the legs and will overlap the chip. Route the signal out via a small wire jumper',
  '    to a free column first, then drop the cap there.',
  '',
  '- wire: { type:"wire", from, to, color? }',
  '    Colour convention: red ("#ef4444") for +V power, dark ("#1f2937") for GND, yellow ("#f59e0b")',
  '    for signal jumpers, sky-blue ("#0ea5e9") for short data hops.',
  '    CRITICAL: never emit a wire between two holes that are already on the SAME ELECTRICAL NODE.',
  '    The breadboard\'s internal copper strip already connects them, so the jumper is redundant',
  '    visual clutter that wastes an allocated jumper. A wire is redundant if:',
  '      - both endpoints are in the same column AND same half (e.g. A5 -> E5, B12 -> C12)',
  '      - both endpoints are on the same rail (e.g. GND_T -> GND_T@21, or +5V_B -> +5V_B)',
  '    Valid wires bridge DIFFERENT nodes: across columns (A5 -> A8), across the gully (E12 -> F12),',
  '    or from a hole to a rail (B4 -> GND_T).',
  '    SHORTEST PATH RULE for rail wires: a wire that connects a rail to a grid hole must use the',
  '    row CLOSEST to that rail in the relevant column-half. The top rails (+5V_T / GND_T) are',
  '    closest to row A, so a wire to a top rail should land in row A by default. The bottom rails',
  '    (+5V_B / GND_B) are closest to row J, so a wire to a bottom rail should land in row J.',
  '    Only fall back inward (B/I, then C/H, etc.) if the closer row is already occupied by another',
  '    component\'s leg. Never run a long diagonal wire from a far row when a closer free row exists.',
  '',
  '- button: { type:"button", at, label? }',
  '    4-pin tactile. `at` is the TOP-LEFT pin. The other 3 pins auto-render at +2 cols across and 2',
  '    rows down. Stagger your button so the body straddles two columns in the same half.',
  '',
  '- transistor: { type:"transistor", at, name, pinout? }',
  '    TO-92 with three legs. `at` is the centre (base) pin. pinout default "CBE" (left to right',
  '    looking at the flat side, e.g. BC547). For BC557 (PNP) use "EBC".',
  '',
  '- pot / trimmer: { type:"pot", at, value?, label? }',
  '    Three pins, `at` is the centre wiper. Pins flank at +/- 1 column.',
  '',
  '- module: { type:"module", name, pins:[{label,at},...] }',
  '    Generic green-PCB sensor module (DHT11, HC-SR04, HC-SR501, KY-*, etc.). Lay each pin out',
  '    on the breadboard and label it ("VCC", "GND", "DAT", "TRIG", "ECHO", "OUT", ...).',
  '',
  '- servo: { type:"servo", name, signal, power, ground }',
  '    Three positions (sig / +5V / GND). The motor itself sits off-board (mention in `external`).',
  '',
  'OFF-BOARD:',
  '  external:[{from, to, item_id?}, ...] lists every connection that lives outside the breadboard - the',
  '  Arduino Uno, NodeMCU-32S, power supplies, mains-side of a relay, big modules like the',
  '  4-digit display. Use plain English: { "from": "Arduino Uno pin 9", "to": "B5", "item_id": 1 }.',
  '',
  'EVERY ENTRY MUST CARRY AN item_id (CRITICAL):',
  '  Each component AND each external entry must have an item_id field set to one of the',
  '  ALLOCATED_ITEMS ids listed in the prompt. Choose the id that represents the part the entry',
  '  depicts:',
  '    - wire        -> the jumper-wire allocation id (M-M or F-M, pick whichever role fits)',
  '    - button      -> the tactile-button allocation id',
  '    - led         -> the LED allocation id of that color',
  '    - resistor    -> the resistor allocation id of that value',
  '    - capacitor   -> the capacitor allocation id of that value',
  '    - transistor  -> the transistor/regulator allocation id (by part number)',
  '    - ic          -> the IC allocation id (e.g. NE555)',
  '    - module      -> the module/sensor allocation id (e.g. DHT11, MB102, OLED)',
  '    - servo       -> the servo allocation id',
  '    - pot/trimmer -> the potentiometer allocation id',
  '  For externals: if the "from" text refers to an allocated item (e.g. "Arduino Uno 5V" or',
  '  "NodeMCU GPIO 4" or "ESP32-CAM GND"), set item_id to that allocation id.',
  '  If the external refers to something OUTSIDE inventory (a 12V wall-wart, a USB cable, a',
  '  laptop, a 9V battery, a phone charger, "same supply ground"), set item_id to null.',
  '  Components NEVER use null - if the project has no jumpers allocated, do not emit wires.',
  '',
  'PLACEMENT GUIDELINES:',
  '- LEDs ALWAYS get a series resistor.',
  '- For Arduino Uno / ESP32 NodeMCU-32S / XIAO ESP32-C3: put the MCU in `external` and connect',
  '  named pins to breadboard positions. Do NOT try to render those MCU boards on the breadboard.',
  '- Keep components spread out - aim to use 15-25 columns of the 30 available so the kid can read it.',
  '- Cap legs and IC bodies must not share columns - route a wire jumper out to clear space first.',
  '- Power flows: rail -> jumper -> component leg. Use red for +V wires, dark for GND.',
  '- It is fine to draw "off-board" connections (sensor modules, relay outputs) as short module',
  '  glyphs sitting in their own column block.',
  '',
  'SKIP CRITERIA:',
  '- If the project has no breadboard parts at all (e.g., just an MCU + USB cable showing a web page),',
  '  return skip:true with a brief skip_reason. Do not invent a layout for an MCU-only project.',
].join('\n')

const SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    skip: { type: 'boolean' },
    skip_reason: { type: 'string' },
    layout: {
      type: 'object',
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type:    { type: 'string' },
              item_id: { type: 'integer' },
            },
            required: ['type', 'item_id'],
          },
        },
        external: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from:    { type: 'string' },
              to:      { type: 'string' },
              item_id: { type: ['integer', 'null'] },
            },
            required: ['from', 'to', 'item_id'],
          },
        },
      },
    },
  },
  required: ['id', 'skip'],
}

phase('Layout')

const results = await parallel(PROJECTS.map(p => () => agent(
  'You are authoring a breadboard layout for an existing electronics project for a 10-year-old. Read the project carefully, work out which parts plug into the breadboard, and produce the layout JSON.\n\n' +
  'PROJECT id:' + p.id + '\n' +
  'NAME: ' + p.name + '\n' +
  'DIFFICULTY: ' + (p.difficulty || 'beginner') + '\n' +
  'POWER SUPPLY: ' + (p.power_supply || '(unspecified)') + '\n\n' +
  'ALLOCATED_ITEMS (these are the ONLY item_ids you may use):\n' +
  (p.allocations || []).map(a => `  - item_id=${a.item_id}  qty=${a.qty}  ${a.item_name}${a.notes ? '  (' + a.notes + ')' : ''}`).join('\n') + '\n\n' +
  'DESCRIPTION (the wiring notes section is the most relevant):\n' + (p.description || '').slice(0, 4500) + '\n\n' +
  DSL_GUIDE + '\n\n' +
  'OUTPUT:\n' +
  '  Return JSON with id=' + p.id + '. Either:\n' +
  '    skip:true + skip_reason ("No breadboard parts - just MCU+USB", etc.), OR\n' +
  '    skip:false + a complete layout {components:[...], external:[...]}.\n\n' +
  'Quality bar:\n' +
  '- EVERY component has item_id set to one of the ALLOCATED_ITEMS ids above. No exceptions.\n' +
  '- EVERY external has item_id set to an allocated id OR explicitly null (for off-inventory wall-warts, cables).\n' +
  '- Every allocated breadboard part appears in components (or, for MCU boards, in external).\n' +
  '- LED current-limiting resistors actually allocated AND drawn in series.\n' +
  '- Cap legs do not share columns with IC bodies.\n' +
  '- All wires have colours per the convention (red/dark/yellow/sky-blue).\n' +
  '- Component placement spread across ~15-25 columns.\n\n' +
  'VALIDATION (mandatory before returning):\n' +
  '  1. Save your proposed layout JSON to /tmp/bb_layout_' + p.id + '.json with the Write tool\n' +
  '     (just the layout object: {"components":[...],"external":[...]}).\n' +
  '  2. Run via Bash:\n' +
  '     php C:/Users/Andy/Edge-Devices/inventory/validate_breadboard.php --fix --format=json --json < /tmp/bb_layout_' + p.id + '.json\n' +
  '     The validator returns {before, after, moves, remaining_issues, layout}. It auto-fixes minor\n' +
  '     row collisions via brute force; `layout` is the cleaned version.\n' +
  '  3. If after === 0: return that cleaned `layout` field as your output.\n' +
  '  4. If after > 0: read the `remaining_issues` and REVISE structurally (different columns,\n' +
  '     delete duplicate wires, move resistor or cap bodies out of an IC footprint, etc.). Save\n' +
  '     the revision, validate again. Up to 4 attempts.\n' +
  '  5. The validator handles row swaps for you. Do not waste time micro-tuning rows; focus on\n' +
  '     column placement and component count.',
  { label: 'layout:' + p.name.slice(0, 30), phase: 'Layout', schema: SCHEMA }
)))

return { results: results.filter(Boolean), count: results.filter(Boolean).length }
