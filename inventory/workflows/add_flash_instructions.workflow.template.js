export const meta = {
  name: 'add-flash-instructions',
  description: 'Add a "Flash it and run it" section to each project description that lacks one',
  phases: [{ title: 'Section' }],
}

const PROJECTS = __PROJECTS__

const SCHEMA = {
  type: 'object',
  properties: {
    id:      { type: 'integer' },
    section: { type: 'string', maxLength: 4000 },
  },
  required: ['id', 'section'],
}

const STYLE_GUIDE = [
  'Section title MUST be exactly: ## Flash it and run it',
  '',
  'Audience: a 10-year-old building with his dad. Click-by-click, no jargon.',
  '',
  'STRUCTURE depending on the project:',
  '',
  '(A) MCU projects with cpp/python code (Arduino Uno, ESP32 NodeMCU-32S, XIAO ESP32-C3):',
  '  Lead-in: "You need a laptop running the **Arduino IDE 2.x** (free download from [arduino.cc](https://www.arduino.cc/en/software))."',
  '',
  '  **One-time setup (only the first time you flash any <Uno|ESP32>):**',
  '  1. (ESP32 only) Add board manager URL https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json via File -> Preferences.',
  '  2. (ESP32 only) Tools -> Board -> Boards Manager, install "esp32 by Espressif Systems".',
  '  3. Tools -> Board -> <board name as it appears in the menu>.',
  '  4. If any extra libraries are needed (PubSubClient, DHT sensor library, Adafruit_SSD1306, TM1637, Servo, etc.), say which ones, where to install them (Tools -> Manage Libraries), and what to search for.',
  '',
  '  **Every time you flash:**',
  '  1. Plug board in via USB (note cable type for the specific board).',
  '  2. Tools -> Port -> COM* / cu.usbmodem* / ttyACM0.',
  '  3. Replace any PASSWORD_HERE / placeholder constants in the sketch.',
  '  4. Click Upload (right-arrow icon). For ESP32: mention BOOT button trick on first upload if needed.',
  '  5. Tools -> Serial Monitor at the right baud (check the Serial.begin() call in the code).',
  '  6. What the kid should see in the Serial Monitor + how to know it worked (e.g. an IP address, a sensor reading, "ready").',
  '',
  '(B) Pure analog projects (NE555 / op-amp / etc., code_language=bash, no MCU):',
  '  Lead-in: "Nothing to flash on this one - it is all chip + passives, runs the second power touches it."',
  '  Then a brief power-up procedure (where to feed +5V, what visible thing should happen) + a pointer to the multimeter probe steps already in the Code section if applicable.',
  '',
  '(C) Always finish with a "**Common gotchas:**" mini-list of 2-3 likely failure modes specific to THIS project',
  '  - Wrong WiFi band (ESP32 cannot see 5 GHz)',
  '  - BOOT button trick on the first ESP32 upload',
  '  - Cap polarity backwards',
  '  - LED in backwards (no damage, just no light)',
  '  - Serial Monitor baud rate wrong',
  '  - Library version mismatch',
].join('\n')

phase('Section')

const results = await parallel(PROJECTS.map(p => () => agent(
  'You are writing a "Flash it and run it" section for an existing electronics project. The section will be inserted into the project description right after "## Wiring notes" and before "## Talking points".\n\n' +
  'PROJECT id:' + p.id + '\n' +
  'NAME: ' + p.name + '\n' +
  'DIFFICULTY: ' + (p.difficulty || 'beginner') + '\n' +
  'POWER SUPPLY: ' + (p.power_supply || '') + '\n' +
  'CODE LANGUAGE: ' + (p.code_language || 'cpp') + '\n\n' +
  'ALLOCATED PARTS (to detect the MCU board):\n' +
  (p.allocations || []).map(a => `  - ${a.qty}x ${a.item_name}`).join('\n') + '\n\n' +
  'CODE (first 2500 chars - read for library #includes, Serial.begin() baud, WIFI_SSID, placeholders):\n' +
  (p.code || '').slice(0, 2500) + '\n\n' +
  'EXISTING DESCRIPTION (for context - do NOT repeat its content):\n' +
  (p.description || '').slice(0, 3000) + '\n\n' +
  STYLE_GUIDE + '\n\n' +
  'OUTPUT: Return JSON with id=' + p.id + ' and `section` containing the markdown starting with "## Flash it and run it" and ending with the Common gotchas list. The text will be inserted verbatim into the existing description.',
  { label: 'flash:' + p.name.slice(0, 30), phase: 'Section', schema: SCHEMA }
)))

return { results: results.filter(Boolean), count: results.filter(Boolean).length }
