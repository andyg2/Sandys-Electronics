# Changelog

All notable changes will be tracked here. Format roughly follows [Keep a Changelog](https://keepachangelog.com/) but the project is small enough that the timeline is more a vibe than a contract.

## [Unreleased]

### Added

- README.md, AGENTS.md, LICENSE (MIT), CONTRIBUTING.md, CHANGELOG.md.
- `docs/screenshots/` capturing items list (light + dark), faceted-filter view, item edit form, projects page (light + filtered), project detail (light + dark).
- `setup.sh` + `Makefile` for one-command first-time setup.
- `docker-compose.yml`, `docker/Dockerfile`, `docker/apache.conf`, `docker/init.sh` for `docker compose up`.
- `tests/smoke.sh` covering 24 routes + filter / sort URL states + 404 handling.
- `tests/screenshots.py` for re-capturing README images via Playwright.
- `inventory/src/config.example.php` (committed) + `inventory/src/config.php` (gitignored). DB credentials no longer hardcoded in `db.php`.
- `inventory/_export_inventory.php` + `_import_inventory.php` for round-tripping inventory.
- `inventory/examples/inventory.json` (197 items) for bringing your own kit.
- `inventory/public/.htaccess.example` documenting optional HTTP Basic Auth.
- `.editorconfig`, `.dockerignore`, `.env.example` for contributor ergonomics.
- `.github/` issue + PR templates.

### Changed

- `seed.php` now accepts `--empty` to create schema without seeding the 197 items.
- DB credentials read from env vars (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`) if set, falling back to `src/config.php` values.

## [Pre-release timeline]

Notable milestones leading up to the public release:

- Faceted filtering + sorting on items and projects pages with URL state.
- Dark mode (Tailwind `class` strategy + localStorage + no-flash pre-init).
- Project records gained dedicated `wiring_diagram` (Mermaid), `code` + `code_language`, `power_supply` (amber callout), `difficulty` (level badge), `learning_concepts` (Teaches chips), and `project_tags` (categorical) fields.
- Multi-agent project generation pipeline: brainstorm -> shortlist -> author -> critique -> refine -> judge.
- Gap-fill workflow targeting uncovered boards / sensors / modules.
- Item tags + project tags, both with progressive faceted clouds and "Used in N projects" surfaced on the item edit form.
- "In use" vs "Allocated" math: planning allocations no longer compete for stock; only active-status projects subtract from Free.
- Migration from initial Python / Flask / SQLite scaffold to PHP / MariaDB.
