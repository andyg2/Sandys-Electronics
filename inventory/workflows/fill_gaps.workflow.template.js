export const meta = {
  name: 'fill-coverage-gaps',
  description: 'Author + critique + refine one project per uncovered board/module/sensor',
  phases: [
    { title: 'Author' },
    { title: 'Critique' },
    { title: 'Refine' },
  ],
}

// Inlined at build time from /tmp/inv2.txt
const INVENTORY = `__INVENTORY__`

// Inlined at build time from /tmp/targets.json
const TARGETS = __TARGETS__

const CONVENTIONS = [
  'Each project record must contain:',
  '- name: short, distinctive (<= 60 chars). Must NOT duplicate an existing project listed in the inventory snapshot.',
  '- power_supply: one-line plain-English description of how the project is powered.',
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
  '  Colour scheme:',
  '    classDef pwr  fill:#10b981,color:#fff,stroke:#047857',
  '    classDef pin  fill:#1e6fd6,color:#fff,stroke:#003c80',
  '    classDef gnd  fill:#333,color:#fff,stroke:#000',
  '    classDef sensor fill:#dbeafe,stroke:#1e40af,color:#1e3a8a',
  '    classDef out  fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d',
  '    classDef res  fill:#fef3c7,stroke:#b45309,color:#78350f',
  '    classDef mod  fill:#e9d5ff,stroke:#7c3aed,color:#581c87',
  '- code: complete, runnable code (Arduino sketch with setup() + loop(), or Python script). No TODOs.',
  '- code_language: cpp / python / bash.',
  '- difficulty: absolute beginner | beginner | intermediate',
  '- allocations: array of {item_name (EXACT match to INVENTORY), qty: positive int, notes: brief role}.',
  '- learning_concepts: 1-4 short concept names taught.',
  '',
  'CONSTRAINTS:',
  '- Audience: a 10-year-old building with his dad. NO soldering. Visible/audible/movement feedback required - no silent bench tools.',
  '- For ESP32 WiFi: hardcode SSID = "GeeFam", placeholder "PASSWORD_HERE" for password.',
  '- LEDs ALWAYS need a current-limiting resistor (220R-470R) allocated.',
  '- A breadboard and DuPont jumpers are allocated for almost every project.',
  '- ESP32 boards are 3.3V GPIO; Arduino Uno is 5V GPIO.',
  '- 2-channel Songle relay: low-voltage DC only.',
  '- Pin numbers in code MUST match the wiring diagram.',
].join('\n')

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

log('Filling coverage gaps for ' + TARGETS.length + ' uncovered items')

phase('Author')

const completed = await pipeline(
  TARGETS,
  (target) => agent(
    'You are authoring a complete electronics project record for the Edge-Devices inventory.\n\n' +
    'TARGET ITEM (this must be the protagonist of the project - the main thing the project showcases - and must appear in allocations):\n' +
    JSON.stringify(target, null, 2) + '\n\n' +
    (target.notes ? 'TARGET-SPECIFIC GUIDANCE:\n' + target.notes + '\n\n' : '') +
    'INVENTORY (item_name in allocations must EXACTLY match an entry here):\n' + INVENTORY + '\n\n' +
    'PROJECT CONVENTIONS:\n' + CONVENTIONS + '\n\n' +
    'Pick a concrete, specific use of the target item that produces visible, immediate feedback. Avoid duplicating any existing project listed in the inventory snapshot.\n\n' +
    'Produce a complete, runnable project record. The code must compile and run as-is (no TODOs, no pseudocode). The wiring diagram must be valid Mermaid syntax with a green pwr-class power node. Pins in code must match the diagram.',
    { label: 'author:' + target.name.slice(0, 30), phase: 'Author', schema: PROJECT_SCHEMA }
  ),
  async (draft, target, idx) => {
    if (!draft) return null
    const critique = await agent(
      'You are a skeptical electronics reviewer auditing a project record. Be ruthless. Default needs_refinement: true unless the project is flawless.\n\n' +
      'PROJECT BEING REVIEWED:\n' + JSON.stringify(draft, null, 2) + '\n\n' +
      'TARGET ITEM (must be the protagonist of the project AND appear in allocations):\n' + JSON.stringify(target, null, 2) + '\n\n' +
      'INVENTORY:\n' + INVENTORY + '\n\n' +
      'CHECK:\n' +
      '1. The target item appears in allocations and is genuinely the protagonist (not relegated to a side role).\n' +
      '2. All allocation item_name values match the INVENTORY verbatim.\n' +
      '3. Code compiles, no syntax errors, no undefined functions, complete setup() and loop() (or main).\n' +
      '4. Wiring diagram has a green pwr-class power node and valid Mermaid syntax.\n' +
      '5. Pin assignments in code match the wiring diagram.\n' +
      '6. power_supply specified and reflected in wiring.\n' +
      '7. Voltage levels correct (5V vs 3.3V GPIO).\n' +
      '8. No safety issues.\n' +
      '9. Difficulty consistent with code complexity.\n' +
      '10. All required parts allocated (including current-limiting resistors per LED, breadboards, jumpers).\n' +
      '11. Description has all five sections.\n' +
      '12. learning_concepts match what the project actually teaches.\n' +
      '13. Does NOT duplicate an existing project listed in the inventory snapshot.\n\n' +
      'List every issue. Score 0-10. needs_refinement: true unless score >= 8 and no high-severity issues.',
      { label: 'critique:' + target.name.slice(0, 30), phase: 'Critique', schema: CRITIQUE_SCHEMA }
    )
    return { draft, critique, target }
  },
  async (combined, target, idx) => {
    if (!combined) return null
    if (!combined.critique.needs_refinement && combined.critique.quality_score >= 8) {
      return combined.draft
    }
    return agent(
      'You are refining a project record based on critique feedback. Address every issue.\n\n' +
      'ORIGINAL DRAFT:\n' + JSON.stringify(combined.draft, null, 2) + '\n\n' +
      'CRITIQUE:\n' + JSON.stringify(combined.critique, null, 2) + '\n\n' +
      'TARGET ITEM (must remain the protagonist):\n' + JSON.stringify(target, null, 2) + '\n\n' +
      'INVENTORY:\n' + INVENTORY + '\n\n' +
      'CONVENTIONS:\n' + CONVENTIONS + '\n\n' +
      'Keep the project name and core idea. Fix everything else. Return a complete refined record.',
      { label: 'refine:' + target.name.slice(0, 30), phase: 'Refine', schema: PROJECT_SCHEMA }
    )
  }
)

const projects = completed.filter(Boolean)
log('Authored ' + projects.length + ' projects for coverage gaps')

return { projects, count: projects.length }
