<?php
/**
 * Drop, recreate, and reseed the edgedevices schema.
 * Run from a shell:  php seed.php
 *
 * Re-running wipes items, projects, and allocations and reseeds from scratch.
 * Safe right now because nothing is allocated. DO NOT re-run after you start
 * using the app - edit through the web UI instead.
 *
 * Quantity assumptions for assortment kits (verify on physical sort):
 * - 64-value resistor kit (line 6):          10 of each, exactly as listed.
 * - 200-pc BC-series transistor kit (l. 14): 20 of each.
 * - 250-pc tactile-switch kit (l. 10):       25 of each variant.
 * - 50-pc voltage-regulator kit (l. 12):     5 of each.
 * - 190-pc electrolytic kit (l. 13):         ~13 each across 15 V/value combos.
 * - 300-pc electrolytic kit (l. 5):          source says "23 values 10-2200uF" only;
 *                                            we picked 23 plausible values, ~13 each.
 * - 85-pc IC kit (l. 15) + XL IC kit (l. 8): merged by part where they overlap.
 * - 22-pc mixed pin-header pack (l. 9):      split 11/11 male/female pending count.
 *
 * Where the source listed the same module on multiple lines (e.g. DHT11 on
 * lines 17 and 51), quantities are summed and a note explains the merge.
 */
declare(strict_types=1);

require_once __DIR__ . '/src/db.php';
require_once __DIR__ . '/src/helpers.php';

$skipItems   = in_array('--empty',  $argv, true);
$dropProject_tags = in_array('--with-project-tags-table', $argv, true);

$pdo = db();

echo "Dropping existing tables ...\n";
$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
$pdo->exec('DROP TABLE IF EXISTS project_tags');
$pdo->exec('DROP TABLE IF EXISTS item_tags');
$pdo->exec('DROP TABLE IF EXISTS tags');
$pdo->exec('DROP TABLE IF EXISTS allocations');
$pdo->exec('DROP TABLE IF EXISTS projects');
$pdo->exec('DROP TABLE IF EXISTS items');
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

echo "Creating schema ...\n";
$pdo->exec(<<<'SQL'
CREATE TABLE items (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(100) DEFAULT NULL,
    subcategory VARCHAR(255) DEFAULT NULL,
    value       VARCHAR(100) DEFAULT NULL,
    qty_total   INT NOT NULL DEFAULT 0,
    image_path  VARCHAR(255) DEFAULT NULL,
    notes       TEXT         DEFAULT NULL,
    added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_items_qty CHECK (qty_total >= 0),
    KEY idx_items_category (category),
    KEY idx_items_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
);

$pdo->exec(<<<'SQL'
CREATE TABLE projects (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    name              VARCHAR(255) NOT NULL UNIQUE,
    description       TEXT         DEFAULT NULL,
    wiring_diagram    TEXT         DEFAULT NULL,
    breadboard_layout TEXT         DEFAULT NULL,
    code              TEXT         DEFAULT NULL,
    code_language     VARCHAR(32)  DEFAULT 'cpp',
    power_supply      VARCHAR(255) DEFAULT NULL,
    difficulty        VARCHAR(32)  DEFAULT NULL,
    learning_concepts TEXT         DEFAULT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
);

$pdo->exec(<<<'SQL'
CREATE TABLE allocations (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    item_id    INT NOT NULL,
    project_id INT NOT NULL,
    qty        INT NOT NULL,
    notes      TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_item_project (item_id, project_id),
    CONSTRAINT chk_alloc_qty CHECK (qty > 0),
    KEY idx_alloc_item (item_id),
    KEY idx_alloc_project (project_id),
    CONSTRAINT fk_alloc_item    FOREIGN KEY (item_id)    REFERENCES items(id)    ON DELETE CASCADE,
    CONSTRAINT fk_alloc_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
);

$pdo->exec(<<<'SQL'
CREATE TABLE tags (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(64) NOT NULL,
    slug       VARCHAR(64) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
);

$pdo->exec(<<<'SQL'
CREATE TABLE item_tags (
    item_id INT NOT NULL,
    tag_id  INT NOT NULL,
    PRIMARY KEY (item_id, tag_id),
    KEY idx_item_tags_tag (tag_id),
    CONSTRAINT fk_it_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_it_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
);

$pdo->exec(<<<'SQL'
CREATE TABLE project_tags (
    project_id INT NOT NULL,
    tag_id     INT NOT NULL,
    PRIMARY KEY (project_id, tag_id),
    KEY idx_project_tags_tag (tag_id),
    CONSTRAINT fk_pt_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_tag     FOREIGN KEY (tag_id)     REFERENCES tags(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
);


// Build the item list. Each row: [name, category, subcategory, value, qty, notes]
$items = [];

// Existing edge-device boards (from Edge-Devices/CLAUDE.md, not in new-stocks.txt).
array_push($items,
    ['ESP32 NodeMCU-32S', 'Board', 'ESP32 dev board', 'ESP32-WROOM-32', 1,
     'Primary learning board.'],
    ['Seeed XIAO ESP32-C3', 'Board', 'ESP32 dev board', 'ESP32-C3', 1,
     'Tiny; USB-C; 11 GPIO. Verified working at 192.168.88.30.'],
    ['Orange Pi One (H3)', 'Board', 'Single-board Linux', 'Allwinner H3', 1,
     'Hub (planned). Not booted yet; needs 5V/2A barrel PSU and microSD.'],
    ['2-channel Songle relay module', 'Module', 'Relay, optocoupler-isolated',
     'SRD-05VDC-SL-C x2', 1,
     'Active-LOW (low-level trigger). JDVcc-Vcc jumper currently in place.'],
);

// new-stocks.txt lines 1-4 (TTP223B from line 3 merged below).
array_push($items,
    ['VL53L0X ToF Distance Sensor (GY-VL53L0XV2 compatible)',
     'Sensor', 'Distance / ToF', 'VL53L0X', 2, 'I2C, 940nm laser. D-FLIFE.'],
    ['MPU-6500 6-Axis IMU (GY-6500)',
     'Sensor', 'IMU (gyro + accel)', 'MPU-6500', 2, 'I2C/SPI, low power.'],
    ['HC-SR505 Mini PIR Motion Sensor',
     'Sensor', 'PIR motion', 'HC-SR505', 2,
     'Mini variant; distinct from the larger HC-SR501.'],
);

// Line 5: 300pc electrolytic kit, 23 mixed values 10uF-2200uF (best-guess values).
$line5 = ['10uF','15uF','22uF','33uF','47uF','56uF','68uF','82uF',
          '100uF','120uF','150uF','180uF','220uF','270uF','330uF',
          '390uF','470uF','560uF','680uF','820uF','1000uF','1500uF','2200uF'];
foreach ($line5 as $v) {
    $items[] = ["Capacitor $v (electrolytic, mixed voltage)",
        'Capacitor', 'Electrolytic, through-hole', $v, 13,
        'From 300pc kit (23 values, 10uF-2200uF). Voltage rating unspecified; verify on physical sort.'];
}

// Line 6: 640pc resistor kit, 64 values, 10 each, 1/8W 1% metal film.
$resistors = [
    '1R','2.2R','4.7R','5.6R','7.5R','8.2R','10R','15R','22R','27R','33R','39R',
    '47R','56R','68R','75R','82R','100R','120R','150R','180R','220R','270R',
    '330R','390R','470R','510R','680R','820R',
    '1K','1.5K','2.2K','3K','3.9K','4.7K','5.6K','6.8K','7.5K','8.2K',
    '10K','15K','22K','33K','39K','47K','56K','68K','75K','82K','680K',
    '100K','150K','180K','220K','330K','470K','560K',
    '1M','1.5M','1.8M','2M','2.2M','4.3M','10M',
];
foreach ($resistors as $v) {
    $items[] = ["Resistor $v (1/8W 1%)",
        'Resistor', '1/8W 1% metal film', $v, 10, 'From 640pc kit.'];
}
// Line 53 small pack: +10 each of 220R / 1K / 10K (applied at insert).
$extraResistors = ['220R' => 10, '1K' => 10, '10K' => 10];

// Line 7
$items[] = ['USB-C Female Chassis Connector (2P pigtail)',
    'Connector', 'USB-C', '2-pin pigtail, 3A', 15,
    'Dealikee; flat open-end bare-wire.'];

// Lines 8 + 15: IC kits merged.
array_push($items,
    ['NE555 Timer IC',                     'IC', 'Timer',                 'NE555',     14, 'XL IC kit (~5) + 85pc set (~9). Verify.'],
    ['LM358 Op-Amp (dual)',                'IC', 'Op-amp',                'LM358',     17, 'XL IC kit (10) + 85pc set (~7).'],
    ['LM324 Op-Amp (quad)',                'IC', 'Op-amp',                'LM324',     19, 'XL IC kit (10) + 85pc set (~9).'],
    ['LM393 Comparator (dual)',            'IC', 'Comparator',            'LM393',     19, 'XL IC kit (10) + 85pc set (~9).'],
    ['LM339 Comparator (quad)',            'IC', 'Comparator',            'LM339',     10, 'XL IC kit.'],
    ['JRC4558 Op-Amp',                     'IC', 'Op-amp (audio)',        'JRC4558',   10, 'XL IC kit.'],
    ['NE5532 Op-Amp (audio dual)',         'IC', 'Op-amp (audio)',        'NE5532',    13, 'XL IC kit (5) + 85pc set (~8).'],
    ['UA741 Op-Amp',                       'IC', 'Op-amp',                'UA741',     9,  '85pc set.'],
    ['LM386 Audio Power Amp',              'IC', 'Audio amplifier',       'LM386',     13, 'XL IC kit (5) + 85pc set (~8).'],
    ['TDA2030A Audio Power Amp',           'IC', 'Audio amplifier',       'TDA2030A',  2,  'XL IC kit.'],
    ['TDA2822D Audio Power Amp',           'IC', 'Audio amplifier',       'TDA2822D',  5,  'XL IC kit.'],
    ['PC817 Optocoupler',                  'IC', 'Optocoupler',           'PC817',     14, 'XL IC kit (~5) + 85pc set (~9). Verify.'],
    ['ICL7660S Charge-pump Inverter',      'IC', 'Charge-pump regulator', 'ICL7660S',  2,  'XL IC kit.'],
    ['UC3842AN PWM Controller',            'IC', 'PWM controller',        'UC3842AN',  5,  'XL IC kit.'],
    ['UC3843AN PWM Controller',            'IC', 'PWM controller',        'UC3843AN',  5,  'XL IC kit.'],
    ['ULN2003AN Darlington Array (7-ch)',  'IC', 'Darlington array',      'ULN2003AN', 13, 'XL IC kit (5) + 85pc set (~8).'],
    ['ULN2803APG Darlington Array (8-ch)', 'IC', 'Darlington array',      'ULN2803APG',14, 'XL IC kit (5) + 85pc set (~9).'],
);

// Lines 11/12: voltage-regulator kit (lines 11 and 12 appear to be the same kit).
array_push($items,
    ['LM317T Adjustable Regulator',   'Voltage regulator', 'Linear, TO-220', 'LM317T', 5, 'Adjustable 1.2-37V.'],
    ['L7805 Linear Regulator (+5V)',  'Voltage regulator', 'Linear, TO-220', '7805',   5, null],
    ['L7806 Linear Regulator (+6V)',  'Voltage regulator', 'Linear, TO-220', '7806',   5, null],
    ['L7808 Linear Regulator (+8V)',  'Voltage regulator', 'Linear, TO-220', '7808',   5, null],
    ['L7809 Linear Regulator (+9V)',  'Voltage regulator', 'Linear, TO-220', '7809',   5, null],
    ['L7810 Linear Regulator (+10V)', 'Voltage regulator', 'Linear, TO-220', '7810',   5, null],
    ['L7812 Linear Regulator (+12V)', 'Voltage regulator', 'Linear, TO-220', '7812',   5, null],
    ['L7815 Linear Regulator (+15V)', 'Voltage regulator', 'Linear, TO-220', '7815',   5, null],
    ['L7818 Linear Regulator (+18V)', 'Voltage regulator', 'Linear, TO-220', '7818',   5, null],
    ['L7824 Linear Regulator (+24V)', 'Voltage regulator', 'Linear, TO-220', '7824',   5, null],
);

// Line 13: 190pc electrolytic kit, 15 voltage/value combos, ~13 each.
$electroKit = [
    ['16V', '100uF'], ['16V', '470uF'],
    ['25V', '47uF'],  ['25V', '100uF'],  ['25V', '220uF'],  ['25V', '470uF'],
    ['35V', '47uF'],  ['35V', '100uF'],  ['35V', '220uF'],  ['35V', '470uF'],
    ['50V', '1uF'],   ['50V', '4.7uF'],  ['50V', '22uF'],   ['50V', '47uF'],   ['50V', '100uF'],
];
foreach ($electroKit as [$voltage, $cap]) {
    $items[] = ["Capacitor $cap $voltage (electrolytic)",
        'Capacitor', 'Electrolytic, through-hole', "$cap / $voltage", 13,
        'From 190pc 15-spec kit.'];
}

// Line 14: 200pc BC-series transistor kit.
foreach (['BC327','BC337','BC517','BC547','BC548','BC549','BC550','BC556','BC557','BC558'] as $t) {
    $items[] = ["$t BJT (TO-92)", 'Transistor', 'BJT, TO-92', $t, 20,
                'From 200pc BC-series kit.'];
}

// Line 10: 250pc tactile-switch kit.
$tactile = [
    '3x4x2.5mm (binding feet)',
    '3x4x2.5mm (white)',
    '3x6x4.3mm (white pin)',
    '3x6x5mm (white pin)',
    '3x4x2mm (2-pin, yellow)',
    '3x3.5x2mm (4-pin, black)',
    '4x4x1.5mm (4-pin, black/yellow)',
    '4x4x0.8mm (4-pin, black/yellow)',
    '3x6x2.5mm (2-pin, black/white)',
    '3x6x3.1mm (4-pin, black/red)',
];
foreach ($tactile as $v) {
    $items[] = ["Tactile Push-button Switch $v", 'Switch', 'Tactile push-button', $v, 25,
                'From 250pc kit.'];
}

// Line 9: 22pc mixed M/F pin headers (split 11/11 pending count).
array_push($items,
    ['Pin Header 1x40 Male Breakaway (2.54mm)',
     'Connector', 'Pin header, 2.54mm', '1x40 male', 11,
     'From 22pc GUDYIR mixed pack; verify M/F split.'],
    ['Pin Header 1x40 Female (2.54mm)',
     'Connector', 'Pin header, 2.54mm', '1x40 female', 11,
     'From 22pc GUDYIR mixed pack; verify M/F split.'],
);

// Lines 17-37 + 39-62: sensors, modules, consumables. Duplicates merged.
array_push($items,
    ['DHT11 Temperature & Humidity Sensor',
     'Sensor', 'Temperature + humidity', 'DHT11', 2,
     'Lines 17 + 51 (two orders).'],
    ['HC-SR501 PIR Motion Sensor',
     'Sensor', 'PIR motion', 'HC-SR501', 2,
     "Lines 18 ('SR501') + 45 ('HC-SR501')."],
    ['GY-BMP280 Barometric Pressure Sensor',
     'Sensor', 'Pressure / altitude', 'BMP280', 1,
     'I2C; also reads temperature.'],
    ['Photoresistor Module (LM393 comparator)',
     'Sensor', 'Light (LDR)', 'LM393 + LDR', 1,
     'Line 20. Likely the same module as KY-018 below; merge after physical inspection.'],
    ['KY-018 Photoresistor Module',
     'Sensor', 'Light (LDR)', 'KY-018', 1,
     'Line 32. See note on the other photoresistor entry.'],
    ['Soil Moisture Sensor',
     'Sensor', 'Moisture', '(generic resistive)', 2,
     'Lines 21 + 54 (two orders).'],
    ['KY-008 Red Laser Module (650nm)',
     'Module', 'Laser emitter', 'KY-008', 1, null],
    ['TTP223B Capacitive Touch Module',
     'Sensor', 'Touch', 'TTP223B', 5,
     'Line 3 (3x) + lines 23 and 50 (1x each).'],
    ['Water Level Sensor',
     'Sensor', 'Water level (resistive comb)', '(generic)', 1, null],
    ['Voltage Sensor Module (0-25V divider)',
     'Sensor', 'Voltage divider', '(generic)', 1,
     'Resistive divider for ADC measurement up to ~25V.'],
    ['Optical Slot / Speed Sensor',
     'Sensor', 'Optical slot (encoder)', '(generic)', 1, null],
    ['KY-024 Linear Magnetic Hall Sensor',
     'Sensor', 'Hall (linear)', 'KY-024', 1, null],
    ['HC-SR04 Ultrasonic Distance Sensor',
     'Sensor', 'Distance / ultrasonic', 'HC-SR04', 2,
     'Lines 28 + 41 (two orders).'],
    ['SW-420 Vibration Switch Module',
     'Sensor', 'Vibration / tilt', 'SW-420', 1, null],
    ['TCRT5000 IR Reflective Tracking Module',
     'Sensor', 'IR reflective', 'TCRT5000', 1,
     'Line-following / object presence.'],
    ['KY-037 Microphone Sensor',
     'Sensor', 'Audio / microphone', 'KY-037', 1,
     'High-sensitivity electret + LM393 comparator.'],
    ['IR Obstacle Avoidance Module',
     'Sensor', 'IR reflective', 'FC-51 (generic)', 2,
     'Lines 33 + 52 (two orders).'],
    ['Raindrop Sensor',
     'Sensor', 'Water (resistive comb)', '(generic)', 1, null],
    ['Angle / Tilt Switch (ball)',
     'Sensor', 'Tilt switch', '(generic)', 1, null],
    ['KY-022 IR Receiver Module',
     'Sensor', 'IR receiver (~38kHz)', 'KY-022', 1,
     'For decoding TV-remote-style signals.'],
    ['KY-003 Hall Switch Sensor',
     'Sensor', 'Hall (digital)', 'KY-003', 1, null],

    // Boards and modules
    ['Arduino Uno R3 (CH340 clone, XL)',
     'Board', 'AVR dev board', 'ATmega328P + CH340', 1,
     'Generic Uno R3 clone, CH340 USB chip.'],
    ['Breadboard 4.5x9.5cm (~400 tie-points)',
     'Module', 'Breadboard', 'Half-size', 2, 'Solderless prototyping.'],
    ['LCD 1602 with I2C Backpack',
     'Module', 'Character LCD + I2C', 'HD44780 + PCF8574', 1,
     '16x2 character LCD; I2C address usually 0x27 or 0x3F.'],
    ['SG90 Servo (9g micro)',
     'Module', 'Servo', 'SG90', 1, '180-degree micro servo.'],
    ['1-channel Relay Module',
     'Module', 'Relay', 'SRD-05VDC-SL-C x1', 1,
     'Single relay; same Songle family as the 2-channel board.'],
    ['0.96" OLED Display (I2C)',
     'Module', 'OLED display', 'SSD1306, 128x64', 1, 'I2C, monochrome.'],
    ['Joystick Module (2-axis + button)',
     'Module', 'Input / joystick', 'KY-023', 1,
     'Analog X/Y + push-button switch.'],
    ['8x8 LED Dot-matrix Display (red)',
     'Module', 'LED matrix', '1088AS or similar', 1,
     'May need a MAX7219 driver.'],
    ['4-digit 7-segment Display Module',
     'Module', 'Numeric display', '(likely TM1637)', 1, null],

    // Cables and consumables
    ['Jumper Wire F-M, 20pc', 'Cable', 'DuPont jumper', 'Female-Male, ~20cm', 20, null],
    ['Jumper Wire M-M, 40pc', 'Cable', 'DuPont jumper', 'Male-Male, ~20cm',   40, null],
    ['LED 5mm Green',  'Component', 'LED, 5mm through-hole', 'Green',  5, null],
    ['LED 5mm Blue',   'Component', 'LED, 5mm through-hole', 'Blue',   5, null],
    ['LED 5mm Yellow', 'Component', 'LED, 5mm through-hole', 'Yellow', 5, null],
    ['LED 5mm Red',    'Component', 'LED, 5mm through-hole', 'Red',    5, null],
    ['18650 Charger / Protection Board (TP4056, USB-C)',
     'Module', 'Power / charger', 'TP4056 USB-C', 5,
     'Single-cell 3.7V Li-ion charge + discharge protection.'],
    ['Double-Sided Prototype PCB (assorted sizes)',
     'Module', 'Prototype PCB', '5 sizes, mixed', 10,
     'Through-hole universal proto boards.'],
);


if ($skipItems) {
    echo "--empty given, skipping inventory seed. Schema is ready; add items via the web UI or via examples/inventory.json.\n";
    return;
}

echo "Inserting items and deriving tags ...\n";
$stmt = $pdo->prepare(
    'INSERT INTO items (name, category, subcategory, value, qty_total, notes)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$tagUpsert = $pdo->prepare('INSERT IGNORE INTO tags (name, slug) VALUES (?, ?)');
$tagFind   = $pdo->prepare('SELECT id FROM tags WHERE slug = ?');
$tagLink   = $pdo->prepare('INSERT IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)');

$inserted   = 0;
$tagCache   = []; // slug => id
$linkCount  = 0;

foreach ($items as [$name, $cat, $sub, $val, $qty, $notes]) {
    if ($cat === 'Resistor' && isset($extraResistors[$val])) {
        $qty += $extraResistors[$val];
        $tag = 'Includes 10x extra from the small line-53 pack.';
        $notes = $notes ? "$notes $tag" : $tag;
    }
    $stmt->execute([$name, $cat, $sub, $val, $qty, $notes]);
    $itemId = (int) $pdo->lastInsertId();
    $inserted++;

    foreach (derive_initial_tags($cat, $sub) as $tagName) {
        $slug = tag_slug($tagName);
        if ($slug === '') {
            continue;
        }
        if (!isset($tagCache[$slug])) {
            $tagUpsert->execute([$tagName, $slug]);
            $tagFind->execute([$slug]);
            $tagCache[$slug] = (int) $tagFind->fetchColumn();
        }
        $tagLink->execute([$itemId, $tagCache[$slug]]);
        $linkCount++;
    }
}

echo "Inserted $inserted items.\n";
echo "Created " . count($tagCache) . " unique tags, $linkCount item-tag links.\n";
