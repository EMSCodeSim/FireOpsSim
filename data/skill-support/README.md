# Skill Support catalog

Structured training sessions used by `/skill-support.html`, `/roadmap-support.html`, and `/taskbook-resources.html`.

- `index.json` — stages, catalog file list, shared official sources, extra search targets
- One JSON file per certification/role (`firefighter_1.json`, `driver_operator_pumper.json`, …)

Skill IDs reuse Roadmap IDs when they already exist (`do_pumper_hydrant_ops`, `driver_operator_pumper`, `firefighter_1`, `fire_officer_1`, …).

Regenerate from the authoring scripts:

```bash
python3 scripts/generate_skill_support.py
node tests/skill-support-test.js
```

Do not treat this content as NFPA text, official skill sheets, or department policy.
