export const meta = {
  name: 'fix-residual-with-validator',
  description: 'Re-author breadboard layouts for the projects whose residual issues survive the brute-force fixer. Each agent runs validate_breadboard.php in a propose-validate-revise loop.',
  phases: [{ title: 'Repair' }],
}

const PROJECTS = __PROJECTS__

const RULES = [
  'BOARD: half-size, 30 cols, rows A-J. Top half rows A-E share one node per column; bottom half F-J share another. Rails: +5V_T / GND_T / +5V_B / GND_B.',
  '',
  'HARD RULES (validator will flag violations):',
  '  - Two component bodies must not visually overlap (resistor 30x11 rotated, cap bulb r12, IC body across gully cols, button 22x22, pot 48x26, module 30 tall above/below pins, transistor ~44 wide).',
  '  - Two component legs cannot share a single physical hole. Move one to a different row in the same column-half (electrically identical).',
  '  - A non-IC component (resistor / cap / LED) with one leg in A-E and the other in F-J of the SAME column is broken - the gully splits the column into two nodes.',
  '',
  'SOFT RULES (preferences):',
  '  - Component legs near the gully (rows D, E, F, G). Reserve outer rows A, B, J for routing wires to rails.',
  '  - Components never attach DIRECTLY to a rail; only wires may.',
  '  - Rail-bound wires land in the closest-to-rail row (A for top rails, J for bottom).',
  '  - No same-node redundant wires (e.g. A5 -> E5 is already connected through the breadboard strip).',
  '',
  'PRESERVE the original electrical circuit. You may relocate components but every electrical net must stay intact.',
].join('\n')

const SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    attempts: { type: 'integer' },
    success: { type: 'boolean' },
    final_layout: {
      type: 'object',
      properties: {
        components: { type: 'array' },
        external: { type: 'array' },
      },
      required: ['components', 'external'],
    },
    final_issues: { type: 'array' },
    notes: { type: 'string' },
  },
  required: ['id', 'attempts', 'success', 'final_layout'],
}

phase('Repair')

const VALIDATOR = 'php C:/Users/Andy/Edge-Devices/inventory/validate_breadboard.php'

const results = await parallel(PROJECTS.map(p => () => agent(
  'You are repairing a breadboard layout that the brute-force row-swap fixer could not fully clean. The remaining issues are STRUCTURAL - they need different columns, fewer wires, or relocated components, not just row swaps.\n\n' +
  'PROJECT: #' + p.id + '  ' + p.name + '\n' +
  'POWER: ' + (p.power_supply || '(unspecified)') + '\n\n' +
  'CURRENT LAYOUT (broken):\n' +
  JSON.stringify(p.layout, null, 2) + '\n\n' +
  'VALIDATOR ISSUES THAT REMAIN:\n' +
  p.issuesText + '\n\n' +
  'ALLOCATIONS:\n' +
  (p.allocations || []).map(a => '  - item_id=' + a.item_id + '  ' + a.item_name).join('\n') + '\n\n' +
  'RULES:\n' + RULES + '\n\n' +
  'PROCEDURE (use Write + Bash):\n' +
  '  1. Analyse what is structurally wrong. Look at each remaining issue and decide what column(s) to move things to, or what duplicate wires to remove.\n' +
  '  2. Propose a revised layout JSON: { "components": [...], "external": [...] }.\n' +
  '  3. Save it to /tmp/bb_proposal_' + p.id + '.json with the Write tool.\n' +
  '  4. Run the validator with brute-force fix enabled:\n' +
  '     ' + VALIDATOR + ' --fix --format=json --json < /tmp/bb_proposal_' + p.id + '.json\n' +
  '     The output JSON has { id, before, after, moves, remaining_issues, layout }.\n' +
  '     `before` is your input issue count, `after` is what remains after the brute force swept up row collisions, `layout` is the cleaned version.\n' +
  '  5. If `after === 0`, you are done. Return the validator\'s `layout` as `final_layout`, `success: true`, attempts = number of revisions.\n' +
  '  6. If `after > 0`, study `remaining_issues`, revise your proposal, save it again, validate again. Up to 4 attempts total.\n' +
  '  7. If you cannot reach zero after 4 attempts, return your best attempt with `success: false` and a brief note in `notes` explaining why.\n\n' +
  'IMPORTANT:\n' +
  '  - The validator does the row-shuffling for you. Focus on column placement and component count.\n' +
  '  - If two wires duplicate each other (same endpoints), delete one.\n' +
  '  - If a wire endpoint collides with a chip pin, move the wire to a different row (e.g. wire to chip pin column should arrive at row A or B, not row E where the chip pin is).\n' +
  '  - If a body overlaps with a chip or another big footprint, move it to a free column block.\n' +
  '  - Preserve the circuit - every net must still connect the same components.',
  { label: 'fix:#' + p.id, phase: 'Repair', schema: SCHEMA }
)))

return {
  results: results.filter(Boolean),
  success_count: results.filter(r => r && r.success).length,
  attempted: results.length,
}
