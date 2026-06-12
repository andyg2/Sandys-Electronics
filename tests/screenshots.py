"""Capture screenshots of the live site for the README.

Run:  python tests/screenshots.py [base_url]
Default base URL: https://inventory.local
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright


BASE = sys.argv[1] if len(sys.argv) > 1 else "https://inventory.local"
OUT  = Path(__file__).resolve().parent.parent / "docs" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)


def capture(ctx, url, path, theme="light", full=False, wait_extra=0):
    page = ctx.new_page()
    page.add_init_script(f"try {{ localStorage.setItem('theme', '{theme}'); }} catch (e) {{}}")
    page.goto(url)
    page.wait_for_load_state("networkidle")
    if wait_extra:
        page.wait_for_timeout(wait_extra)
    page.screenshot(path=str(OUT / path), full_page=full)
    print(f"  wrote {path}")
    page.close()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": 1280, "height": 900},
            ignore_https_errors=True,
        )

        capture(ctx, f"{BASE}/items.php",                  "items-light.png", theme="light")
        capture(ctx, f"{BASE}/items.php",                  "items-dark.png",  theme="dark")
        capture(ctx, f"{BASE}/items.php?tags=resistor",    "items-filtered.png", theme="light")
        capture(ctx, f"{BASE}/item_edit.php?id=181",       "item-edit.png", theme="light", full=True)
        capture(ctx, f"{BASE}/projects.php",               "projects-light.png", theme="light")
        capture(ctx, f"{BASE}/projects.php?tags=oled",     "projects-filtered.png", theme="light")
        capture(ctx, f"{BASE}/project.php?id=1",           "project-detail-light.png", theme="light", wait_extra=2500)
        capture(ctx, f"{BASE}/project.php?id=1",           "project-detail-dark.png",  theme="dark",  wait_extra=2500)

        browser.close()


if __name__ == "__main__":
    main()
