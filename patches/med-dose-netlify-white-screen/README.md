# Med Dose Netlify white-screen fix

## Cause
Production Netlify site `mymeddose.netlify.app` was publishing repository source instead of Vite `dist`, so the browser loaded `/src/main.tsx` directly and left an empty React root (white screen).

## Fix
1. Add `netlify.toml` (build `npm run build`, publish `dist`, SPA redirect).
2. Optional mobile result-bar layout updates in `src/App.tsx` and `src/styles.css` (same as PR #2).

## Apply
```bash
cd med-dose
cp ../patches/med-dose-netlify-white-screen/netlify.toml .
git apply ../patches/med-dose-netlify-white-screen/app-mobile.patch
npm run build
```

## Already open
- Draft PR: https://github.com/EMSCodeSim/med-dose/pull/2
- Working preview: https://deploy-preview-2--mymeddose.netlify.app
- Broken production: https://mymeddose.netlify.app
