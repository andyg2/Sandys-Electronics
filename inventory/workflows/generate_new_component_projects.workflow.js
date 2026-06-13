export const meta = {
  name: 'generate-new-component-projects',
  description: 'Brainstorm + shortlist + author + critique + refine + select 20 beginner projects biased toward the newly-added components (#199-#216)',
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

const NEW_PARTS = [
  '- ESP32-CAM with MB programmer base   (WiFi camera, OV2640, MB carrier flashes it without an FTDI - PRIORITY)',
  '- ESP32-CAM (bare module)             (same camera, needs the MB or a CP2102 adapter to flash)',
  '- ESP-01S 5V Relay Module (Tasmota)   (WiFi-controlled relay pre-flashed for Tasmota; low-voltage DC ONLY)',
  '- W1209 Temperature Controller        (standalone thermostat: NTC + display + 10A relay, 12V; pair with TEC for a cold spot or with a heater pad)',
  '- NodeMCU V3 (ESP8266, CH340G)        (5V-friendly WiFi MCU; wide footprint - use with the I/O Shield)',
  '- NodeMCU V3 I/O Shield (pin breakout) (screw-terminal carrier for the V3 - solid kid-friendly wiring)',
  '- 6-24V to 5V 3A USB Buck Converter   (run a project off a 12V SLA / LiPo / 9V wall-wart pack via USB)',
  '- WH148 10K Stereo Potentiometer      (dual-gang B10K - two independent axes from one shaft)',
  '- TEC1-4905 Peltier Thermoelectric Cooler (12V 4A solid-state cold/hot plate - hot side MUST have a heatsink)',
  '- ESP-01S WiFi Module                 (tiny 3.3V WiFi module x2; needs CP2102 to flash, two of them can talk to each other)',
  '- Soil Moisture Probe Meter (standalone) (analog needle moisture meter; can read its voltage on an Arduino ADC)',
  '- 0.56" Red 7-Segment LED Display (1 digit) (single-digit 0-9 display - hit counter, dice, channel selector)',
  '- MB102 Breadboard Power Supply Module (snaps onto rails, 3.3V/5V switchable, barrel jack or USB in)',
  '',
  'ALSO recently bumped (more units available):',
  '- DHT11 Temperature & Humidity Sensor [qty=3]',
  '- GY-BMP280 Barometric Pressure Sensor [qty=2]',
  '- KY-022 IR Receiver Module [qty=2]',
].join('\n')

const CONVENTIONS = [
  'Each project record must contain:',
  '- name: short, distinctive (<= 60 chars). Avoid duplicating any existing project.',
  '- power_supply: one-line plain-English description of how power enters the project. Examples:',
  '    "USB cable from laptop (5V via the Uno USB-B port)"',
  '    "USB-C cable from laptop to the XIAO (5V)"',
  '    "12V wall-wart into the buck converter, USB output to the NodeMCU"',
  '- description: markdown body. MUST start with a kid-friendly two-paragraph opener BEFORE any ## section:',
  '    **What it is**: 1-2 plain-English sentences describing what the finished thing DOES. 5th-grade language. No chip names or theory - just what it looks like, sounds like, or what you do with it.',
  '    **Why it is fun**: 1-2 sentences on the wow factor for a 10-year-old. Compete-with-siblings, look-cool, this-is-magic angles.',
  '  Then five ## sections in order:',
  '    ## Parts list',
  '    ## Wiring notes',
  '    ## Flash it and run it   (Arduino IDE setup OR multimeter probe procedure, with Common gotchas)',
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
  '- For ESP32 / ESP8266 WiFi: hardcode SSID = "GeeFam", placeholder string "PASSWORD_HERE" for password.',
  '- LEDs ALWAYS need a current-limiting resistor (220R-470R). Allocate one resistor per LED.',
  '- A breadboard and DuPont jumpers must be allocated for almost every project.',
  '- ESP32 and ESP8266 ESP-01S boards are 3.3V GPIO; Arduino Uno is 5V GPIO. Pick correctly for 5V-only sensors.',
  '- NodeMCU V3 has 5V-tolerant levels on most pins via the V3 board regulator - state this explicitly when wiring 5V sensors.',
  '- 2-channel Songle relay AND ESP-01S 5V Relay: LOW-VOLTAGE DC switching only (LED strip, fan, buzzer, small DC motor). NEVER mains.',
  '- TEC1-4905 Peltier: hot side MUST be on a heatsink or it will burn. Run at 6-9V from a current-limited supply for kid demos, NOT at the full 12V 4A.',
  '- ESP-01S modules need 3.3V supply (NOT 5V) and a USB-to-TTL adapter (the CP2102) to flash. Mention this in the Flash it and run it section.',
  '- Pin numbers in code MUST match pin numbers in the wiring diagram.',
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
          new_parts_used: { type: 'array', items: { type: 'string' } },
          wow_factor: { type: 'string' },
        },
        required: ['name', 'one_liner', 'difficulty', 'core_parts', 'new_parts_used', 'wow_factor'],
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
          new_parts_used: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
        },
        required: ['name', 'one_liner', 'difficulty', 'core_parts', 'new_parts_used', 'rationale'],
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
    key: 'esp32-cam',
    focus: 'Projects where the ESP32-CAM (with MB programmer base, or bare module) is the star. Live video web page on the LAN, motion-triggered photo, pet/door cam, time-lapse, OLED-as-viewfinder, snap-on-button. The camera should be the protagonist, not an accessory.',
  },
  {
    key: 'esp01s-tasmota-relay',
    focus: 'Projects using the ESP-01S 5V Relay Module (Tasmota-ready). Phone-controlled DC LED strip, web-toggled fan, scheduled lamp, voice-activated buzzer via Home Assistant. LOW-VOLTAGE DC LOADS ONLY - no mains. Pair with a sensor input (DHT11, motion) for closed-loop.',
  },
  {
    key: 'nodemcu-v3-iot',
    focus: 'NodeMCU V3 (ESP8266) projects, ideally seated on the I/O Shield for tidy screw-terminal wiring. Web-page sensor dashboard, NTP wall clock on the 1602 LCD, MQTT-publish soil moisture, online weather card from BMP280, web-controlled servo, Telegram-bot doorbell.',
  },
  {
    key: 'peltier-thermal',
    focus: 'Projects that make the TEC1-4905 Peltier do something a kid can feel. Cold spot on your finger (run at LOW voltage from buck converter), tiny ice maker on a heatsink, fog-the-window science demo, paired with the W1209 thermostat for closed-loop ON/OFF. ALWAYS heatsink the hot side.',
  },
  {
    key: 'tiny-7seg-displays',
    focus: 'Projects starring the 0.56" single-digit red 7-segment. Dice, simple counter, channel/score indicator, level meter (1-9 bars), countdown timer, button-press counter, knock counter. Single-digit constraints force creativity - one number telling a clear story.',
  },
  {
    key: 'portable-buck',
    focus: 'Battery-powered or 12V-source portable builds enabled by the 6-24V to 5V USB Buck Converter. Pocket weather station, garden-bed soil checker run from a 9V battery, lantern with PIR auto-off, ride-along temperature display in the car (12V plug to buck). MB102 breadboard PSU is a valid alternative for bench builds.',
  },
  {
    key: 'esp01s-talking-pair',
    focus: 'Two ESP-01S WiFi modules talking to each other (the user has 2x). Doorbell-and-chime pair, paired-light handshake (touch one, the other blinks), simple ESP-NOW two-button text codes. Each needs CP2102 to flash. Mention the flashing setup in the Flash it and run it section.',
  },
  {
    key: 'stereo-pot-input',
    focus: 'Projects using the WH148 dual-gang stereo potentiometer as a single twin-axis input. Two-channel volume control feeding the LCD as a "VU meter" demo, dual-axis servo aimer (X + Y from one knob movement is unusual - explain this), stereo light dimmer for two LED channels, twin-track tempo controller.',
  },
]

phase('Brainstorm')

const brainstormResults = await parallel(LENSES.map(lens => () => agent(
  'You are a creative electronics teacher brainstorming beginner project ideas for Andy (adult, beginner) sometimes with his 10-year-old son Sandy.\n\n' +
  'PRIORITY: every idea should use at LEAST ONE of the newly-added parts listed below as a structural ingredient, not a peripheral. Bias hard toward making the new parts shine.\n\n' +
  'LENS: ' + lens.focus + '\n\n' +
  'NEWLY-ADDED PARTS to feature:\n' + NEW_PARTS + '\n\n' +
  'FULL INVENTORY (everything else available):\n' + INVENTORY + '\n\n' +
  'Generate 5-7 distinct, specific project ideas that fit your lens AND use only parts from the inventory above. Vague ideas like "make a thing with the camera" are bad; "Doorbell that snaps a photo of whoever rings it and shows it on the OLED" is good.\n\n' +
  'For each idea include: name, one_liner (what it does in one sentence), difficulty (absolute beginner | beginner | intermediate), core_parts (3-6 inventory item names), new_parts_used (subset of core_parts that come from the NEWLY-ADDED list - this MUST be non-empty), wow_factor (why a kid would care).\n\n' +
  'Be inventive. Avoid duplicating the existing projects listed in the inventory snapshot.',
  { label: 'brainstorm:' + lens.key, phase: 'Brainstorm', schema: IDEAS_SCHEMA }
)))

const allIdeas = brainstormResults.filter(Boolean).flatMap(r => r.ideas)
log('Brainstorm: ' + allIdeas.length + ' raw ideas from ' + LENSES.length + ' lenses')

phase('Shortlist')

const shortlistResult = await agent(
  'You are curating a beginner electronics curriculum bias-set for Andy and his 10-year-old son Sandy.\n\n' +
  'You have ' + allIdeas.length + ' raw project ideas. Pick the best 22-26 and reject the rest.\n\n' +
  'RAW IDEAS:\n' + JSON.stringify(allIdeas, null, 2) + '\n\n' +
  'NEWLY-ADDED PARTS (final mix should heavily feature these):\n' + NEW_PARTS + '\n\n' +
  'INVENTORY (to verify availability):\n' + INVENTORY + '\n\n' +
  'SELECTION CRITERIA:\n' +
  '1. NEW-PARTS BIAS - at least 16 of the final 20 must use a newly-added part as the protagonist. Reject ideas that only sprinkle a new part as decoration.\n' +
  '2. VARIETY across new-part categories - dont pick five ESP32-CAM projects. Spread across camera, WiFi-relay, NodeMCU, peltier, 7-seg, buck/portable, ESP-01S pair, stereo pot.\n' +
  '3. WOW-per-effort - prefer high-payoff projects relative to build complexity.\n' +
  '4. Difficulty mix - aim for ~6 absolute beginner, ~10 beginner, ~6 intermediate.\n' +
  '5. Inventory fit - reject anything needing parts not in inventory.\n' +
  '6. Distinct concepts - each project should teach something at least one other does not.\n\n' +
  'Reject duplicates ruthlessly. Already-existing projects in the system are listed at the tail of the inventory snapshot - do not duplicate them.\n\n' +
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
    'NEWLY-ADDED PARTS (feature these where the idea calls for them):\n' + NEW_PARTS + '\n\n' +
    'INVENTORY (item_name in allocations must EXACTLY match an entry here):\n' + INVENTORY + '\n\n' +
    'PROJECT CONVENTIONS:\n' + CONVENTIONS + '\n\n' +
    'Quality bar:\n' +
    '- code is complete and compiles. No TODOs, no pseudocode, no "...".\n' +
    '- wiring_diagram is valid Mermaid flowchart syntax with a green pwr-class power node.\n' +
    '- allocation item_name values match the inventory verbatim (case and punctuation).\n' +
    '- pins used in code match pins shown in the wiring diagram.\n' +
    '- description uses the section template (kid opener + Parts list / Wiring notes / Flash it and run it / Talking points / Things to change / Why interesting).\n' +
    '- power_supply is a single clear line explaining how power enters the project AND it is reflected as a node in the wiring diagram.\n' +
    '- If using an ESP-01S, the Flash it and run it section MUST mention the CP2102 USB-to-TTL UART Module and the 3.3V supply rule.\n' +
    '- If using the TEC1-4905, the wiring notes MUST mention the heatsink-on-hot-side rule and recommend running at 6-9V from the buck converter for kid demos.\n\n' +
    'Produce a complete, runnable project record.',
    { label: 'author:' + idea.name.slice(0, 30), phase: 'Author', schema: PROJECT_SCHEMA }
  ),
  async (draft, idea, idx) => {
    if (!draft) return null
    const critique = await agent(
      'You are a skeptical electronics reviewer auditing a beginner project record. Be ruthless about correctness errors. Default to needs_refinement: true unless the project is genuinely flawless.\n\n' +
      'PROJECT BEING REVIEWED:\n' + JSON.stringify(draft, null, 2) + '\n\n' +
      'NEWLY-ADDED PARTS (the project SHOULD use one - check that it does):\n' + NEW_PARTS + '\n\n' +
      'INVENTORY (allocations must use exact names):\n' + INVENTORY + '\n\n' +
      'CHECK FOR:\n' +
      '1. allocation item_name values that DO NOT appear in the inventory verbatim.\n' +
      '2. Code that wont compile (syntax errors, missing semicolons, undefined functions, wrong pin types).\n' +
      '3. wiring_diagram missing the power-source node, wrong classDef colours, or with broken Mermaid syntax.\n' +
      '4. Pin assignments in code that dont match the wiring diagram.\n' +
      '5. power_supply field unspecified or contradicting the rest.\n' +
      '6. Voltage incompatibility (e.g. 5V-only sensor on bare ESP-01S 3.3V GPIO).\n' +
      '7. Safety issues - ANY mains voltage anywhere, unprotected Li-Ion, Peltier without heatsink, ESP-01S powered from 5V supply.\n' +
      '8. Code complexity beyond the stated difficulty level.\n' +
      '9. Missing parts (the build needs a resistor or breadboard thats not allocated).\n' +
      '10. Description missing required sections or kid opener.\n' +
      '11. learning_concepts that dont match what the project actually teaches.\n' +
      '12. Project NOT using any newly-added part - this is automatic needs_refinement: true.\n' +
      '13. ESP-01S project missing CP2102 flashing instructions, or TEC project missing heatsink warning.\n\n' +
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
      'NEWLY-ADDED PARTS:\n' + NEW_PARTS + '\n\n' +
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
  core_parts: (p.allocations || []).slice(0, 6).map(a => a.item_name),
  learning_concepts: p.learning_concepts || [],
}))

const judgment = await agent(
  'You are picking 20 final projects from ' + refined.length + ' candidates. Optimise for NEW-PART variety first, then quality and difficulty mix.\n\n' +
  'CANDIDATES (indexed):\n' + JSON.stringify(summaries, null, 2) + '\n\n' +
  'NEWLY-ADDED PARTS list (each tier should feature different ones):\n' + NEW_PARTS + '\n\n' +
  'PRIORITY TARGET:\n' +
  '- At LEAST 16 of 20 projects must feature a newly-added part as a structural ingredient (look at core_parts).\n' +
  '- Try to cover ALL the new-part categories: ESP32-CAM, ESP-01S Relay (Tasmota), W1209, NodeMCU V3 (+I/O Shield), Buck Converter, WH148 stereo pot, TEC1-4905 Peltier, ESP-01S WiFi pair, 7-Segment 1-digit, MB102 PSU.\n\n' +
  'TARGET DIFFICULTY MIX:\n' +
  '- 5-7 absolute beginner\n' +
  '- 8-11 beginner\n' +
  '- 3-5 intermediate\n\n' +
  'WITHIN EACH TIER, OPTIMISE VARIETY:\n' +
  '- Different new parts as protagonists\n' +
  '- Different output types (LED, OLED, LCD, servo, matrix, WiFi, 7-seg)\n' +
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
