# How to add a state pack

1. Copy `data/states/_template/` to `data/states/{CODE}/`  
   Example: `data/states/CO/`

2. Edit `meta.json`
   - Real agency name
   - Official website + certification portal
   - IFSAC / Pro Board status
   - `lastVerified` date

3. Edit `certifications.json`
   - Map local names → stable `catalogId` values from `national/baseline-certifications.json`
   - Record only meaningful differences (required companions, hours, unique modules)

4. Optional: add thin pathway overlays under `pathways/`

5. Register the state in `data/index.json` under `states.available`

6. Commit with a clear message, e.g.  
   `data(CO): add initial state overlay for Firefighter I`

## Rules

- Never claim legal authority.
- Always keep national baseline as the full roadmap.
- Prefer official URLs over secondary blogs.
- Update `lastVerified` whenever you touch a file.
