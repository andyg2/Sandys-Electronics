<?php
/**
 * Emit a compact text snapshot of the current inventory, suitable as the
 * `inventory` arg to the generate_projects.workflow.js workflow.
 *
 * Usage:
 *   php _generate_inventory_snapshot.php > /tmp/inv.txt
 * Then pass the contents as args.inventory to a Workflow({scriptPath: ...}).
 */
declare(strict_types=1);
require_once __DIR__ . '/src/db.php';

$pdo = db();
$cats = ['Board', 'Sensor', 'Module', 'Switch', 'Connector', 'Cable',
         'Resistor', 'Capacitor', 'Transistor', 'IC', 'Voltage regulator', 'Component'];

$catLabels = [
    'Board'             => 'Microcontroller boards / SBC',
    'Sensor'            => 'Sensors',
    'Module'            => 'Output / interface modules',
    'Switch'            => 'Tactile push-buttons (each variant is its own row)',
    'Connector'         => 'Connectors',
    'Cable'             => 'Jumper wires',
    'Resistor'          => 'Resistors (1/8W 1% metal film, format: Resistor <value> (1/8W 1%))',
    'Capacitor'         => 'Electrolytic capacitors',
    'Transistor'        => 'BC-series TO-92 BJTs',
    'IC'                => 'Integrated circuits',
    'Voltage regulator' => 'Linear voltage regulators (TO-220)',
    'Component'         => 'Discrete components (LEDs)',
];

$rows = $pdo->query(
    "SELECT name, category, subcategory, value, qty_total
       FROM items
      WHERE qty_total > 0
   ORDER BY category, subcategory, name"
)->fetchAll();

$grouped = [];
foreach ($rows as $r) {
    $grouped[$r['category']][] = $r;
}

echo "INVENTORY (use exact name verbatim in allocations):" . PHP_EOL . PHP_EOL;

foreach ($cats as $cat) {
    if (!isset($grouped[$cat])) continue;
    echo "=== " . $catLabels[$cat] . " ===" . PHP_EOL;
    foreach ($grouped[$cat] as $i) {
        $sub = $i['subcategory'] ? ' - ' . $i['subcategory'] : '';
        echo "- " . $i['name'] . " [qty=" . $i['qty_total'] . "]" . $sub . PHP_EOL;
    }
    echo PHP_EOL;
}

echo "Notes:" . PHP_EOL;
echo "- Orange Pi One is NOT YET BOOTED - skip for microcontroller projects." . PHP_EOL;
echo "- ESP32 boards are 3.3V GPIO. Arduino Uno is 5V GPIO." . PHP_EOL;
echo "- ESP32 WiFi SSID is GeeFam. Use placeholder PASSWORD_HERE for password in code." . PHP_EOL;
echo "- 2-channel Songle relay: LOW-VOLTAGE DC ONLY, no mains AC." . PHP_EOL;
echo "- LEDs need a 220R-470R current-limiting resistor." . PHP_EOL;

// List existing projects so the agents don't duplicate them.
$projects = $pdo->query("SELECT name FROM projects ORDER BY id")->fetchAll(PDO::FETCH_COLUMN);
if ($projects) {
    echo "- Projects already in the system (avoid duplicating):" . PHP_EOL;
    foreach ($projects as $p) {
        echo "    - " . $p . PHP_EOL;
    }
}
