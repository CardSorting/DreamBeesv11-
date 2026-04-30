# Changelog

## 2026-04-29 — Full-Width Profile and History UX Audit Pass

### Files Changed

- `src/pages/UserProfile.tsx`
- `.wiki/index.md`
- `.wiki/changelog.md`

### Verified UI Changes in `src/pages/UserProfile.tsx`

- Replaced the previous narrow atmospheric profile/archive page with a full-width profile and history dashboard.
- Added a clear page header with breadcrumb context: `Studio / Profile & history`.
- Added plain-language page copy explaining that users can manage their account, review local history, and continue creating.
- Added quick navigation actions for `Create image`, `Choose style`, and `Sign out`.
- Replaced atmospheric account language with clearer labels:
  - `Creator level`
  - `Images created`
  - `Current level`
  - `Local history`
  - `System status`
- Added a full-width account overview with user identity, creator-level progress, next milestone copy, and benefit pills.
- Added a dashboard stat grid for total images, current level, images with style info, and local history status.
- Reworked the history area into a dedicated `Your image history` workspace.
- Added search with placeholder text for prompts, image IDs, and style IDs.
- Added visible result counts with `Showing X of Y images`.
- Added filter tabs for `All images`, `Recent`, and `With style info`.
- Added a no-results state with a clear search/filter reset action.
- Added an empty-history state with direct actions to `Create image` and `Choose style`.
- Reworked history cards so prompt text, save date, image ID, and style ID metadata are visible without relying on hover.
- Improved image alt text by using prompt text when available.
- Reworked diagnostics into a secondary `System status` panel with clearer labels:
  - `Local history database`
  - `Desktop app version`
  - `Build type`
- Reworked responsive CSS so the full-width dashboard collapses into tablet and mobile layouts.

### Architecture Notes

- Affected layer: UI page composition in `src/pages/UserProfile.tsx`.
- Existing profile/history data contract remains intact: `currentUser`, `logout`, `localHistory`, and `addToast` are still sourced from `useLite()`.
- Existing tier display source remains intact: `calculateTier()` and `USER_TIERS` are still used for creator-level display.
- Existing optional system status contract remains intact: the page still calls `window.electronAPI.lite.health()` when available.
- Search and filters are presentational UI behavior over existing `localHistory`; no persistence, backend, Electron, Domain, or Core behavior was modified.

### Verification Evidence

- `npm exec tsc -- --noEmit --pretty false` completed without reported errors.
- `npm run build` completed successfully with Vite production output for app, Electron main, and Electron preload bundles.

## 2026-04-29 — Model Selection UX and Navigation Audit Pass

### Files Changed

- `src/pages/ModelFeed.tsx`
- `.wiki/index.md`
- `.wiki/changelog.md`

### Verified UI Changes in `src/pages/ModelFeed.tsx`

- Replaced the previous immersive engine gallery with a more familiar style-picker workflow.
- Added a clear page header with breadcrumb context: `Explore / Choose style`.
- Added plain-language page copy explaining that users are choosing the look for their next image and can change it before generating.
- Added quick navigation actions for `Create image` and `History` using existing application routes.
- Added a current-choice summary panel that shows the selected model when present, recommends a starting style when no model is selected, and provides a clear continuation CTA.
- Added beginner-friendly guidance chips explaining when to choose realistic, illustration/anime, or recommended beginner styles.
- Added a searchable style library with a visible count showing how many styles are currently displayed.
- Added category filter tabs for `All styles`, `Best for beginners`, `Realistic`, `Illustration`, and `Creative`.
- Added empty states for both loading models and no matching search/filter results, including a clear reset action for empty search results.
- Reworked model cards to use clearer terminology:
  - `Use this style` as the primary action.
  - `Selected` and `Recommended` badges.
  - Plain-language style labels such as `Photo style`, `Art style`, `Creative`, and `Recommended`.
  - `Best for:` guidance derived from existing model metadata and model text.
- Preserved whole-card selection while adding keyboard accessibility through `role="button"`, `tabIndex={0}`, and Enter/Space handling.
- Reworked responsive CSS so the page collapses from multi-column desktop browsing to simpler tablet/mobile layouts.

### Architecture Notes

- Affected layer: UI page composition in `src/pages/ModelFeed.tsx`.
- Existing model data contract remains intact: `availableModels`, `selectedModel`, `setSelectedModel`, and `currentUser` are still sourced from `useLite()`.
- Existing selection behavior remains intact: `lite_selected_model` is still written to `localStorage`; authenticated users continue to `/generate`; unauthenticated users are redirected to `/auth`.
- Model categorization is presentational decision support only and is derived locally from existing `AIModel` name/description and `getModelMetadata()` output.
- No Domain, Core, Firebase, Electron, or backend generation behavior was modified.

### Verification Evidence

- `npm exec tsc -- --noEmit --pretty false` completed without reported errors.
- `npm run build` completed successfully with Vite production output for app, Electron main, and Electron preload bundles.

## 2026-04-29 — Generation Page UX and Navigation Audit Pass

### Files Changed

- `src/pages/Generator.tsx`
- `.wiki/index.md`
- `.wiki/changelog.md`

### Verified UI Changes in `src/pages/Generator.tsx`

- Replaced the previous atmospheric generator presentation with a more familiar, task-oriented creation page.
- Added a clear page header with breadcrumb navigation: `Explore / Create`.
- Added quick top-level navigation actions for `Models` and `History` using existing application routes.
- Added a four-step workflow strip: `Describe`, `Choose style`, `Generate`, and `Review`.
- Added a left-side control panel with:
  - Explicit `Image description` label.
  - Plain-language prompt placeholder.
  - Character counter with a `1000` character limit.
  - Keyboard helper text for Enter and Shift+Enter behavior.
  - Prompt example buttons that fill the prompt textarea.
  - A selected style/model card with a `Change` link to model selection.
  - A primary `Generate image` button with clearer disabled and loading copy.
- Added a right-side preview area with:
  - Empty state explaining where generated images appear.
  - Accessible loading state with `role="status"` and `aria-live="polite"`.
  - Latest generated image display with prompt caption.
  - Selected model pill when a model is available.
- Added a prompt guide card that explains useful prompt ingredients in non-technical language.
- Added a `Recent creations` library section with a `View full history` link and an empty state when there are not enough local history items.
- Reworked responsive CSS so the layout collapses from a two-column desktop workflow to a single-column mobile workflow.

### Architecture Notes

- Affected layer: UI page composition in `src/pages/Generator.tsx`.
- Existing imports remain within the current frontend boundary: React, React Router, Framer Motion, `useLite`, `getOptimizedImageUrl`, and local icons.
- No new backend, persistence, API, Domain, or Core behavior was introduced.
- Business generation behavior remains delegated to the existing `generate` function from `LiteContext`.

### Verification Evidence

- `npm exec tsc -- --noEmit --pretty false` completed without reported errors.
- `npm run build` completed successfully with Vite production output for app, Electron main, and Electron preload bundles.