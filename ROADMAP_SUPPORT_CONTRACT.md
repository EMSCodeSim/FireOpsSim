# FireOpsSim ↔ FireOps Career Road support contract

FireOpsSim is the learning/practice destination behind FireOps Career Road Task Book items.

## URL

`https://fireopssim.com/roadmap-support.html`

Supported query parameters:

- `task` — stable task ID or human-readable task title
- `cert` or `certification` — certification ID/name
- `requirement` — requirement ID/name
- `id` — generic fallback ID
- `title` — human-readable fallback title
- `goal` or `target` — active target role (used to improve matching)
- `return` or `return_url` — optional URL to return to Career Road

Examples:

- `/roadmap-support.html?task=driver_operator_pumper&goal=Engineer`
- `/roadmap-support.html?cert=fire_officer_1&goal=Lieutenant`
- `/roadmap-support.html?requirement=hazmat_ops`
- `/roadmap-support.html?task=department_custom_ladder_evaluation&goal=Firefighter`

## Behavior

The support page normalizes punctuation, underscores, hyphens, abbreviations, and common certification names. Known items map to a dedicated Learn → Practice → Record sequence. Unknown items fall back to the closest general study, training, career, and official-source resources instead of returning an empty page.

Current first-class coverage includes:

- EMT
- Paramedic
- Firefighter I / II
- HazMat Operations
- Driver / Operator — Pumper
- Company Officer / Fire Officer I
- Fire Officer II / advanced officer development
- Fire Instructor I
- CPAT / candidate physical readiness
- Probation / first 100 fire shifts
- Pump hydraulics
- Water supply
- SCBA / air management
- Fireground decision-making
- General career advancement / promotion development

## Record handoff

The page can save the current Roadmap context locally in `fos-roadmap-context-v1` and links to FireOpsSim My Career. Saving context is a convenience only; it does not mark an official department task book, certification requirement, competency, or supervisor verification complete.

## Content ownership boundary

Career Road owns planning, goal progress, requirement status, evidence aggregation, and Task Book completion. FireOpsSim owns free study material, practice tools, scenario/drill support, course/school guidance, and supporting references.

Formal requirements remain controlled by the relevant department, AHJ, state authority, credentialing body, medical direction, adopted standards, and manufacturer instructions.