<?php
/**
 * Take the JSON output of the generate-edge-device-projects workflow and
 * write each project + its allocations into MariaDB.
 *
 * Usage:
 *   php _insert_generated_projects.php <path-to-workflow-output.json>
 *
 * The JSON is expected to look like:
 *   { "projects": [ {...}, ... ], "count": N, "selection_rationale": "..." }
 *
 * Per project: name, power_supply, description, wiring_diagram, code,
 *              code_language, difficulty (read-only here), allocations: [{ item_name, qty, notes }]
 *
 * Behaviour:
 * - Inserts as status='planning' so they don't all show as 'active'.
 * - On name collision with an existing project, appends " (v2)", "(v3)", ...
 * - Item names that don't match anything in `items` are reported (not fatal).
 * - Same (item, project) pair allocated more than once gets qty summed via ON DUPLICATE KEY.
 */
declare(strict_types=1);
require_once __DIR__ . '/src/db.php';
require_once __DIR__ . '/src/helpers.php';

$path = $argv[1] ?? null;
if (!$path || !file_exists($path)) {
    fwrite(STDERR, "Usage: php _insert_generated_projects.php <path-to-json>\n");
    exit(1);
}

$json = file_get_contents($path);
$data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
$projects = $data['projects'] ?? [];

if (!is_array($projects) || count($projects) === 0) {
    fwrite(STDERR, "No projects in input JSON.\n");
    exit(1);
}

$pdo = db();
$lookupItem  = $pdo->prepare('SELECT id FROM items WHERE name = ?');

// Common name variants the agents produce. Map agent's name -> canonical inventory name,
// or null if the part isn't tracked (will be silently dropped from allocations).
$ITEM_ALIASES = [
    // Boards
    'XIAO ESP32-C3'                => 'Seeed XIAO ESP32-C3',
    'ESP32 NodeMCU'                => 'ESP32 NodeMCU-32S',
    'Arduino Uno'                  => 'Arduino Uno R3 (CH340 clone, XL)',
    'ESP32-CAM'                    => 'ESP32-CAM with MB programmer base',
    'ESP32-CAM (MB)'               => 'ESP32-CAM with MB programmer base',
    'ESP32-CAM Module'             => 'ESP32-CAM with MB programmer base',
    'ESP32-CAM Development Board'  => 'ESP32-CAM with MB programmer base',
    'ESP32-CAM bare'               => 'ESP32-CAM (bare module)',
    'NodeMCU V3'                   => 'NodeMCU V3 (ESP8266, CH340G)',
    'NodeMCU'                      => 'NodeMCU V3 (ESP8266, CH340G)',
    'NodeMCU V3 ESP8266'           => 'NodeMCU V3 (ESP8266, CH340G)',
    'NodeMCU ESP8266 V3'           => 'NodeMCU V3 (ESP8266, CH340G)',
    'NodeMCU V3 I/O Shield'        => 'NodeMCU V3 I/O Shield (pin breakout)',
    'NodeMCU I/O Shield'           => 'NodeMCU V3 I/O Shield (pin breakout)',
    'ESP-01S'                      => 'ESP-01S WiFi Module',
    'ESP-01S Module'               => 'ESP-01S WiFi Module',
    'ESP8266 ESP-01S'              => 'ESP-01S WiFi Module',

    // New modules
    'ESP-01S Relay Module'         => 'ESP-01S 5V Relay Module (Tasmota-ready)',
    'ESP-01S 5V Relay'             => 'ESP-01S 5V Relay Module (Tasmota-ready)',
    'Tasmota Relay'                => 'ESP-01S 5V Relay Module (Tasmota-ready)',
    'W1209'                        => 'W1209 Temperature Controller',
    'W1209 Thermostat'             => 'W1209 Temperature Controller',
    'W1209 Temperature Module'     => 'W1209 Temperature Controller',
    'CP2102'                       => 'CP2102 USB-to-TTL UART Module',
    'CP2102 USB-to-Serial'         => 'CP2102 USB-to-TTL UART Module',
    'USB-to-TTL Adapter'           => 'CP2102 USB-to-TTL UART Module',
    'MB102'                        => 'MB102 Breadboard Power Supply Module',
    'MB102 Power Supply'           => 'MB102 Breadboard Power Supply Module',
    'Breadboard PSU'               => 'MB102 Breadboard Power Supply Module',
    'Buck Converter'               => '6-24V to 5V 3A USB Buck Converter',
    'DC-DC Buck Converter'         => '6-24V to 5V 3A USB Buck Converter',
    '6-24V Buck Converter'         => '6-24V to 5V 3A USB Buck Converter',

    // New components
    'TEC1-4905'                    => 'TEC1-4905 Peltier Thermoelectric Cooler',
    'Peltier'                      => 'TEC1-4905 Peltier Thermoelectric Cooler',
    'Peltier Module'               => 'TEC1-4905 Peltier Thermoelectric Cooler',
    'TEC Peltier'                  => 'TEC1-4905 Peltier Thermoelectric Cooler',
    'WH148 Potentiometer'          => 'WH148 10K Stereo Potentiometer (B10K)',
    'WH148 10K'                    => 'WH148 10K Stereo Potentiometer (B10K)',
    'Stereo Potentiometer'         => 'WH148 10K Stereo Potentiometer (B10K)',
    'Dual-gang 10K Potentiometer'  => 'WH148 10K Stereo Potentiometer (B10K)',
    '0.56\" 7-Segment LED Display' => '0.56" Red 7-Segment LED Display (1 digit)',
    '1-digit 7-Segment Display'    => '0.56" Red 7-Segment LED Display (1 digit)',
    'Red 7-Segment 1-digit'        => '0.56" Red 7-Segment LED Display (1 digit)',
    'Single-digit 7-Segment'       => '0.56" Red 7-Segment LED Display (1 digit)',
    'Soil Moisture Probe Meter'    => 'Soil Moisture Probe Meter (standalone)',
    'Standalone Soil Probe'        => 'Soil Moisture Probe Meter (standalone)',

    // Boards - alt forms
    'ESP-01S Relay (Tasmota)'           => 'ESP-01S 5V Relay Module (Tasmota-ready)',
    'ESP-01S 5V Relay Module (Tasmota)' => 'ESP-01S 5V Relay Module (Tasmota-ready)',
    'WH148 10K Stereo Potentiometer'    => 'WH148 10K Stereo Potentiometer (B10K)',

    // Capacitors
    'Capacitor 470uF'                  => 'Capacitor 470uF (electrolytic, mixed voltage)',
    'Electrolytic Capacitor 470uF'     => 'Capacitor 470uF (electrolytic, mixed voltage)',
    'Capacitor Electrolytic 470uF 16V' => 'Capacitor 470uF 16V (electrolytic)',
    'Capacitor 100uF'                  => 'Capacitor 100uF (electrolytic, mixed voltage)',
    '100nF Ceramic Capacitor'          => null, // no ceramics in inventory

    // Resistors (any common form)
    'Resistor 220 Ohm' => 'Resistor 220R (1/8W 1%)',
    'Resistor 220R'    => 'Resistor 220R (1/8W 1%)',
    '220R resistor'    => 'Resistor 220R (1/8W 1%)',
    '220 ohm resistor' => 'Resistor 220R (1/8W 1%)',
    'Resistor 330R'    => 'Resistor 330R (1/8W 1%)',
    'Resistor 470R'    => 'Resistor 470R (1/8W 1%)',
    'Resistor 1k'      => 'Resistor 1K (1/8W 1%)',
    'Resistor 1K'      => 'Resistor 1K (1/8W 1%)',
    'Resistor 2k'      => 'Resistor 2.2K (1/8W 1%)',
    'Resistor 4.7k'    => 'Resistor 4.7K (1/8W 1%)',
    'Resistor 10k'     => 'Resistor 10K (1/8W 1%)',
    '100 Ohm Resistor' => 'Resistor 100R (1/8W 1%)',
    '100k Ohm Resistor'=> 'Resistor 100K (1/8W 1%)',
    // 1/4W variants (we only stock 1/8W)
    'Resistor 10K (1/4W 1%)'  => 'Resistor 10K (1/8W 1%)',
    'Resistor 220R (1/4W 1%)' => 'Resistor 220R (1/8W 1%)',
    'Resistor 1K (1/4W 1%)'   => 'Resistor 1K (1/8W 1%)',
    'Resistor 470R (1/4W 1%)' => 'Resistor 470R (1/8W 1%)',
    'Resistor 330R (1/4W 1%)' => 'Resistor 330R (1/8W 1%)',
    '10K Resistor'    => 'Resistor 10K (1/8W 1%)',
    '220 Ohm Resistor'=> 'Resistor 220R (1/8W 1%)',
    '1K Resistor'     => 'Resistor 1K (1/8W 1%)',

    // LEDs
    'Yellow LED' => 'LED 5mm Yellow',
    'Green LED'  => 'LED 5mm Green',
    'Blue LED'   => 'LED 5mm Blue',
    'Red LED'    => 'LED 5mm Red',
    '5mm Red LED'    => 'LED 5mm Red',
    '5mm Green LED'  => 'LED 5mm Green',
    '5mm Blue LED'   => 'LED 5mm Blue',
    '5mm Yellow LED' => 'LED 5mm Yellow',

    // Sensors / modules
    'SW-420 Vibration switch'    => 'SW-420 Vibration Switch Module',
    'HC-SR04 Ultrasonic Module'  => 'HC-SR04 Ultrasonic Distance Sensor',
    'SG90 Servo'                 => 'SG90 Servo (9g micro)',
    '8x8 LED Matrix'             => '8x8 LED Dot-matrix Display (red)',
    '4-digit Digital Tube'       => '4-digit 7-segment Display Module',
    'TP4056 Charging Module'     => '18650 Charger / Protection Board (TP4056, USB-C)',
    'Angle Tilt Switch Sensor'   => 'Angle / Tilt Switch (ball)',
    'MPU-6500 IMU'               => 'MPU-6500 6-Axis IMU (GY-6500)',
    '0.96 OLED'                  => '0.96" OLED Display (I2C)',
    '2-ch Songle relay board'    => '2-channel Songle relay module',

    // Breadboards
    'Breadboard'                           => 'Breadboard 4.5x9.5cm (~400 tie-points)',
    'Breadboard 830-point'                 => 'Breadboard 4.5x9.5cm (~400 tie-points)',
    'Breadboard 4.5x9.5cm'                 => 'Breadboard 4.5x9.5cm (~400 tie-points)',
    'Breadboard (half-size, 400 tie-point)'=> 'Breadboard 4.5x9.5cm (~400 tie-points)',
    'Mini Breadboard'                      => 'Breadboard 4.5x9.5cm (~400 tie-points)',

    // Jumpers
    'Jumper Wires M-M'                              => 'Jumper Wire M-M, 40pc',
    'DuPont Jumper Wires M-M'                       => 'Jumper Wire M-M, 40pc',
    'M-M DuPont Cable'                              => 'Jumper Wire M-M, 40pc',
    'DuPont jumper wires'                           => 'Jumper Wire M-M, 40pc',
    'DuPont jumpers'                                => 'Jumper Wire M-M, 40pc',
    'DuPont Jumpers'                                => 'Jumper Wire M-M, 40pc',
    'Jumper Wires F-M'                              => 'Jumper Wire F-M, 20pc',
    'DuPont Jumper Wires (M-M, M-F, F-F)'           => 'Jumper Wire M-M, 40pc',
    'DuPont jumper wires (M-M and M-F assortment)'  => 'Jumper Wire M-M, 40pc',
    'DuPont Jumper Wires Mixed'                     => 'Jumper Wire M-M, 40pc',

    // Buttons
    'Tactile Push-buttons' => 'Tactile Push-button Switch 3x6x3.1mm (4-pin, black/red)',
    'push button'          => 'Tactile Push-button Switch 3x6x3.1mm (4-pin, black/red)',
    'Push Button'          => 'Tactile Push-button Switch 3x6x4.3mm (white pin)',
    'Tactile Push Button'  => 'Tactile Push-button Switch 3x6x4.3mm (white pin)',

    // External to inventory - silently dropped (mentioned in the project description anyway)
    'USB-C cable'                                              => null,
    'USB cable'                                                => null,
    'USB Cable'                                                => null,
    'USB Cable Micro-USB'                                      => null,
    'USB-A to Micro-USB Cable'                                 => null,
    'USB-A to USB-C cable'                                     => null,
    'Heat-shrink tubing or electrical tape'                    => null,
    '12V LED strip (short length, low-voltage)'                => null,
    '12V DC power supply (1A+, matching barrel jack for the strip)' => null,
    '18650 Battery'                                            => null,
    'Active Buzzer 5V'                                         => null,
    'Active Buzzer'                                            => null,
    'Passive Buzzer'                                           => null,
    '9V Power Supply 1A'                                       => null,
    '9V Battery'                                               => null,
    '12V Power Supply'                                         => null,
    '12V Wall Adapter'                                         => null,
    'Heatsink (40mm aluminum)'                                 => null,
    'Heatsink for Peltier'                                     => null,
    'Aluminum Heatsink'                                        => null,
    'Thermal Paste'                                            => null,
    'CPU Heatsink'                                             => null,
];

function resolveItemName(string $raw, array $aliases, PDOStatement $lookup): ?int
{
    $lookup->execute([$raw]);
    $id = $lookup->fetchColumn();
    if ($id) return (int) $id;

    if (array_key_exists($raw, $aliases)) {
        $canonical = $aliases[$raw];
        if ($canonical === null) return null;
        $lookup->execute([$canonical]);
        $id = $lookup->fetchColumn();
        if ($id) return (int) $id;
    }
    return null;
}
$checkProj   = $pdo->prepare('SELECT id FROM projects WHERE name = ?');
$insertProj  = $pdo->prepare(
    'INSERT INTO projects
        (name, description, wiring_diagram, breadboard_layout, code, code_language,
         power_supply, difficulty, learning_concepts, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$insertAlloc = $pdo->prepare(
    'INSERT INTO allocations (item_id, project_id, qty, notes)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty),
                             notes = CONCAT_WS("; ", notes, VALUES(notes))'
);

$inserted = 0;
$missingByProject = [];

foreach ($projects as $idx => $p) {
    $name = $p['name'] ?? ('Generated project #' . ($idx + 1));

    // Resolve name collisions.
    $finalName = $name;
    $suffix = 2;
    while (true) {
        $checkProj->execute([$finalName]);
        if (!$checkProj->fetchColumn()) break;
        $finalName = $name . ' (v' . $suffix . ')';
        $suffix++;
        if ($suffix > 20) {
            $finalName = $name . ' (' . bin2hex(random_bytes(3)) . ')';
            break;
        }
    }

    $concepts = $p['learning_concepts'] ?? null;
    if (is_array($concepts)) {
        $concepts = json_encode(array_values(array_filter($concepts, 'is_string')));
    } elseif (!is_string($concepts) && $concepts !== null) {
        $concepts = null;
    }

    $insertProj->execute([
        $finalName,
        $p['description']       ?? null,
        $p['wiring_diagram']    ?? null,
        $p['breadboard_layout'] ?? null,
        $p['code']              ?? null,
        $p['code_language']     ?? 'cpp',
        $p['power_supply']      ?? null,
        $p['difficulty']        ?? null,
        $concepts,
        'planning',
    ]);
    $projectId = (int) $pdo->lastInsertId();
    $inserted++;
    echo "+ project #$projectId  $finalName\n";

    $allocs = $p['allocations'] ?? [];
    $missing = [];
    foreach ($allocs as $a) {
        $itemName = $a['item_name'] ?? null;
        $qty      = (int) ($a['qty'] ?? 0);
        $notes    = $a['notes'] ?? null;
        if (!$itemName || $qty <= 0) continue;

        $itemId = resolveItemName($itemName, $ITEM_ALIASES, $lookupItem);
        if (!$itemId) {
            // Only flag as "missing" if there's no explicit null alias for it
            // (null means "intentionally external to inventory, e.g. USB cables").
            if (!array_key_exists($itemName, $ITEM_ALIASES)) {
                $missing[] = "$itemName (qty=$qty)";
            }
            continue;
        }
        $insertAlloc->execute([$itemId, $projectId, $qty, $notes]);
    }
    if ($missing) {
        $missingByProject[$finalName] = $missing;
        echo "    ! " . count($missing) . " unresolved item name(s)\n";
    }

    // Tags: use the project's explicit tags if provided (examples/projects.json
    // ships these), otherwise derive from the allocated items + description.
    $tagNames = $p['tags'] ?? null;
    if (!is_array($tagNames)) {
        $allocatedItemRows = [];
        $itemRowsStmt = $pdo->prepare(
            'SELECT i.id, i.name, i.category, i.subcategory
               FROM allocations a JOIN items i ON i.id = a.item_id
              WHERE a.project_id = ?'
        );
        $itemRowsStmt->execute([$projectId]);
        $allocatedItemRows = $itemRowsStmt->fetchAll();
        $tagNames = derive_project_tags_from_items($p, $allocatedItemRows);
    }
    sync_project_tags($pdo, $projectId, array_values(array_filter(array_map('strval', $tagNames))));
}

echo "\nInserted $inserted projects.\n";
if ($missingByProject) {
    echo "\nUnresolved item names (please review):\n";
    foreach ($missingByProject as $pname => $list) {
        echo "  - $pname\n";
        foreach ($list as $item) echo "      * $item\n";
    }
} else {
    echo "All allocations resolved cleanly.\n";
}
