export const meta = {
  name: 'generate-edge-device-projects',
  description: 'Brainstorm + shortlist + author + critique + refine + select 20 beginner electronics projects',
  phases: [
    { title: 'Brainstorm' },
    { title: 'Shortlist' },
    { title: 'Author' },
    { title: 'Critique' },
    { title: 'Refine' },
    { title: 'Select' },
  ],
}

const INVENTORY = args.inventory

const CONVENTIONS = [
  'Each project record must contain:',
  '- name: short, distinctive (<= 60 chars). Avoid duplicating any existing project.',
  '- power_supply: one-line plain-English description of how power enters the project. Examples:',
  '    "USB cable from laptop (5V via the Uno USB-B port)"',
  '    "USB-C cable from laptop to the XIAO (5V)"',
  '    "USB cable to the Uno, plus 4xAA pack into Vin for the relay (separated grounds tied together)"',
  '- description: markdown body. MUST start with a kid-friendly two-paragraph opener BEFORE any ## section:',
  '    **What it is**: 1-2 plain-English sentences describing what the finished thing DOES. 5th-grade language. No chip names or theory - just what it looks like, sounds like, or what you do with it.',
  '    **Why it is fun**: 1-2 sentences on the wow factor for a 10-year-old. Compete-with-siblings, look-cool, this-is-magic angles.',
  '  Then five ## sections in order:',
  '    ## Parts list',
  '    ## Wiring notes',
  '    ## Flash it and run it   (IDE setup OR multimeter probe procedure, with Common gotchas)',
  '    ## Talking points',
  '    ## Things to change once it works',
  '    ## Why this is interesting',
  '- wiring_diagram: Mermaid flowchart source. MUST include a power-source node styled with the pwr classDef.',
  '  Use this colour scheme exactly:',
  '    classDef pwr  fill:#10b981,color:#fff,stroke:#047857',
  '    classDef pin  fill:#1e6fd6,color:#fff,stroke:#003c80',
  '    classDef gnd  fill:#333,color:#fff,stroke:#000',
  '    classDef sensor fill:#dbeafe,stroke:#1e40af,color:#1e3a8a',
  '    classDef out  fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d',
  '    classDef res  fill:#fef3c7,stroke:#b45309,color:#78350f',
  '    classDef mod  fill:#e9d5ff,stroke:#7c3aed,color:#581c87',
  '  Use class NODE_ID classname to apply.',
  '- code: complete, runnable code. NO TODOs. Includes setup() and loop() for Arduino sketches.',
  '- code_language: cpp for Arduino, python for MicroPython.',
  '- difficulty: absolute beginner | beginner | intermediate',
  '- allocations: array of {item_name (EXACT match to INVENTORY), qty: positive int, notes: brief role}.',
  '- learning_concepts: 1-4 short concept names taught by this project.',
  '',
  'CONSTRAINTS:',
  '- Audience: a 10-year-old building with his dad. NO soldering. Visible/audible/movement feedback required - no silent bench tools.',
  '- For ESP32 WiFi: hardcode SSID = "GeeFam", placeholder string "PASSWORD_HERE" for password.',
  '- LEDs ALWAYS need a current-limiting resistor (220R-470R). Allocate one resistor per LED.',
  '- A breadboard and DuPont jumpers must be allocated for almost every project.',
  '- ESP32 boards are 3.3V GPIO; Arduino Uno is 5V GPIO. Pick correctly for 5V-only sensors.',
  '- 2-channel Songle relay: low-voltage DC switching only (LED strip, fan, buzzer). No mains.',
  '- Pin numbers in code MUST match pin numbers in the wiring diagram.',
  '',
  'Project #1 "Reaction-time game" already exists (Uno + button + LED). Do not duplicate.',
].join('\n')

const IDEAS_SCHEMA = {
  type: 'object',
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          one_liner: { type: 'string' },
          difficulty: { type: 'string', enum: ['absolute beginner', 'beginner', 'intermediate'] },
          core_parts: { type: 'array', items: { type: 'string' } },
          wow_factor: { type: 'string' },
        },
        required: ['name', 'one_liner', 'difficulty', 'core_parts', 'wow_factor'],
      },
    },
  },
  required: ['ideas'],
}

const SHORTLIST_SCHEMA = {
  type: 'object',
  properties: {
    ideas: {
      type: 'array',
      maxItems: 26,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          one_liner: { type: 'string' },
          difficulty: { type: 'string', enum: ['absolute beginner', 'beginner', 'intermediate'] },
          core_parts: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
        },
        required: ['name', 'one_liner', 'difficulty', 'core_parts', 'rationale'],
      },
    },
  },
  required: ['ideas'],
}

const PROJECT_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', maxLength: 200 },
    power_supply: { type: 'string', maxLength: 250 },
    description: { type: 'string' },
    wiring_diagram: { type: 'string' },
    code: { type: 'string' },
    code_language: { type: 'string' },
    difficulty: { type: 'string', enum: ['absolute beginner', 'beginner', 'intermediate'] },
    allocations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          item_name: { type: 'string' },
          qty: { type: 'integer', minimum: 1 },
          notes: { type: 'string' },
        },
        required: ['item_name', 'qty'],
      },
    },
    learning_concepts: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'power_supply', 'description', 'wiring_diagram', 'code', 'code_language', 'difficulty', 'allocations'],
}

const CRITIQUE_SCHEMA = {
  type: 'object',
  properties: {
    issues: { type: 'array', items: { type: 'string' } },
    quality_score: { type: 'integer', minimum: 0, maximum: 10 },
    needs_refinement: { type: 'boolean' },
    refinement_guidance: { type: 'string' },
  },
  required: ['issues', 'quality_score', 'needs_refinement'],
}

const FINALISTS_SCHEMA = {
  type: 'object',
  properties: {
    selected_indices: { type: 'array', items: { type: 'integer' }, maxItems: 20 },
    rationale: { type: 'string' },
  },
  required: ['selected_indices', 'rationale'],
}

const LENSES = [
  {
    key: 'sensor-showcase',
    focus: 'A single sensor as the protagonist with immediate visible feedback. Pick varied sensors (distance, motion, hall, IR, touch, IMU, pressure, microphone, soil). Output via LED, OLED, or servo. Show the sensor doing what it does best.',
  },
  {
    key: 'visual-displays',
    focus: 'Use the OLED, LCD 1602, 8x8 LED matrix, or 4-digit 7-segment as the centerpiece. Examples: stopwatch, scrolling-message badge, dice, retro pixel art, weather display, scoreboard, mood meter, custom font. Be specific.',
  },
  {
    key: 'interactive-games',
    focus: 'Games kids want to play repeatedly. Examples: Simon Says, electronic dice, memory game, tilt labyrinth, hot-cold treasure hunt, two-player tap race, dice-and-counter board game. Avoid the existing reaction game.',
  },
  {
    key: 'house-utility',
    focus: 'Genuinely useful around the house. Plant moisture alarm, fridge thermometer with alert, mailbox open detector, motion-activated night light, drawer-open detector, water leak alarm, door-knocker, weather-station card.',
  },
  {
    key: 'movement',
    focus: 'Projects using the SG90 servo to move something. Pet feeder, sundial pointer, knock-detector waver, surprise box, analog gauge needle, plant-watering finger, page-turner. Pair the servo with a sensor or button trigger.',
  },
  {
    key: 'wireless-iot',
    focus: 'Projects using ESP32 (NodeMCU-32S or XIAO ESP32-C3) over WiFi. Mini web page showing live sensor reading, web-controlled LED, NTP-synced clock on the OLED, MQTT-publish temperature, simple online dashboard, phone-controlled servo.',
  },
]

phase('Brainstorm')

const brainstormResults = await parallel(LENSES.map(lens => () => agent(
  'You are a creative electronics teacher brainstorming beginner project ideas for Andy (adult, beginner) sometimes with his 10-year-old son.\n\n' +
  'LENS: ' + lens.focus + '\n\n' +
  'INVENTORY:\n' + INVENTORY + '\n\n' +
  'Generate 6-8 distinct, specific project ideas that fit your lens AND use only parts from the inventory above. "Make a thing with the OLED" is bad; "Pomodoro timer on OLED, button to start, LED blinks at end" is good.\n\n' +
  'For each idea include: name, one_liner (what it does in one sentence), difficulty (absolute beginner | beginner | intermediate), core_parts (3-6 inventory item names), wow_factor (why a kid would care).\n\n' +
  'Be inventive. Aim for breadth, not safety. Avoid duplicating the existing reaction-time game (Uno + button + LED).',
  { label: 'brainstorm:' + lens.key, phase: 'Brainstorm', schema: IDEAS_SCHEMA }
)))

const allIdeas = brainstormResults.filter(Boolean).flatMap(r => r.ideas)
log('Brainstorm: ' + allIdeas.length + ' raw ideas from ' + LENSES.length + ' lenses')

phase('Shortlist')

const shortlistResult = await agent(
  'You are curating a beginner electronics curriculum for Andy and his 10-year-old son.\n\n' +
  'You have ' + allIdeas.length + ' raw project ideas brainstormed across different lenses. Pick the best 22-26 and reject the rest.\n\n' +
  'RAW IDEAS:\n' + JSON.stringify(allIdeas, null, 2) + '\n\n' +
  'INVENTORY (to verify availability):\n' + INVENTORY + '\n\n' +
  'SELECTION CRITERIA:\n' +
  '1. VARIETY - final set should span sensors, displays, servos, IoT, games, and utility. Do not pick six PIR-and-LED projects.\n' +
  '2. WOW-per-effort - prefer high-payoff projects relative to build complexity.\n' +
  '3. Difficulty mix - aim for ~8 absolute beginner, ~12 beginner, ~5 intermediate.\n' +
  '4. Inventory fit - reject anything needing parts not in inventory.\n' +
  '5. Distinct concepts - each project should teach something at least one other does not.\n\n' +
  'Reject duplicates ruthlessly. If two ideas teach the same concept the same way, keep only the best.\n\n' +
  'Return up to 26 ideas, each with a rationale explaining why it made the cut.',
  { label: 'shortlist', phase: 'Shortlist', schema: SHORTLIST_SCHEMA }
)

const shortlisted = shortlistResult.ideas
log('Shortlisted ' + shortlisted.length + ' ideas')

const completed = await pipeline(
  shortlisted,
  (idea) => agent(
    'You are writing a complete electronics project record for the Edge-Devices inventory system.\n\n' +
    'IDEA TO REALIZE:\n' + JSON.stringify(idea, null, 2) + '\n\n' +
    'INVENTORY (item_name in allocations must EXACTLY match an entry here):\n' + INVENTORY + '\n\n' +
    'PROJECT CONVENTIONS:\n' + CONVENTIONS + '\n\n' +
    'Quality bar:\n' +
    '- code is complete and compiles. No TODOs, no pseudocode, no "...".\n' +
    '- wiring_diagram is valid Mermaid flowchart syntax with a green pwr-class power node.\n' +
    '- allocation item_name values match the inventory verbatim (case and punctuation).\n' +
    '- pins used in code match pins shown in the wiring diagram.\n' +
    '- description uses the section template (Parts list / Wiring notes / Talking points / Things to change / Why interesting).\n' +
    '- power_supply is a single clear line explaining how power enters the project AND it is reflected as a node in the wiring diagram.\n\n' +
    'Produce a complete, runnable project record.',
    { label: 'author:' + idea.name.slice(0, 30), phase: 'Author', schema: PROJECT_SCHEMA }
  ),
  async (draft, idea, idx) => {
    if (!draft) return null
    const critique = await agent(
      'You are a skeptical electronics reviewer auditing a beginner project record. Be ruthless about correctness errors. Default to needs_refinement: true unless the project is genuinely flawless.\n\n' +
      'PROJECT BEING REVIEWED:\n' + JSON.stringify(draft, null, 2) + '\n\n' +
      'INVENTORY (allocations must use exact names):\n' + INVENTORY + '\n\n' +
      'CHECK FOR:\n' +
      '1. allocation item_name values that DO NOT appear in the inventory verbatim.\n' +
      '2. Code that wont compile (syntax errors, missing semicolons, undefined functions, wrong pin types).\n' +
      '3. wiring_diagram missing the power-source node, wrong classDef colours, or with broken Mermaid syntax.\n' +
      '4. Pin assignments in code that dont match the wiring diagram.\n' +
      '5. power_supply field unspecified or contradicting the rest.\n' +
      '6. Voltage incompatibility (e.g. 5V-only chip wired to ESP32 3.3V GPIO).\n' +
      '7. Safety issues (mains voltage on the relay, unprotected Li-Ion).\n' +
      '8. Code complexity beyond the stated difficulty level.\n' +
      '9. Missing parts (the build needs a resistor thats not allocated).\n' +
      '10. Description missing required sections.\n' +
      '11. learning_concepts that dont match what the project actually teaches.\n' +
      '12. Project is essentially the reaction-time game (already exists).\n\n' +
      'List EVERY issue. Score 0-10. If score < 8 OR any high-severity issue, set needs_refinement: true and write specific refinement_guidance.',
      { label: 'critique:' + idea.name.slice(0, 30), phase: 'Critique', schema: CRITIQUE_SCHEMA }
    )
    return { draft, critique, idea }
  },
  async (combined, idea, idx) => {
    if (!combined) return null
    if (!combined.critique.needs_refinement && combined.critique.quality_score >= 8) {
      return combined.draft
    }
    return agent(
      'You are refining a beginner electronics project record based on critique feedback. Address every issue raised, even if the critic was overly strict on some points - tighten the project so the critic could not raise that point again.\n\n' +
      'ORIGINAL DRAFT:\n' + JSON.stringify(combined.draft, null, 2) + '\n\n' +
      'CRITIQUE:\n' + JSON.stringify(combined.critique, null, 2) + '\n\n' +
      'INVENTORY:\n' + INVENTORY + '\n\n' +
      'PROJECT CONVENTIONS:\n' + CONVENTIONS + '\n\n' +
      'Keep the project name and core idea. Fix everything else. Return the complete refined project record.',
      { label: 'refine:' + idea.name.slice(0, 30), phase: 'Refine', schema: PROJECT_SCHEMA }
    )
  }
)

phase('Select')

const refined = completed.filter(Boolean)
log('Pipeline complete: ' + refined.length + ' refined projects')

if (refined.length <= 20) {
  return { projects: refined, count: refined.length, selection_rationale: 'All ' + refined.length + ' refined projects accepted (under or at target 20).' }
}

const summaries = refined.map((p, i) => ({
  index: i,
  name: p.name,
  difficulty: p.difficulty,
  one_liner: (p.description || '').split('\n')[0].slice(0, 200) || p.name,
  core_parts: (p.allocations || []).slice(0, 5).map(a => a.item_name),
  learning_concepts: p.learning_concepts || [],
}))

const judgment = await agent(
  'You are picking 20 final projects from ' + refined.length + ' candidates. Optimise for variety, difficulty mix, and quality.\n\n' +
  'CANDIDATES (indexed):\n' + JSON.stringify(summaries, null, 2) + '\n\n' +
  'TARGET MIX:\n' +
  '- 6-8 absolute beginner\n' +
  '- 8-12 beginner\n' +
  '- 3-5 intermediate\n\n' +
  'WITHIN EACH TIER, OPTIMISE VARIETY:\n' +
  '- Different sensors as protagonists\n' +
  '- Different output types (LED, OLED, LCD, servo, matrix, WiFi)\n' +
  '- Different concepts taught\n\n' +
  'Return 20 indices in selected_indices and explain choices in rationale.',
  { label: 'judge', phase: 'Select', schema: FINALISTS_SCHEMA }
)

const finalists = judgment.selected_indices
  .map(i => refined[i])
  .filter(Boolean)
  .slice(0, 20)

log('Final selection: ' + finalists.length + ' projects')

return { projects: finalists, count: finalists.length, selection_rationale: judgment.rationale }
