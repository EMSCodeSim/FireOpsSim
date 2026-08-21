# Roadmap ↔ FireOpsSim integration patch

Apply this patch to the **Roadmap** repository (`EMSCodeSim/Roadmap`) on branch `main`.

## What it adds

1. **`return_url` on every FireOpsSim handoff** via `lib/services/fireops_sim_links.dart`
2. **Daily Focus → `focus-drills.html`** for 30 min / 1 hour / crew drill modes
3. **Expanded built-in preparation tasks** for FF I/II, FO I, HazMat Ops, Investigator, Inspector I, and EMT
4. **Cached fetch** of `https://fireopssim.com/data/taskbook-resources.json` via `lib/services/fireops_sim_catalog.dart`
5. **`firepath://` deep links** so FireOpsSim can return users to Daily Focus or a Task Detail page

## Apply

```bash
cd Roadmap
git checkout -b cursor/roadmap-fireopssim-integration-68e0
git am /path/to/patches/Roadmap-fireopssim-integration/*.patch
flutter pub get
flutter test test/fireops_sim_integration_test.dart
```

Or copy the mirrored files from this folder over the same paths in the Roadmap repo.

## FireOpsSim companion change

FireOpsSim PR #17 also honors `return_url` on:

- `taskbook-resources.html`
- `focus-drills.html`

Deploy both repos together for the full return-to-record loop.
