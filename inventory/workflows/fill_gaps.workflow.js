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
const INVENTORY = `INVENTORY (use exact name verbatim in allocations):

=== Microcontroller boards / SBC ===
- Arduino Uno R3 (CH340 clone, XL) [qty=1] - AVR dev board
- ESP32 NodeMCU-32S [qty=1] - ESP32 dev board
- Seeed XIAO ESP32-C3 [qty=1] - ESP32 dev board
- Orange Pi One (H3) [qty=1] - Single-board Linux

=== Sensors ===
- KY-037 Microphone Sensor [qty=1] - Audio / microphone
- VL53L0X ToF Distance Sensor (GY-VL53L0XV2 compatible) [qty=2] - Distance / ToF
- HC-SR04 Ultrasonic Distance Sensor [qty=2] - Distance / ultrasonic
- KY-003 Hall Switch Sensor [qty=1] - Hall (digital)
- KY-024 Linear Magnetic Hall Sensor [qty=1] - Hall (linear)
- MPU-6500 6-Axis IMU (GY-6500) [qty=2] - IMU (gyro + accel)
- KY-022 IR Receiver Module [qty=1] - IR receiver (~38kHz)
- IR Obstacle Avoidance Module [qty=2] - IR reflective
- TCRT5000 IR Reflective Tracking Module [qty=1] - IR reflective
- KY-018 Photoresistor Module [qty=1] - Light (LDR)
- Photoresistor Module (LM393 comparator) [qty=1] - Light (LDR)
- Soil Moisture Sensor [qty=2] - Moisture
- Optical Slot / Speed Sensor [qty=1] - Optical slot (encoder)
- HC-SR501 PIR Motion Sensor [qty=2] - PIR motion
- HC-SR505 Mini PIR Motion Sensor [qty=2] - PIR motion
- GY-BMP280 Barometric Pressure Sensor [qty=1] - Pressure / altitude
- DHT11 Temperature & Humidity Sensor [qty=2] - Temperature + humidity
- Angle / Tilt Switch (ball) [qty=1] - Tilt switch
- TTP223B Capacitive Touch Module [qty=5] - Touch
- SW-420 Vibration Switch Module [qty=1] - Vibration / tilt
- Voltage Sensor Module (0-25V divider) [qty=1] - Voltage divider
- Raindrop Sensor [qty=1] - Water (resistive comb)
- Water Level Sensor [qty=1] - Water level (resistive comb)

=== Output / interface modules ===
- Breadboard 4.5x9.5cm (~400 tie-points) [qty=2] - Breadboard
- LCD 1602 with I2C Backpack [qty=1] - Character LCD + I2C
- Joystick Module (2-axis + button) [qty=1] - Input / joystick
- KY-008 Red Laser Module (650nm) [qty=1] - Laser emitter
- 8x8 LED Dot-matrix Display (red) [qty=1] - LED matrix
- 4-digit 7-segment Display Module [qty=1] - Numeric display
- 0.96" OLED Display (I2C) [qty=1] - OLED display
- 18650 Charger / Protection Board (TP4056, USB-C) [qty=5] - Power / charger
- Double-Sided Prototype PCB (assorted sizes) [qty=10] - Prototype PCB
- 1-channel Relay Module [qty=1] - Relay
- 2-channel Songle relay module [qty=1] - Relay, optocoupler-isolated
- SG90 Servo (9g micro) [qty=1] - Servo

=== Tactile push-buttons (each variant is its own row) ===
- Tactile Push-button Switch 3x3.5x2mm (4-pin, black) [qty=25] - Tactile push-button
- Tactile Push-button Switch 3x4x2.5mm (binding feet) [qty=25] - Tactile push-button
- Tactile Push-button Switch 3x4x2.5mm (white) [qty=25] - Tactile push-button
- Tactile Push-button Switch 3x4x2mm (2-pin, yellow) [qty=25] - Tactile push-button
- Tactile Push-button Switch 3x6x2.5mm (2-pin, black/white) [qty=25] - Tactile push-button
- Tactile Push-button Switch 3x6x3.1mm (4-pin, black/red) [qty=25] - Tactile push-button
- Tactile Push-button Switch 3x6x4.3mm (white pin) [qty=25] - Tactile push-button
- Tactile Push-button Switch 3x6x5mm (white pin) [qty=25] - Tactile push-button
- Tactile Push-button Switch 4x4x0.8mm (4-pin, black/yellow) [qty=25] - Tactile push-button
- Tactile Push-button Switch 4x4x1.5mm (4-pin, black/yellow) [qty=25] - Tactile push-button

=== Connectors ===
- Pin Header 1x40 Female (2.54mm) [qty=11] - Pin header, 2.54mm
- Pin Header 1x40 Male Breakaway (2.54mm) [qty=11] - Pin header, 2.54mm
- USB-C Female Chassis Connector (2P pigtail) [qty=15] - USB-C

=== Jumper wires ===
- Jumper Wire F-M, 20pc [qty=20] - DuPont jumper
- Jumper Wire M-M, 40pc [qty=40] - DuPont jumper

=== Resistors (1/8W 1% metal film, format: Resistor <value> (1/8W 1%)) ===
- Resistor 1.5K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 1.5M (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 1.8M (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 100K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 100R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 10K (1/8W 1%) [qty=20] - 1/8W 1% metal film
- Resistor 10M (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 10R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 120R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 150K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 150R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 15K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 15R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 180K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 180R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 1K (1/8W 1%) [qty=20] - 1/8W 1% metal film
- Resistor 1M (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 1R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 2.2K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 2.2M (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 2.2R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 220K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 220R (1/8W 1%) [qty=20] - 1/8W 1% metal film
- Resistor 22K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 22R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 270R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 27R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 2M (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 3.9K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 330K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 330R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 33K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 33R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 390R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 39K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 39R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 3K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 4.3M (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 4.7K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 4.7R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 470K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 470R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 47K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 47R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 5.6K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 5.6R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 510R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 560K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 56K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 56R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 6.8K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 680K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 680R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 68K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 68R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 7.5K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 7.5R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 75K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 75R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 8.2K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 8.2R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 820R (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 82K (1/8W 1%) [qty=10] - 1/8W 1% metal film
- Resistor 82R (1/8W 1%) [qty=10] - 1/8W 1% metal film

=== Electrolytic capacitors ===
- Capacitor 1000uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 100uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 100uF 16V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 100uF 25V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 100uF 35V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 100uF 50V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 10uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 120uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 1500uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 150uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 15uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 180uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 1uF 50V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 2200uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 220uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 220uF 25V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 220uF 35V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 22uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 22uF 50V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 270uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 330uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 33uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 390uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 4.7uF 50V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 470uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 470uF 16V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 470uF 25V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 470uF 35V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 47uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 47uF 25V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 47uF 35V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 47uF 50V (electrolytic) [qty=13] - Electrolytic, through-hole
- Capacitor 560uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 56uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 680uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 68uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 820uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole
- Capacitor 82uF (electrolytic, mixed voltage) [qty=13] - Electrolytic, through-hole

=== BC-series TO-92 BJTs ===
- BC327 BJT (TO-92) [qty=20] - BJT, TO-92
- BC337 BJT (TO-92) [qty=20] - BJT, TO-92
- BC517 BJT (TO-92) [qty=20] - BJT, TO-92
- BC547 BJT (TO-92) [qty=20] - BJT, TO-92
- BC548 BJT (TO-92) [qty=20] - BJT, TO-92
- BC549 BJT (TO-92) [qty=20] - BJT, TO-92
- BC550 BJT (TO-92) [qty=20] - BJT, TO-92
- BC556 BJT (TO-92) [qty=20] - BJT, TO-92
- BC557 BJT (TO-92) [qty=20] - BJT, TO-92
- BC558 BJT (TO-92) [qty=20] - BJT, TO-92

=== Integrated circuits ===
- LM386 Audio Power Amp [qty=13] - Audio amplifier
- TDA2030A Audio Power Amp [qty=2] - Audio amplifier
- TDA2822D Audio Power Amp [qty=5] - Audio amplifier
- ICL7660S Charge-pump Inverter [qty=2] - Charge-pump regulator
- LM339 Comparator (quad) [qty=10] - Comparator
- LM393 Comparator (dual) [qty=19] - Comparator
- ULN2003AN Darlington Array (7-ch) [qty=13] - Darlington array
- ULN2803APG Darlington Array (8-ch) [qty=14] - Darlington array
- LM324 Op-Amp (quad) [qty=19] - Op-amp
- LM358 Op-Amp (dual) [qty=17] - Op-amp
- UA741 Op-Amp [qty=9] - Op-amp
- JRC4558 Op-Amp [qty=10] - Op-amp (audio)
- NE5532 Op-Amp (audio dual) [qty=13] - Op-amp (audio)
- PC817 Optocoupler [qty=14] - Optocoupler
- UC3842AN PWM Controller [qty=5] - PWM controller
- UC3843AN PWM Controller [qty=5] - PWM controller
- NE555 Timer IC [qty=14] - Timer

=== Linear voltage regulators (TO-220) ===
- L7805 Linear Regulator (+5V) [qty=5] - Linear, TO-220
- L7806 Linear Regulator (+6V) [qty=5] - Linear, TO-220
- L7808 Linear Regulator (+8V) [qty=5] - Linear, TO-220
- L7809 Linear Regulator (+9V) [qty=5] - Linear, TO-220
- L7810 Linear Regulator (+10V) [qty=5] - Linear, TO-220
- L7812 Linear Regulator (+12V) [qty=5] - Linear, TO-220
- L7815 Linear Regulator (+15V) [qty=5] - Linear, TO-220
- L7818 Linear Regulator (+18V) [qty=5] - Linear, TO-220
- L7824 Linear Regulator (+24V) [qty=5] - Linear, TO-220
- LM317T Adjustable Regulator [qty=5] - Linear, TO-220

=== Discrete components (LEDs) ===
- LED 5mm Blue [qty=5] - LED, 5mm through-hole
- LED 5mm Green [qty=5] - LED, 5mm through-hole
- LED 5mm Red [qty=5] - LED, 5mm through-hole
- LED 5mm Yellow [qty=5] - LED, 5mm through-hole

Notes:
- Orange Pi One is NOT YET BOOTED - skip for microcontroller projects.
- ESP32 boards are 3.3V GPIO. Arduino Uno is 5V GPIO.
- ESP32 WiFi SSID is GeeFam. Use placeholder PASSWORD_HERE for password in code.
- 2-channel Songle relay: LOW-VOLTAGE DC ONLY, no mains AC.
- LEDs need a 220R-470R current-limiting resistor.
- Projects already in the system (avoid duplicating):
    - Reaction-time game (Sandy's first build)
    - Bedroom Temperature Dashboard
    - Mood Meter (touch the dot, change your face)
    - Theremin Lite
    - Don't-Touch-The-Wire steady-hand maze
    - Temperature Mood Dial
    - Shake-to-roll electronic D6 dice
    - Motion-Triggered Jump Scare Box
    - Hidden-Magnet Treasure Hunter
    - Plant SOS
    - Earthquake Cam
    - Simon Says - 4-color memory game
    - Stopwatch + Lap Memory on Serial Monitor
    - Family Doorbell Web Page
    - Garage Light Web Switch (with Relay)
    - WiFi Signal Strength Meter on OLED
    - Distance-Triggered Treat Dispenser
    - Mailbox-Opened Pinger
    - OLED Spirit Level
    - Two-ESP32 Walkie-Talkie Lights
    - Hallway Weather Window
`

// Inlined at build time from /tmp/targets.json
const TARGETS = [
    {
        "name": "Orange Pi One (H3)",
        "category": "Board",
        "subcategory": "Single-board Linux",
        "notes": "Not yet booted. Design an intermediate Andy-only project that assumes the Pi is freshly flashed with Armbian + Mosquitto, and runs an MQTT broker that an ESP32 (NodeMCU or XIAO) publishes sensor readings to. Wiring diagram should show network topology rather than breadboard wiring."
    },
    {
        "name": "Joystick Module (2-axis + button)",
        "category": "Module",
        "subcategory": "Input \/ joystick"
    },
    {
        "name": "KY-008 Red Laser Module (650nm)",
        "category": "Module",
        "subcategory": "Laser emitter"
    },
    {
        "name": "Double-Sided Prototype PCB (assorted sizes)",
        "category": "Module",
        "subcategory": "Prototype PCB",
        "notes": "Soldering IS allowed for this one project only - frame it as Andys intermediate solo project to make an existing breadboard build (e.g. the reaction-time game) permanent on a proto PCB. State soldering up front in the description."
    },
    {
        "name": "KY-037 Microphone Sensor",
        "category": "Sensor",
        "subcategory": "Audio \/ microphone"
    },
    {
        "name": "VL53L0X ToF Distance Sensor (GY-VL53L0XV2 compatible)",
        "category": "Sensor",
        "subcategory": "Distance \/ ToF"
    },
    {
        "name": "KY-003 Hall Switch Sensor",
        "category": "Sensor",
        "subcategory": "Hall (digital)"
    },
    {
        "name": "KY-022 IR Receiver Module",
        "category": "Sensor",
        "subcategory": "IR receiver (~38kHz)"
    },
    {
        "name": "IR Obstacle Avoidance Module",
        "category": "Sensor",
        "subcategory": "IR reflective"
    },
    {
        "name": "TCRT5000 IR Reflective Tracking Module",
        "category": "Sensor",
        "subcategory": "IR reflective"
    },
    {
        "name": "KY-018 Photoresistor Module",
        "category": "Sensor",
        "subcategory": "Light (LDR)",
        "notes": "Make this distinct from the LM393 photoresistor project. Suggest: outdoor\/porch-style night-light triggered by darkness."
    },
    {
        "name": "Photoresistor Module (LM393 comparator)",
        "category": "Sensor",
        "subcategory": "Light (LDR)",
        "notes": "Make this distinct from the KY-018 project. Suggest: indoor dim-light alarm or laser-tripwire pair with the KY-008 laser."
    },
    {
        "name": "Optical Slot \/ Speed Sensor",
        "category": "Sensor",
        "subcategory": "Optical slot (encoder)"
    },
    {
        "name": "HC-SR505 Mini PIR Motion Sensor",
        "category": "Sensor",
        "subcategory": "PIR motion"
    },
    {
        "name": "GY-BMP280 Barometric Pressure Sensor",
        "category": "Sensor",
        "subcategory": "Pressure \/ altitude"
    },
    {
        "name": "Voltage Sensor Module (0-25V divider)",
        "category": "Sensor",
        "subcategory": "Voltage divider"
    },
    {
        "name": "Raindrop Sensor",
        "category": "Sensor",
        "subcategory": "Water (resistive comb)"
    },
    {
        "name": "Water Level Sensor",
        "category": "Sensor",
        "subcategory": "Water level (resistive comb)"
    }
]

const CONVENTIONS = [
  'Each project record must contain:',
  '- name: short, distinctive (<= 60 chars). Must NOT duplicate an existing project listed in the inventory snapshot.',
  '- power_supply: one-line plain-English description of how the project is powered.',
  '- description: markdown body with these sections in order:',
  '    ## Parts list',
  '    ## Wiring notes',
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
  '- Audience: Andy (adult beginner) sometimes with his 10-year-old son. NO soldering except where the target.notes field explicitly allows it.',
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
