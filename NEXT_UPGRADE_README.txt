FIREOPSSIM NEXT UPGRADE — DAILY PRACTICE + PROGRESS
Date: July 20, 2026

UPLOAD INSTRUCTIONS
1. Open FireOpsSim_next_upgrade_changes.zip.
2. Upload all included files and folders to the ROOT of the current GitHub repository.
3. Preserve the js/ and scenarios/ folder paths.
4. Replace existing files when GitHub asks.
5. After deployment, open /daily-challenge.html and complete one test answer.

WHAT THIS UPGRADE ADDS
- A real Daily Fire Pump Challenge selected automatically each day.
- Daily completion streak saved locally on the visitor's device.
- Scenario Player attempts, accuracy, current streak, and best streak.
- Share buttons for daily and regular scenario results.
- Daily Challenge promotion on the homepage and All Tools page.
- Better mobile navigation behavior: menu state, Escape-to-close, and close-after-selection.
- /daily and /challenge redirects.

TRAINING QUALITY CORRECTIONS
Four multi-problem scenario sets previously reused identical question text while changing the answer. They now contain distinct and internally consistent hose lengths, flows, elevations, overlays, details, formulas, and answers:
- scenarios/single_line_preconnect_001.json
- scenarios/single_line_extended_002.json
- scenarios/single_line_heavy_003.json
- scenarios/wye_residential_split_001.json

PRIVACY
Progress is stored only in the visitor's browser using localStorage. No account, cloud database, or personal information is required.

FILES IN THIS UPGRADE
_redirects
calc-tools.js
daily-challenge.html
index.html
NEXT_UPGRADE_README.txt
scenario-player.html
sitemap.xml
styles.css
tools.html
js/daily-challenge.js
js/scenario-player.js
scenarios/single_line_preconnect_001.json
scenarios/single_line_extended_002.json
scenarios/single_line_heavy_003.json
scenarios/wye_residential_split_001.json
