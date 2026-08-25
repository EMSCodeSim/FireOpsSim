# EMS_Code_SIM Assessment Mode UX patch

This Cloud Agent environment is linked to **EMSCodeSim/FireOpsSim**, but the Visual Patient /
Assessment Mode app lives in **EMSCodeSim/EMS_Code_SIM**
(`https://emscodesim.com/vitals/visual-patient?case=horse_crush&training=assessment`).

## Push problem (root cause)

Pushes to `EMS_Code_SIM` fail with **403 Permission denied to cursor[bot]** when the Cloud Agent
environment only scopes the GitHub token to FireOpsSim. The bot can clone the sibling repo but
cannot create branches or open PRs there.

**Fix:** add `EMS_Code_SIM` as a repository dependency (see `.cursor/environment.json` in
FireOpsSim). After that change is saved on your Cloud Agent environment, new agents can push to
both repositories. Alternatively, start a Cloud Agent directly on **EMSCodeSim/EMS_Code_SIM**.

## What this improves

1. Assessment Mode onboarding banner + interactive Discover → Decide → Treat → Reassess rail
2. Interactive patient photo hotspots (hip, pelvis, distal CMS, c-spine, chest, etc.) with finding chips
3. Decision discovery checklists + unlock toast/rationale (replaces “No assessment hints…”)
4. Action-bar progress counters + mini-result cards after Assessment / Vitals / History
5. Mobile &lt;768px polish (sticky flow rail, 44px+ targets, clock/button overlap fixes)
6. Soft “What am I missing?” prompts + optional required-findings reveal after basics
7. Findings highlight/scroll, clock “paused while reading”, lightweight assessment progress reset

The patch in `0001-assessment-mode-ux.patch` was rebased onto current `EMS_Code_SIM` `main`
(Aug 2026) and applies cleanly with `git am`.

## Apply to EMS_Code_SIM

### Option A — git am (recommended)

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
- `vitals/visual-patient.html` — add before `</body>`:
  `<script src="/vitals/scenario-assessment-mode-ux.js?v=2026.08.18.34"></script>`
- `vitals/horse-crush-bootstrap.js` — add comment after horse-photo-layer-fix load
- `tools/test-assessment-mode-ux.js` (new)
- `package.json` — add `test:assessment-mode-ux` script and include it in the `build` chain

### Verify

```bash
node tools/test-assessment-mode-ux.js
node tools/test-scenario-reasoning.js
```

Open:
`/vitals/visual-patient.html?case=horse_crush&training=assessment`

## Recommended follow-up

1. Merge the FireOpsSim PR that adds `.cursor/environment.json` with `repositoryDependencies`.
2. Save the updated environment in the [Cloud Agents dashboard](https://cursor.com/dashboard/cloud-agents/environments/e/eb54ea74-a0cc-11f1-b532-320a589b8025).
3. Re-run this agent (or start one on **EMSCodeSim/EMS_Code_SIM**) to push
   `cursor/assessment-mode-ux-68e0` and open the PR.
