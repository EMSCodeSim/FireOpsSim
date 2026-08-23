# How Career Road should consume this hub

## Resolution order

1. Load national pathway pack (e.g. `firefighter-i.json`)
2. If user selected a state, load that state’s overlay (if present)
3. Merge:
   - National structure (JPRs, sequence, chapters) stays
   - State differences override only matching keys / companion requirements
4. Apply any department-custom requirements the user added locally

## Offline behavior

- Ship a recent snapshot of `data/` as Flutter assets **or** download once and cache.
- Remote refresh is optional; never block core task-book use on network.

## Mapping into Task Book

Use:

- `outputsForCareerRoad.taskBookChapters` → section headers
- `jprSkillGroups[]` → tasks / skill checkoffs inside sections
- `trainingSequence[]` → ordered “how to progress” checklist
- `outputsForCareerRoad.primaryCertificationId` → link to catalog cert
- `corequisitesAndCommonCompanions` → companion cert requirements

## Suggested Flutter entry points

```text
assets/data/index.json
assets/data/national/pathways/firefighter-i.json
...
```

or

```text
https://raw.githubusercontent.com/EMSCodeSim/FireOpsSim/main/data/index.json
```

## Version pinning

Read `version` on each pack. If remote version > bundled version, offer an update; do not silently replace in-progress user task books without confirmation.
