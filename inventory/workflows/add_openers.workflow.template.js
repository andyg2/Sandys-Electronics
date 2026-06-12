export const meta = {
  name: 'add-kid-friendly-openers',
  description: 'Add a What-it-is / Why-its-fun opener paragraph to each project',
  phases: [{ title: 'Opener' }],
}

const PROJECTS = __PROJECTS__

const SCHEMA = {
  type: 'object',
  properties: {
    id:          { type: 'integer' },
    what_it_is:  { type: 'string', maxLength: 400 },
    why_its_fun: { type: 'string', maxLength: 400 },
  },
  required: ['id', 'what_it_is', 'why_its_fun'],
}

phase('Opener')

const results = await parallel(PROJECTS.map(p => () => agent(
  'You are writing a kid-friendly opener for an existing electronics project record. Target reader: a 10-year-old building the project with his dad.\n\n' +
  'PROJECT ID: ' + p.id + '\n' +
  'NAME: ' + p.name + '\n' +
  'DIFFICULTY: ' + (p.difficulty || 'beginner') + '\n\n' +
  'EXISTING DESCRIPTION (already written - parts list, wiring, talking points. DO NOT repeat or paraphrase this content):\n' +
  p.description.slice(0, 4000) + '\n\n' +
  'Produce TWO short paragraphs that will sit ABOVE the existing description as a kid-friendly opener. Imagine a kid flipping through the curriculum picking a project - your two paragraphs are what hooks them.\n\n' +
  '1. what_it_is: 1-2 plain-English sentences describing what the finished thing DOES. Use 5th-grade language. Skip the chip names and circuit theory - just what it looks like, sounds like, or what you do with it. Examples:\n' +
  '   - "Press the button. The LED lights up after a random pause. Slap the button as fast as you can and your reaction time prints on the laptop screen."\n' +
  '   - "Plug it in. The LED blinks once per second like a calm heartbeat. No code, just a chip and a few parts."\n' +
  '   - "Speak into the microphone. The 8x8 grid of red LEDs lights up like a tiny VU meter, taller when you are louder, shorter when you whisper."\n\n' +
  '2. why_its_fun: 1-2 sentences explaining the wow factor, framed for a 10-year-old. Compete-with-siblings angles, look-cool angles, make-something-react angles, this-is-magic angles. Examples:\n' +
  '   - "Compete with your siblings for the fastest time. Average human reaction is ~250 ms - beat that and you get bragging rights."\n' +
  '   - "This is the first thing you build that does something useful without ANY code. Just a chip, two resistors, a cap, and an LED."\n' +
  '   - "Carry it around the house. Hum into it. Tap on the desk. Whatever makes a sound, the lights jump."\n\n' +
  'Return JSON with id, what_it_is, why_its_fun.',
  { label: 'opener:' + p.name.slice(0, 30), phase: 'Opener', schema: SCHEMA }
)))

return { results: results.filter(Boolean), count: results.filter(Boolean).length }
