# Skill Support catalog

Structured training sessions used by `/skill-support.html`, `/roadmap-support.html`, and `/taskbook-resources.html`.

- `index.json` — stages, catalog file list, shared official sources, extra search targets
- One JSON file per certification/role (`firefighter_1.json`, `driver_operator_pumper.json`, …)

Skill IDs reuse Roadmap IDs when they already exist (`do_pumper_hydrant_ops`, `driver_operator_pumper`, `firefighter_1`, `fire_officer_1`, …).

`handoff.json` lists every `cert` + `task` session URL plus the Daily Focus `level` map for Roadmap to consume later.

Query parameters accepted by `/skill-support.html` include Roadmap Daily Focus names: `task_id`, `requirement_id`, `topic`, `qualification`, and `level`. `/focus-drills.html?source=roadmap…` redirects to Skill Support.

Regenerate from the authoring scripts:

```bash
python3 scripts/generate_skill_support.py
node tests/skill-support-test.js
```

Do not treat this content as NFPA text, official skill sheets, or department policy.
