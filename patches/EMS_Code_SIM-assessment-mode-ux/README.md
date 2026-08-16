# EMS_Code_SIM Assessment Mode UX patch

This Cloud Agent was started against **EMSCodeSim/FireOpsSim**, but the Visual Patient /
Assessment Mode app lives in **EMSCodeSim/EMS_Code_SIM**
(`https://emscodesim.com/vitals/visual-patient?case=horse_crush&training=assessment`).

The agent implemented the UX work in a local clone of `EMS_Code_SIM` but could not push
there (403). Use one of the apply methods below on `EMS_Code_SIM`.

## What this improves

1. Assessment Mode onboarding banner + interactive Discover → Decide → Treat → Reassess rail
2. Interactive patient photo hotspots (hip, pelvis, distal CMS, c-spine, chest, etc.) with finding chips
3. Decision discovery checklists + unlock toast/rationale (replaces “No assessment hints…”)
4. Action-bar progress counters + mini-result cards after Assessment / Vitals / History
5. Mobile &lt;768px polish (sticky flow rail, 44px+ targets, clock/button overlap fixes)
6. Soft “What am I missing?” prompts + optional required-findings reveal after basics
7. Findings highlight/scroll, clock “paused while reading”, lightweight assessment progress reset

## Apply to EMS_Code_SIM

### Option A — git am

```bash
cd /path/to/EMS_Code_SIM
git checkout -b cursor/assessment-mode-ux-68e0
git am /path/to/FireOpsSim/patches/EMS_Code_SIM-assessment-mode-ux/0001-assessment-mode-ux.patch
git push -u origin cursor/assessment-mode-ux-68e0
```

### Option B — copy files

Copy these into the `EMS_Code_SIM` repo root:

- `vitals/scenario-assessment-mode-ux.js` (new)
- `vitals/scenario-assessment-mode-ux.css` (new)
- `vitals/scenario-learning-upgrade.js` (replace)
- `vitals/visual-patient.html` (replace)
- `vitals/horse-crush-bootstrap.js` (replace)
- `tools/test-assessment-mode-ux.js` (new)

Then update `package.json` / `netlify.toml` from the patch (adds `test:assessment-mode-ux`
and cache headers), or re-apply those hunks from `0001-assessment-mode-ux.patch`.

### Verify

```bash
node tools/test-assessment-mode-ux.js
node tools/test-scenario-reasoning.js
```

Open:
`/vitals/visual-patient.html?case=horse_crush&training=assessment`

## Recommended follow-up

Start a new Cloud Agent linked to **EMSCodeSim/EMS_Code_SIM** so the branch/PR can be
pushed and reviewed in the correct repository.
