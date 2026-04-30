# Sovereign Knowledge Ledger

## Project State Index

This ledger records verified project changes made during implementation work. Entries are factual and map directly to files changed in the working tree.

## Current Verified Change Set

- `src/pages/Generator.tsx` was redesigned as a clearer generation workflow for non-technical users.
- The generation contract remains unchanged: the page still calls `useLite().generate(prompt)` and still consumes `selectedModel`, `generating`, `localHistory`, and `currentUser` from `useLite()`.
- `src/pages/ModelFeed.tsx` was redesigned as a clearer style-selection workflow for non-technical users.
- The model selection contract remains unchanged: the page still consumes `availableModels`, `selectedModel`, `setSelectedModel`, and `currentUser` from `useLite()`; selection still stores `lite_selected_model`; authenticated users still continue to `/generate`; unauthenticated users still go to `/auth`.
- No Domain, Core, backend Infrastructure, Firebase, or Electron generation orchestration files were modified during this pass.
- Verification performed: `npm exec tsc -- --noEmit --pretty false` and `npm run build` completed without reported errors.

## Ledger Files

- [`changelog.md`](./changelog.md) — chronological record of verified changes.