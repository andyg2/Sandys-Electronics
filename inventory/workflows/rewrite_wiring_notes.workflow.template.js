export const meta = {
  name: 'rewrite-wiring-notes',
  description: 'Rewrite the ## Wiring notes section of each project in kid-friendly language with embedded 100x100 part photos',
  phases: [{ title: 'Rewrite' }],
}

const PROJECTS = __PROJECTS__

const STYLE_GUIDE = [
  'AUDIENCE: a 10-year-old building this with a parent. NO soldering. Reads at 5th-grade level.',
  '',
  'NEVER use these terms WITHOUT translating them in plain English the first time they appear:',
  '  VCC (just say "power input" / "5V in")',
  '  VIN ("the pin that gives back the 5V from the USB cable")',
  '  GND ("the 0V side - ground")',
  '  anode / cathode (say "long leg" / "short leg" instead)',
  '  rail ("the long red/blue strip running down the side of the breadboard")',
  '  PWM ("a fast on-off signal" - only if relevant)',
  '  GPIO ("pin" / "the pin marked Dx")',
  '',
  'NEVER use these phrases at all:',
  '  "raw rail coming back out of"',
  '  "swings up to" / "swings between"',
  '  "level shifter"',
  '  "resistor divider"',
  '  "high-impedance"',
  '  "open-drain"',
  '  "active LOW" / "active HIGH" (say "fires when the button is pressed" instead)',
  '',
  'PIN LABEL RULES (CRITICAL):',
  'When you reference a microcontroller pin, ALWAYS use the silkscreen label printed on that specific board.',
  '',
  '  Arduino Uno R3: silkscreen labels D0-D13 and A0-A5 match the code numbers exactly. Just say "D9", "A0", etc.',
  '',
  '  ESP32 NodeMCU-32S: silkscreen says D2, D4, D5, D12-D15, D18, D19, D21, D22, D23, D25-D27, D32-D35 -',
  '    these MATCH the GPIO numbers. Pins D34/D35/VP/VN are input-only. Use the silkscreen label e.g. "the pin marked D13".',
  '',
  '  XIAO ESP32-C3: silkscreen labels are D0-D10. They do NOT match GPIO numbers:',
  '    D0=GPIO2, D1=GPIO3, D2=GPIO4, D3=GPIO5, D4=GPIO6, D5=GPIO7,',
  '    D6=GPIO21 (TX), D7=GPIO20 (RX), D8=GPIO8, D9=GPIO9, D10=GPIO10.',
  '    Always use the silkscreen label (e.g. "the pin marked D4"), with the GPIO in parentheses on first mention.',
  '',
  '  NodeMCU V3 (ESP8266, CH340G): silkscreen labels D0-D8 do NOT match GPIO numbers:',
  '    D0=GPIO16, D1=GPIO5, D2=GPIO4, D3=GPIO0, D4=GPIO2, D5=GPIO14, D6=GPIO12, D7=GPIO13, D8=GPIO15.',
  '    Always say "the pin marked Dx" where the code uses the matching GPIO. If the project uses the NodeMCU V3',
  '    I/O Shield, the shield breaks each labeled pin out into a 3-pin column: outer row = signal, middle row = +5V,',
  '    inner row = GND. Tell the kid to plug 3-wire cables straight into one column.',
  '',
  '  ESP-01S WiFi Module: only GPIO 0, GPIO 2, RX (GPIO 3), TX (GPIO 1) are usable. No D-labels. Flash with CP2102 (GPIO0 pulled to GND on power-up).',
  '',
  '  ESP32-CAM (bare or with MB programmer base): silkscreen labels around the header are mostly GPIO numbers. Note that GPIO 4 drives the onboard flashlight LED, and GPIO 0 is the boot-mode pin.',
  '',
  'EMBEDDED IMAGES:',
  'At the start of each step that introduces a new physical part, embed a 100x100 floated thumbnail of that part.',
  'Use this exact HTML syntax (each img on its own paragraph in the markdown):',
  '',
  '  <img src="/uploads/HASH.EXT" alt="Item Name" style="width:100px;height:100px;object-fit:contain;float:right;margin:0 0 8px 16px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;padding:4px;">',
  '',
  'For two parts shown together (e.g. LED + resistor): use a wrapping div with two imgs:',
  '',
  '  <div style="float:right;display:flex;gap:8px;margin:0 0 8px 16px;"><img src="/uploads/A" alt="..." style="width:100px;height:100px;object-fit:contain;border:1px solid #e5e7eb;border-radius:6px;background:#fff;padding:4px;"><img src="/uploads/B" alt="..." style="width:100px;height:100px;object-fit:contain;border:1px solid #e5e7eb;border-radius:6px;background:#fff;padding:4px;"></div>',
  '',
  'After a floated block, insert a clear line where needed (between steps) so the next step starts below it:',
  '',
  '  <div style="clear:both;"></div>',
  '',
  'If an allocation has image_path: null, DO NOT emit an img tag for it. Just describe the part in words.',
  '',
  'SECTION STRUCTURE:',
  '  ## Wiring notes',
  '  [floated img of the MCU board]',
  '  **Quick glossary - words you will see on the [board name] board:** (bullet list of 3-6 terms)',
  '  <div style="clear:both;"></div>',
  '  **Step 1 - <short title>.** (with floated img of the relevant part if it has one)',
  '  [bullets connecting each wire/pin]',
  '  [one or two sentences on what this step does or why it matters]',
  '  <div style="clear:both;"></div>',
  '  **Step 2 - ...** (and so on through every wiring step)',
  '  Final step or "tune" or "warmup" note as needed.',
  '',
  'WHY-EXPLANATIONS:',
  '  Non-obvious parts (current-limit resistor, decoupling cap, optocoupler isolation,',
  '  pulldowns/pullups) get a one-paragraph "Why this matters" in plain words.',
  '',
  'TONE:',
  '  Direct, warm, occasional admission of "this is a tricky one". No emojis. No em or en dashes - just hyphens.',
].join('\n')

const SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    wiring_notes: { type: 'string' },
  },
  required: ['id', 'wiring_notes'],
}

phase('Rewrite')

const results = await parallel(PROJECTS.map(p => () => agent(
  'You are rewriting the ## Wiring notes section of an existing electronics project for a 10-year-old. The goal is to make the section kid-readable and to embed 100x100 photos of each part right next to the step that uses it.\n\n' +
  'PROJECT id: ' + p.id + '\n' +
  'NAME: ' + p.name + '\n' +
  'DIFFICULTY: ' + (p.difficulty || 'beginner') + '\n' +
  'POWER SUPPLY: ' + (p.power_supply || '(unspecified)') + '\n\n' +
  'ALLOCATED PARTS (with item_id and image_path; image_path is null if no photo on file):\n' +
  (p.allocations || []).map(a =>
    '  - item_id=' + a.item_id + '  ' + a.item_name + '  (qty=' + a.qty + ', image=' + (a.image_path ? '/uploads/' + a.image_path : 'NONE') + ')'
  ).join('\n') + '\n\n' +
  'BREADBOARD LAYOUT (components and externals - this is the source of truth for which pin connects to what):\n' +
  JSON.stringify(p.layout || {}, null, 2).slice(0, 4500) + '\n\n' +
  'CURRENT ## Wiring notes section (rewrite this entirely - do not copy it verbatim):\n' +
  (p.current_wiring || '(empty)').slice(0, 3000) + '\n\n' +
  'STYLE GUIDE:\n' + STYLE_GUIDE + '\n\n' +
  'OUTPUT:\n' +
  '  Return JSON with id=' + p.id + ' and wiring_notes set to the COMPLETE replacement markdown for the section,\n' +
  '  starting with the literal heading "## Wiring notes" on the first line. Do NOT include any sections that come\n' +
  '  before or after Wiring notes (no kid opener, no Parts list, no Flash, no Talking points). Just the\n' +
  '  Wiring notes section.\n\n' +
  'Quality bar:\n' +
  '- Every wiring step that introduces a physical part has a floated 100x100 img tag (if the part has an image_path).\n' +
  '- Every pin reference uses the silkscreen label appropriate to the board in this project.\n' +
  '- No jargon left untranslated.\n' +
  '- Numbered Step 1, Step 2, ... format.\n' +
  '- Quick glossary at the top.\n' +
  '- Long-leg / short-leg / white-stripe language for polarized parts.\n' +
  '- Non-obvious parts get a one-paragraph "Why this matters" explanation.',
  { label: 'rewrite:#' + p.id, phase: 'Rewrite', schema: SCHEMA }
)))

return { results: results.filter(Boolean), count: results.filter(Boolean).length }
