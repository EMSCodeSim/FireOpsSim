# FireOpsSim ↔ FireOps Career Roadmap Companion Contract

FireOps Career Roadmap owns:
- career goals and Taskbooks
- nested tasks and completion state
- personal logs, evidence, accomplishments, dates, and department-defined books

FireOpsSim owns:
- study guides and plain-language preparation content
- practice tools, calculators, scenarios, flashcards, and checklists
- school/training discovery
- links to official/accrediting/certification sources

## Stable URLs

Certification hub:
`https://fireopssim.com/taskbook-resources.html?cert=<roadmap_certification_id>`

Task-specific hub:
`https://fireopssim.com/taskbook-resources.html?cert=<roadmap_certification_id>&task=<roadmap_task_id>`

Optional context:
`&state=CO&source=roadmap`

Study library:
`https://fireopssim.com/study-guides.html?cert=<roadmap_certification_id>`

Training finder:
`https://fireopssim.com/school-finder.html?path=fire&cert=<roadmap_certification_id>&state=CO`

ICS / NIMS hub:
`https://fireopssim.com/ics-nims-training.html?cert=ics_100` (also `ics_200`, `ics_300`, `ics_400`, `is_700`, `is_800`)

EMS life-support companion:
`https://fireopssim.com/ems-life-support.html?cert=bls` (also `acls`, `pals`)

The school finder also accepts `path=ems`, `path=ics`, and `path=nfa`. When Roadmap sends an ICS or life-support certification ID with `path=fire`, FireOpsSim remaps the finder to the correct path.

Covered certification IDs:
`firefighter_1`, `firefighter_2`, `hazmat_awareness`, `hazmat_operations`, `hazmat_technician`, `driver_operator_pumper`, `driver_operator_aerial`, `fire_officer_1`, `fire_officer_2`, `fire_officer_3`, `fire_officer_4`, `fire_instructor_1`, `fire_instructor_2`, `fire_inspector_1`, `fire_inspector_2`, `fire_investigator`, `emt`, `aemt`, `paramedic`, `bls`, `acls`, `pals`, `ics_100`, `ics_200`, `ics_300`, `ics_400`, `is_700`, `is_800`

Unknown `task=` values keep the certification hub on-screen and synthesize a Learn → Practice → Record card from the certification study links.

## Machine-readable catalog

`https://fireopssim.com/data/taskbook-resources.json`

CORS: `Access-Control-Allow-Origin: *` so the Roadmap app (or a local web build) can read the catalog directly.

The catalog uses Roadmap's stable certification IDs and can add new certification/task mappings without changing Roadmap's Taskbook model.

## Safety / source-of-truth rule

FireOpsSim helper content is not an official skill sheet or certification authority. Roadmap and FireOpsSim should keep this distinction visible and direct users to current department SOPs, state/licensing agencies, medical direction, adopted standards, and issuing organizations when requirements matter.
