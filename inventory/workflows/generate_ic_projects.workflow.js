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
    - MQTT Home: Pi broker + XIAO sensor publisher
    - Joystick Doodle Pad on OLED
    - Laser Tripwire Alarm
    - Reaction-Time Game v2 (Proto PCB Edition)
    - Clap-O-Meter (Live Sound Bar Graph)
    - Laser Posture Coach (desk slouch detector)
    - Magnet Swipe Counter on OLED
    - TV Remote LED Color Picker
    - Invisible Tripwire Alarm with OLED Face
    - Piggy Bank Coin Counter (TCRT5000 + OLED)
    - Porch Night-Light (KY-018 dusk-to-dawn fader)
    - Laser Tripwire Alarm (LDR + KY-008 pair)
    - Coin Drop Counter (optical slot + OLED)
    - Stealth Timer - hold still or the LED dies
    - Storm Glass - 3-hour pressure trend forecaster
    - Pocket Battery Health Monitor (OLED + LEDs)
    - Raindrop Reporter - live wetness on OLED
    - Tub Filler Traffic Light
`
const EXISTING_PROJECTS = ["Reaction-time game (Sandy's first build)","Bedroom Temperature Dashboard","Mood Meter (touch the dot, change your face)","Theremin Lite","Don't-Touch-The-Wire steady-hand maze","Temperature Mood Dial","Shake-to-roll electronic D6 dice","Motion-Triggered Jump Scare Box","Hidden-Magnet Treasure Hunter","Plant SOS","Earthquake Cam","Simon Says - 4-color memory game","Stopwatch + Lap Memory on Serial Monitor","Family Doorbell Web Page","Garage Light Web Switch (with Relay)","WiFi Signal Strength Meter on OLED","Distance-Triggered Treat Dispenser","Mailbox-Opened Pinger","OLED Spirit Level","Two-ESP32 Walkie-Talkie Lights","Hallway Weather Window","MQTT Home: Pi broker + XIAO sensor publisher","Joystick Doodle Pad on OLED","Laser Tripwire Alarm","Reaction-Time Game v2 (Proto PCB Edition)","Clap-O-Meter (Live Sound Bar Graph)","Laser Posture Coach (desk slouch detector)","Magnet Swipe Counter on OLED","TV Remote LED Color Picker","Invisible Tripwire Alarm with OLED Face","Piggy Bank Coin Counter (TCRT5000 + OLED)","Porch Night-Light (KY-018 dusk-to-dawn fader)","Laser Tripwire Alarm (LDR + KY-008 pair)","Coin Drop Counter (optical slot + OLED)","Stealth Timer - hold still or the LED dies","Storm Glass - 3-hour pressure trend forecaster","Pocket Battery Health Monitor (OLED + LEDs)","Raindrop Reporter - live wetness on OLED","Tub Filler Traffic Light"]

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
