export const meta = {
  name: 'generate-ic-projects',
  description: 'Brainstorm + shortlist + author + critique + refine 25 IC-driven projects, including advanced ones',
  phases: [
    { title: 'Brainstorm' },
    { title: 'Shortlist' },
    { title: 'Author' },
    { title: 'Critique' },
    { title: 'Refine' },
    { title: 'Select' },
  ],
}

const INVENTORY = `__INVENTORY__`
const EXISTING_PROJECTS = __EXISTING_PROJECTS__

const CONVENTIONS = [
  'Each project record must contain:',
  '- name: short, distinctive (<= 60 chars). Must NOT duplicate any existing project listed.',
  '- power_supply: one-line plain-English description of how power enters the project. Reflected as a green pwr-class node in the wiring diagram.',
  '- description: markdown body with these sections in order:',
  '    ## Parts list',
  '    ## Wiring notes',
  '    ## Talking points',
  '    ## Things to change once it works',
  '    ## Why this is interesting',
  '- wiring_diagram: Mermaid flowchart source. MUST include a power-source node styled with classDef pwr fill:#10b981,color:#fff,stroke:#047857. Colour palette:',
  '    classDef pwr fill:#10b981,color:#fff,stroke:#047857',
  '    classDef pin fill:#1e6fd6,color:#fff,stroke:#003c80',
  '    classDef gnd fill:#333,color:#fff,stroke:#000',
  '    classDef sensor fill:#dbeafe,stroke:#1e40af,color:#1e3a8a',
  '    classDef out fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d',
  '    classDef res fill:#fef3c7,stroke:#b45309,color:#78350f',
  '    classDef mod fill:#e9d5ff,stroke:#7c3aed,color:#581c87',
  '- code: complete, runnable code OR a short calibration/test sketch. For pure-analog projects (no MCU), provide a brief multimeter test procedure as code_language=bash or leave the sketch as a 10-line "measure these test points" Arduino helper using Serial output.',
  '- code_language: cpp / python / bash.',
  '- difficulty: absolute beginner | beginner | intermediate | advanced',
  '- allocations: array of {item_name (EXACT match to INVENTORY), qty: positive int, notes: brief role}.',
  '- learning_concepts: 1-4 short concept names taught.',
  '',
  'AUDIENCE NOTES:',
  '- Absolute beginner / beginner / intermediate: NO soldering, all breadboard.',
  '- Advanced: soldering on the Double-Sided Prototype PCB (assorted sizes) is allowed and even encouraged. State soldering up front in the description if required.',
  '',
  'CONSTRAINTS:',
  '- For ESP32 WiFi: hardcode SSID = "GeeFam", placeholder "PASSWORD_HERE" for password.',
  '- LEDs ALWAYS need a current-limiting resistor (220R-470R) allocated.',
  '- ESP32 boards are 3.3V GPIO; Arduino Uno is 5V GPIO.',
  '- 2-channel Songle relay: low-voltage DC switching only.',
  '- Pin numbers in code MUST match pin numbers in the wiring diagram.',
  '- This batch must lean on the IC / transistor / voltage-regulator catalogue (NE555, LM358/324, LM393/339, LM386, TDA2030A, ULN2003/2803, PC817, BC547+family, L78xx, LM317, ICL7660S, UC3842/3843). At least 18 of the 25 final projects should put an IC, BJT, or regulator front and centre (with optional MCU support).',
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
          difficulty: { type: 'string', enum: ['absolute beginner', 'beginner', 'intermediate', 'advanced'] },
          core_parts: { type: 'array', items: { type: 'string' } },
          star_chip: { type: 'string' },
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
      maxItems: 32,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          one_liner: { type: 'string' },
          difficulty: { type: 'string', enum: ['absolute beginner', 'beginner', 'intermediate', 'advanced'] },
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
    difficulty: { type: 'string', enum: ['absolute beginner', 'beginner', 'intermediate', 'advanced'] },
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
    selected_indices: { type: 'array', items: { type: 'integer' }, maxItems: 25 },
    rationale: { type: 'string' },
  },
  required: ['selected_indices', 'rationale'],
}

const LENSES = [
  {
    key: 'ne555-timer',
    focus: 'NE555 timer recipes - astable LED blinker, monostable button debouncer, programmable siren, square-wave function generator, PWM motor controller, traffic-light sequencer, retro arcade beeper. Should use the NE555 and supporting passives (resistors, electrolytic capacitors). Mix difficulty.',
  },
  {
    key: 'op-amp',
    focus: 'Op-amp circuits using LM358 (dual), LM324 (quad), UA741, JRC4558, NE5532. Examples: window comparator (LM393), inverting amplifier, summing mixer, integrator/sawtooth generator, low-pass filter, photodiode preamp, dark detector with LM393 comparator. Include theory in description.',
  },
  {
    key: 'audio',
    focus: 'Audio amplifier projects using LM386, TDA2030A, TDA2822D, NE5532. Examples: 1-watt headphone amp, mini speaker driver, electret microphone preamp, line booster, simple guitar fuzz/distortion. Use the KY-037 microphone or a 3.5mm input.',
  },
  {
    key: 'power-regulation',
    focus: 'Power and regulation circuits using L78xx (5V, 9V, 12V, etc.), LM317T (adjustable), ICL7660S (charge-pump inverter / voltage doubler). Examples: variable bench supply, dual-rail +/-V from single supply (ICL7660S), virtual ground generator, regulated breadboard PSU, low-dropout 3.3V supply. Intermediate / advanced.',
  },
  {
    key: 'switching-driving',
    focus: 'BJT and Darlington driver circuits using BC547/557 family + ULN2003/ULN2803 + PC817 optocoupler. Examples: high-current LED chaser, opto-isolated relay trigger, 8-channel LED matrix driver, transistor logic gates (AND/OR with BJTs), high-side load switch, ULN-driven stepper or 4-LED game.',
  },
  {
    key: 'advanced-proto-pcb',
    focus: 'Multi-IC advanced projects intended for the Double-Sided Prototype PCB (soldering required, Andy-solo). Examples: SMPS based on UC3842/UC3843 driving 5V from 12V, multi-stage audio amp with tone control (NE5532 + LM386), function generator (NE555 + op-amp shaper), regulated linear power supply with switchable outputs, op-amp Schmitt trigger oscillator. All advanced difficulty. State soldering up front.',
  },
]

phase('Brainstorm')

const brainstormResults = await parallel(LENSES.map(lens => () => agent(
  'You are a creative electronics teacher brainstorming new project ideas for Andy (adult, beginner-to-intermediate). For "advanced" projects he will solder onto a Double-Sided Prototype PCB.\n\n' +
  'LENS: ' + lens.focus + '\n\n' +
  'INVENTORY:\n' + INVENTORY + '\n\n' +
  'EXISTING PROJECT TITLES (DO NOT duplicate):\n' + EXISTING_PROJECTS.join('\n') + '\n\n' +
  'Generate 6-8 distinct, specific ideas in your lens. Each idea should put one or more ICs / transistors / regulators front and centre as the protagonist (mention the chip in the name when possible).\n\n' +
  'For each idea: name, one_liner, difficulty (absolute beginner | beginner | intermediate | advanced), core_parts (3-6 exact inventory names), star_chip (the main IC/BJT/regulator), wow_factor.',
  { label: 'brainstorm:' + lens.key, phase: 'Brainstorm', schema: IDEAS_SCHEMA }
)))

const allIdeas = brainstormResults.filter(Boolean).flatMap(r => r.ideas)
log('Brainstorm: ' + allIdeas.length + ' raw ideas across ' + LENSES.length + ' lenses')

phase('Shortlist')

const shortlistResult = await agent(
  'Curate ' + allIdeas.length + ' raw project ideas down to ~28-32 candidates. Pick for variety and quality.\n\n' +
  'RAW IDEAS:\n' + JSON.stringify(allIdeas, null, 2) + '\n\n' +
  'INVENTORY (to verify availability):\n' + INVENTORY + '\n\n' +
  'EXISTING PROJECT TITLES (must not duplicate):\n' + EXISTING_PROJECTS.join('\n') + '\n\n' +
  'TARGET MIX in the shortlist:\n' +
  '- 4-5 absolute beginner (kid-friendly IC intro - the NE555 LED blinker, simple comparator night-light)\n' +
  '- 10-12 beginner (still breadboard, slightly more wires)\n' +
  '- 9-11 intermediate (multi-stage circuits, calibration required)\n' +
  '- 4-5 advanced (proto-PCB soldering, multi-IC builds, Andy solo)\n\n' +
  'CRITERIA:\n' +
  '1. Each project must put an IC, BJT, or regulator at its centre.\n' +
  '2. Variety: do not pick 4 NE555 blinkers. Spread across timers, op-amps, audio, power, switching.\n' +
  '3. Reject ideas needing parts NOT in inventory.\n' +
  '4. Reject duplicates of existing projects.\n' +
  '5. Each idea gets a rationale explaining why it made the cut.',
  { label: 'shortlist', phase: 'Shortlist', schema: SHORTLIST_SCHEMA }
)

const shortlisted = shortlistResult.ideas
log('Shortlisted ' + shortlisted.length + ' ideas')

const completed = await pipeline(
  shortlisted,
  (idea) => agent(
    'Author a complete electronics project record for the Edge-Devices inventory.\n\n' +
    'IDEA TO REALIZE:\n' + JSON.stringify(idea, null, 2) + '\n\n' +
    'INVENTORY (item_name in allocations must EXACTLY match an entry):\n' + INVENTORY + '\n\n' +
    'CONVENTIONS:\n' + CONVENTIONS + '\n\n' +
    'Quality bar:\n' +
    '- For projects with code: complete, no TODOs, runs as-is. Pin numbers match the wiring diagram.\n' +
    '- For pure-analog projects without MCU: provide a short multimeter test procedure as the code field (code_language=bash) describing what voltages to measure at which test points.\n' +
    '- wiring_diagram: valid Mermaid with green pwr-class power node and consistent classDef styling.\n' +
    '- allocations: exact inventory names. Allocate every resistor, capacitor, IC, etc.\n' +
    '- description: parts list, wiring notes, talking points (kid-friendly OR adult-circuit-theory depending on difficulty), things to change, why it is interesting.\n' +
    '- For advanced projects: state soldering up front in the description.\n' +
    '- Include the breadboard for non-advanced projects; the prototype PCB for advanced ones.',
    { label: 'author:' + idea.name.slice(0, 30), phase: 'Author', schema: PROJECT_SCHEMA }
  ),
  async (draft, idea, idx) => {
    if (!draft) return null
    const critique = await agent(
      'Critique a beginner-to-intermediate electronics project record. Be ruthless. Default needs_refinement: true unless flawless.\n\n' +
      'PROJECT:\n' + JSON.stringify(draft, null, 2) + '\n\n' +
      'INVENTORY:\n' + INVENTORY + '\n\n' +
      'CHECK FOR:\n' +
      '1. allocation item_name values that do not match the INVENTORY verbatim.\n' +
      '2. Code wont compile (syntax errors) OR pure-analog projects without a test procedure in the code field.\n' +
      '3. wiring_diagram missing the green pwr-class node or invalid Mermaid.\n' +
      '4. Pin assignments do not match between code and wiring.\n' +
      '5. power_supply unspecified or contradicting the rest.\n' +
      '6. Voltage incompatibility (e.g. 5V chip wired to ESP32 3.3V GPIO without level shift).\n' +
      '7. Missing protective resistors (current-limit for LEDs, base resistors for BJTs).\n' +
      '8. Description missing required sections.\n' +
      '9. Difficulty inconsistent with build complexity.\n' +
      '10. Advanced projects fail to state soldering up front.\n' +
      '11. Duplicates one of the existing projects.\n\n' +
      'Score 0-10. needs_refinement: true unless score >= 8 and no high-severity issues.',
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
      'Refine the project record based on critique. Address every issue.\n\n' +
      'ORIGINAL DRAFT:\n' + JSON.stringify(combined.draft, null, 2) + '\n\n' +
      'CRITIQUE:\n' + JSON.stringify(combined.critique, null, 2) + '\n\n' +
      'INVENTORY:\n' + INVENTORY + '\n\n' +
      'CONVENTIONS:\n' + CONVENTIONS + '\n\n' +
      'Keep the name and core idea. Fix everything else.',
      { label: 'refine:' + idea.name.slice(0, 30), phase: 'Refine', schema: PROJECT_SCHEMA }
    )
  }
)

phase('Select')

const refined = completed.filter(Boolean)
log('Pipeline complete: ' + refined.length + ' refined projects')

if (refined.length <= 25) {
  return { projects: refined, count: refined.length, selection_rationale: 'All ' + refined.length + ' refined projects accepted.' }
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
  'Pick 25 final projects from ' + refined.length + ' candidates. Optimise for variety + difficulty mix.\n\n' +
  'CANDIDATES:\n' + JSON.stringify(summaries, null, 2) + '\n\n' +
  'TARGET MIX:\n' +
  '- 4 absolute beginner\n' +
  '- 8 beginner\n' +
  '- 9 intermediate\n' +
  '- 4 advanced\n\n' +
  'OPTIMISE VARIETY:\n' +
  '- Spread across NE555, op-amps, audio, power, switching/driving, advanced.\n' +
  '- Multiple distinct ICs as protagonists.\n\n' +
  'Return 25 indices and a rationale.',
  { label: 'judge', phase: 'Select', schema: FINALISTS_SCHEMA }
)

const finalists = judgment.selected_indices
  .map(i => refined[i])
  .filter(Boolean)
  .slice(0, 25)

log('Final selection: ' + finalists.length + ' projects')

return { projects: finalists, count: finalists.length, selection_rationale: judgment.rationale }
