# FireOpsSim Data Hub — Certification & Pathway Packs

Versioned, human-curated reference data for firefighter and EMS career pathways.

This folder is designed to live inside the **FireOpsSim** repository and act as the **source hub** for:

- National baseline pathways (NFPA-aligned structure)
- State overlays (differences only)
- Career Road / task-book generation in the Flutter app

## Structure

```text
data/
  index.json                          # Master catalog of available packs
  national/
    pathways/
      firefighter-i.json              # Complete FF I roadmap (JPRs, sequence, prereqs)
      firefighter-ii.json             # Placeholder — expand next
      driver-operator-pumper.json     # Placeholder
      fire-officer-i.json             # Placeholder
      fire-instructor-i.json          # Placeholder
    baseline-certifications.json      # Stable cert IDs used by the app
  states/
    _template/                        # Copy this for each new state
      meta.json
      certifications.json
      pathways/
        README.md
  schema/
    pathway.schema.json               # Shape of a national pathway file
docs/
  HOW_TO_ADD_A_STATE.md
  HOW_THE_APP_CONSUMES_THIS.md
```

## Design rules

1. **National files** describe the complete learning/JPR pathway.
2. **State files** only record differences, official URLs, and verification dates.
3. Never paste copyrighted NFPA JPR text verbatim.
4. Always include `lastVerified` and a clear disclaimer.
5. Prefer stable IDs that match the Career Road catalog (`firefighter_1`, `haz_awareness`, etc.).

## Quick start

1. Copy this entire `data/` + `docs/` tree into the root of [EMSCodeSim/FireOpsSim](https://github.com/EMSCodeSim/FireOpsSim).
2. Commit and push.
3. Raw URLs become available, for example:

```text
https://raw.githubusercontent.com/EMSCodeSim/FireOpsSim/main/data/national/pathways/firefighter-i.json
```

4. Point the Career Road app at `data/index.json` (bundled snapshot or remote fetch).

## Status

| Pack | Status |
|------|--------|
| Firefighter I | Complete national baseline |
| Firefighter II | Complete national baseline |
| Driver/Operator – Pumper | Complete national baseline |
| Fire Officer I | Complete national baseline |
| Fire Instructor I | Complete national baseline |
| State overlays | Template only |

Last updated: 2026-08-23
