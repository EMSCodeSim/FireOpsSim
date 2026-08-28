# FireOpsSim ↔ FireOps Career Road support contract

FireOpsSim is the learning/practice destination behind FireOps Career Road Task Book items.

## General support URL

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

## Skill Support Engine URL

`https://fireopssim.com/skill-support.html`

This is the reusable training session behind a Taskbook item or a standalone “what am I working on?” visit. The same query parameters as the general support URL are accepted, plus:

- `source=roadmap` — shows the Taskbook support banner and a **Return to Roadmap & Log Training** action
- `state` — optional state context (display only)
- `q` — optional search query (hydrant, FO1, engineer, etc.)
- `stage` — optional standalone picker stage (`candidate`, `probationary`, `firefighter`, `driver`, `officer`, `instructor`, `specialty`)

Examples:

- `/skill-support.html?cert=driver_operator_pumper&task=do_pumper_hydrant_ops&goal=Engineer&state=CO&source=roadmap&return_url=...`
- `/roadmap-support.html?cert=driver_operator_pumper&task=do_pumper_hydrant_ops&source=roadmap` (stable Roadmap URL; hands off to Skill Support)
- `/taskbook-resources.html?cert=driver_operator_pumper&task=do_pumper_hydrant_ops&source=roadmap` (catalog URL; hands off to Skill Support when a cert/task is present)

Unknown Roadmap IDs never dead-end. Skill Support says a dedicated module is not available yet and offers the closest skills plus Study Center / Training / Focus Drills.

FireOpsSim must **never** automatically mark an official Roadmap task complete. Roadmap remains the system of record.

## Today’s Focus drill URL

`https://fireopssim.com/focus-drills.html`

Career Road should use this endpoint when the user is intentionally starting a hands-on Daily Focus / Today’s Focus training session. The page loads a drill library and a random skill wheel for the same training level so the user does not lose context after leaving Roadmap.

Supported query parameters:

- `source=roadmap` — identifies a Career Road handoff and displays the context banner
- `level` — preferred normalized training level
- `topic` — current Task Book task or preparation topic used to rank the best drill
- `task` or `requirement` — accepted as topic fallbacks
- `cert` or `certification` — accepted as level/context fallbacks
- `goal` or `target` — active target role shown in the handoff context

Normalized `level` values currently supported:

- `probationary`
- `firefighter_1`
- `firefighter_2`
- `hazmat_ops`
- `driver_operator`
- `officer_1`
- `instructor_1`

Common names and abbreviations such as `FF2`, `Firefighter II`, `HazMat Ops`, `Engineer`, `FO1`, and `Fire Instructor I` are also normalized by the page when a normalized level is not supplied.

Examples:

- `/focus-drills.html?source=roadmap&level=firefighter_2&topic=ventilation&goal=Firefighter%20II`
- `/focus-drills.html?source=roadmap&level=driver_operator&topic=hydrant%20supply&goal=Engineer`
- `/focus-drills.html?source=roadmap&cert=fire%20officer%201&topic=initial%20radio%20report`

### Focus Drill behavior

1. The explicit `level` wins when present.
2. Otherwise the page normalizes certification/requirement/task/goal text to the closest supported training level.
3. The `topic` is used to rank that level’s drill cards and select a recommended drill.
4. The skill wheel contains only drills from the selected level.
5. Changing the level changes both the drill library and wheel together.
6. Career Road remains the source of truth for Task Book status, evidence, and completion. Selecting or completing a FireOpsSim drill never marks a Roadmap requirement complete automatically.

## General support behavior

The support page normalizes punctuation, underscores, hyphens, abbreviations, and common certification names. Known items map to a dedicated Learn → Practice → Record sequence. Unknown items fall back to the closest general study, training, career, and official-source resources instead of returning an empty page.

Current first-class Skill Support coverage includes:

- Firefighter I
- Firefighter II
- HazMat Operations
- Driver / Operator — Pumper (including stable Roadmap task IDs such as `do_pumper_hydrant_ops`)
- Fire Officer I
- Fire Instructor I
- Probation / first 100 fire shifts

Additional matcher coverage still includes EMT, paramedic, CPAT, career growth, and general study/training fallbacks so a new Roadmap ID does not return an empty page.

## Record handoff

The general support page can save the current Roadmap context locally in `fos-roadmap-context-v1` and links to FireOpsSim My Career. Saving context is a convenience only; it does not mark an official department task book, certification requirement, competency, or supervisor verification complete.

The Focus Drill page deliberately does not create completion records. After training, the user returns to Career Road and records the work against the appropriate Task Book item using Roadmap’s normal logging flow.

## Content ownership boundary

Career Road owns planning, goal progress, requirement status, evidence aggregation, Daily Focus selection, and Task Book completion. FireOpsSim owns free study material, certification-level focus drills, level-specific skill wheels, practice tools, scenario/drill support, course/school guidance, and supporting references.

Formal requirements remain controlled by the relevant department, AHJ, state authority, credentialing body, medical direction, adopted standards, and manufacturer instructions.
