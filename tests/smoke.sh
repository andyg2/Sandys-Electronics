#!/usr/bin/env bash
# Smoke tests for Edge Devices Inventory.
#
# Walks every public route + a handful of URL-state variants and asserts HTTP
# status. Defaults to https://inventory.local; override by passing a base URL:
#     bash tests/smoke.sh http://localhost:8080
#
# Exits non-zero if any check fails. Use in CI or pre-push hooks.

set -u

BASE="${1:-https://inventory.local}"
echo "Edge Devices Inventory - smoke tests"
echo "Base URL: $BASE"
echo

PASS=0
FAIL=0
FAILED_PATHS=()

check() {
    local path="$1"
    local expected="${2:-200}"
    local label="${3:-$path}"
    local code
    code=$(curl -ks -o /dev/null -w '%{http_code}' --max-time 8 "$BASE$path" || echo "ERR")
    if [ "$code" = "$expected" ]; then
        printf "  %-6s %s\n" "OK" "$label -> $code"
        PASS=$((PASS + 1))
    else
        printf "  %-6s %s\n" "FAIL" "$label -> $code (expected $expected)"
        FAIL=$((FAIL + 1))
        FAILED_PATHS+=("$path")
    fi
}

echo "Basic routes"
check "/"                             303 "/ (redirect)"
check "/items.php"                    200
check "/projects.php"                 200
check "/item.php?id=1"                200
check "/item_edit.php"                200 "/item_edit.php (new)"
check "/item_edit.php?id=1"           200 "/item_edit.php?id=1 (edit)"
check "/project.php?id=1"             200
check "/project_edit.php"             200 "/project_edit.php (new)"
check "/project_edit.php?id=1"        200 "/project_edit.php?id=1 (edit)"

echo
echo "Static assets"
check "/assets/style.css"             200
check "/assets/inventory.js"          200
check "/assets/projects.js"           200
check "/assets/project_render.js"     200

echo
echo "Filter / sort URL state"
check "/items.php?q=resistor"         200
check "/items.php?category=Sensor"    200
check "/items.php?sort=-proj"         200
check "/items.php?tags=oled"          200
check "/projects.php?diff=beginner"   200
check "/projects.php?tags=wifi"       200
check "/projects.php?sort=-units"     200

echo
echo "404 / not-found handling"
check "/index.html"                   404
check "/no-such-page.php"             404
check "/item.php?id=99999"            404
check "/project.php?id=99999"         404

echo
echo "Results: $PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
    echo
    echo "Failed paths:"
    for p in "${FAILED_PATHS[@]}"; do echo "  - $p"; done
    exit 1
fi
exit 0
