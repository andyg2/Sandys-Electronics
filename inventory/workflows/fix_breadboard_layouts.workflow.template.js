export const meta = {
  name: 'fix-breadboard-layouts',
  description: 'Audit each project breadboard layout for overlapping components, far-from-centre placements, and direct rail attachments, and rewrite the layout when any rule is violated.',
  phases: [{ title: 'Review' }],
}

const PROJECTS = __PROJECTS__

const RULES = [
  'BOARD GEOMETRY:',
  '  Half-size breadboard, 30 cols (1-30), rows A-J. Top half rows A-E share one electrical node per column;',
  '  bottom half rows F-J share another. Centre gully sits between rows E and F.',
  '  Power rails: +5V_T / GND_T on top, +5V_B / GND_B on bottom. Each rail is one node per side.',
  '  Rail wires can specify a column via "@N", e.g. "GND_T@21" pins the wire to col 21 on that rail.',
  '',
  'RULE 1: NO COMPONENT OVERLAPS',
  '  Component bodies are drawn between their endpoint legs.',
  '  - Resistor body is 30 px wide x 11 px tall, centred between legs, rotated to align with the leg axis.',
  '    Two resistors in the same row with overlapping column ranges WILL collide.',
  '    Two resistors at the same column going to opposite rails will also stack vertically.',
  '  - LED bulb floats 16 px above the leg row; anode and cathode are in adjacent columns of one row.',
  '  - Capacitor bulb sits ~28 px outside the legs (above for top-half legs, below for bottom).',
  '  - IC: chip body straddles the gully across cols pin1_at.col .. pin1_at.col + pins/2 - 1, occupying',
  '    rows E and F at those columns physically.',
  '  - Button: 4 pins at TL=at, TR=at+2cols, BL=at+2rows, BR=at+2cols+2rows. Body covers all 9 cells in between.',
  '  - Transistor / pot: 3 pins in one row at at-1, at, at+1. Body is ~40 px wide.',
  '',
  '  Same-row resistors must have non-overlapping column ranges. To stack two resistors that share one',
  '  endpoint column, put them in DIFFERENT rows (e.g. row A and row C, not both in row B).',
  '',
  'RULE 2: COMPONENTS BELONG NEAR THE GULLY',
  '  The gully (between rows E and F) is the visual centre of the board. Prefer:',
  '    - Top-half components in rows D or E (closest to the gully).',
  '    - Bottom-half components in rows F or G.',
  '  Outer rows (A, B, C and H, I, J) should be used for routing wires to rails, NOT for component legs.',
  '  LEDs are an exception: their bulb glyph extends upward from the leg row, so leg at row A keeps the',
  '  bulb on-board. LED legs may stay in row A (top half) or row J (bottom half) when needed.',
  '',
  'RULE 3: NEVER ATTACH A COMPONENT DIRECTLY TO A RAIL',
  '  Wrong:  { type:"resistor", from:"D8", to:"+5V_T" }',
  '  Right:  { type:"resistor", from:"D8", to:"D14" }, { type:"wire", from:"A14", to:"+5V_T" }',
  '  This applies to resistors, capacitors, LEDs (anode/cathode), transistor legs, pot pins, module pins, servo pins.',
  '  Wires are the ONLY type that may terminate at a rail.',
  '',
  'RULE 4: RAIL WIRES USE THE CLOSEST-TO-RAIL ROW',
  '  When a wire ends at a rail, the grid end should be in the row closest to that rail:',
  '    Top rails (+5V_T / GND_T) -> row A first, then B if A is taken, then C, etc.',
  '    Bottom rails (+5V_B / GND_B) -> row J first, then I, then H, etc.',
  '  Never run a wire from row E to GND_T when row A in the same column is free.',
  '',
  'RULE 5: NO REDUNDANT SAME-NODE WIRES',
  '  A wire between two holes already on the same electrical node is redundant (the internal copper strip',
  '  already connects them). Examples to delete: A5 -> E5, B12 -> C12, GND_T -> GND_T@8.',
  '',
  'RULE 6: PRESERVE CIRCUIT CONNECTIVITY',
  '  Every electrical node in the original layout must still exist in the new layout. You may MOVE',
  '  components and CHANGE which holes they occupy, but the same set of components must still share the',
  '  same logical nets. Verify this before returning.',
  '',
  'ALLOWED COMPONENT TYPES (full DSL):',
  '  { type:"wire", from, to, color?, item_id }',
  '  { type:"resistor", value, from, to, item_id }',
  '  { type:"capacitor", value, positive, negative, polarised?, item_id }',
  '  { type:"led", color, anode, cathode, item_id }',
  '  { type:"ic", name, pin1_at, pins, item_id }',
  '  { type:"transistor", at, name, pinout?, item_id }',
  '  { type:"button", at, label?, item_id }',
  '  { type:"pot" or "trimmer", at, value?, label?, item_id }',
  '  { type:"module", name, pins:[{label,at},...], item_id }',
  '  { type:"servo", name, signal, power, ground, item_id }',
  '',
  'OUTPUT FORMAT:',
  '  Return an object with:',
  '    id: <integer matching the project id>',
  '    needs_change: true | false',
  '    issues_found: ["short description of each rule violation found"]  (empty when needs_change=false)',
  '    new_layout: { components:[...], external:[...] }  (REQUIRED when needs_change=true,',
  '                  must be a COMPLETE replacement, same allocations preserved)',
  '',
  '  If the existing layout already satisfies every rule, return needs_change:false and omit new_layout.',
  '  Do NOT touch the "external" list other than to keep it intact; the off-board connections do not need',
  '  to change unless an external endpoint needs to land at a different breadboard hole because you moved',
  '  the component it was feeding.',
].join('\n')

const SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    needs_change: { type: 'boolean' },
    issues_found: { type: 'array', items: { type: 'string' } },
    new_layout: {
      type: 'object',
      properties: {
        components: { type: 'array' },
        external: { type: 'array' },
      },
    },
  },
  required: ['id', 'needs_change', 'issues_found'],
}

phase('Review')

const results = await parallel(PROJECTS.map(p => () => agent(
  'You are reviewing the breadboard_layout of one project against a strict set of placement rules. If any rule is violated, return a fully rewritten layout that obeys all rules while preserving the electrical circuit.\n\n' +
  'PROJECT id: ' + p.id + '\n' +
  'NAME: ' + p.name + '\n' +
  'POWER SUPPLY: ' + (p.power_supply || '(unspecified)') + '\n\n' +
  'CURRENT LAYOUT:\n' +
  JSON.stringify(p.layout, null, 2) + '\n\n' +
  'ALLOCATIONS (item_id you may reference in components, plus the human name):\n' +
  (p.allocations || []).map(a => '  - item_id=' + a.item_id + '  ' + a.item_name).join('\n') + '\n\n' +
  'RULES:\n' + RULES,
  { label: 'bb:#' + p.id, phase: 'Review', schema: SCHEMA }
)))

const changed = results.filter(r => r && r.needs_change && r.new_layout)
const clean = results.filter(r => r && !r.needs_change)
return {
  results: results.filter(Boolean),
  changed_count: changed.length,
  clean_count: clean.length,
}
