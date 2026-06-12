# Contributing

Thanks for taking a look. The project is small and self-contained on purpose - PHP, MariaDB, and a smattering of CDN-loaded JS, no framework, no Composer, no build pipeline. Keep PRs in that spirit when you can.

## Quick checklist

Before opening a PR:

- [ ] Code compiles (`php -l <changed-file>` for each PHP file you touched).
- [ ] Smoke tests pass against your local copy:
      `bash tests/smoke.sh https://inventory.local` (or whatever URL your dev site is on).
- [ ] If you changed the schema, update `inventory/seed.php` and add a brief one-shot migration helper under `inventory/_migrate_<thing>.php`. Delete the helper after running.
- [ ] If you added a new project, run the sanity checks listed in [AGENTS.md](AGENTS.md#sanity-checks-after-a-batch-insert).
- [ ] No em dashes (-) or en dashes (-). Regular hyphens only.

## Local dev setup

Two paths:

### Docker (recommended)

```bash
cp .env.example .env       # optional, edit creds
docker compose up -d
# wait ~10 seconds for the seed to run
open http://localhost:8080
```

The DB is in a named volume `dbdata`. `docker compose down -v` wipes it and forces a re-seed on next `up`.

### Native (PHP + MariaDB)

```bash
bash setup.sh              # interactive prompts
make serve                 # php -S localhost:8080 -t inventory/public
make test                  # smoke tests
```

## Code style

PHP follows roughly PSR-12 with a few local quirks:

- 4-space indentation, LF line endings (see `.editorconfig`).
- Snake_case for SQL column names, camelCase for PHP variables.
- Schemas live in `inventory/seed.php` as inline DDL strings. Migrations live in deletable `_migrate_*.php` files.
- Mermaid diagrams use a fixed colour scheme - see [AGENTS.md](AGENTS.md#mermaid-wiring-diagram-conventions).

## How to propose a project

The repo is opinionated about what makes a good project record. Read [AGENTS.md](AGENTS.md) end to end - it documents the schema contract, the markdown description template, the Mermaid colour scheme, the item-name conventions, and the inventory items that are intentionally NOT tracked.

If your project record passes the sanity checks at the bottom of AGENTS.md and renders cleanly in `/project.php?id=N`, it's almost certainly ready.

## When to extend the schema

See AGENTS.md - "When to extend the schema". TL;DR: prefer keeping new things in the description markdown unless they need structured access for a UI affordance (badge, chip, dedicated section, syntax-highlighted code block).

## What this project is, and isn't

It is:

- A bench-side reference for a parent and a 10-year-old learning electronics.
- A toy demonstration of multi-agent project generation against a real inventory.
- A small enough PHP app that you can read the whole thing in an afternoon.

It isn't:

- A general-purpose CMS, inventory ERP, or warehouse management system.
- Production-hardened. There's no auth, no CSRF, no rate limiting.
- A pedagogical example of "best-practice modern PHP" - it's deliberately simple and frameworkless.

If your PR pulls in a framework, a Composer dependency tree, or pushes the project meaningfully closer to "professional warehouse software", I'll probably ask you to keep it as a fork.

## License

MIT - see [LICENSE](LICENSE). By contributing you agree your contributions are licensed under the same.
