# Implementation Plan: Admin Player Full-Screen View

## Overview

Frontend-only implementation across `admin.html`, `assets/js/admin.js`, and `assets/css/styles.css`. Work builds incrementally: first the CSS view-state and responsive-rounds styles, then the navigation controller (open/close/scroll/history) in `admin.js`, then the responsive rounds rendering with a pure, unit-testable mapper, then wiring the round editor and post-mutation transitions, and finally the on-page Back links in `admin.html`. Language is JavaScript (existing browser IIFE); no build step, no new dependencies, no DOM test runner.

## Tasks

- [x] 1. Add full-screen player-view and responsive-rounds styles
  - In `assets/css/styles.css`, add a `#dashboard.player-view-open > *:not(#playerDetail):not(#editRoundCard) { display: none !important; }` rule so only the player view (or editor) shows when open.
  - Add player-view container styling that reuses `:root` brand variables and the `.card` system.
  - Add round-card styles under the existing `@media (max-width: 640px)` block: hide the player-detail rounds `<table>` and show a stacked card layout, scoped to a round-specific class/container so no other `.table-scroll` table is affected.
  - Confirm `player-view-open` and the existing `dashboard-loading` rule compose without conflict.
  - _Requirements: 1.3, 5.2, 5.5, 9.2, 9.3, 10.1, 10.2_

- [x] 2. Implement the navigation controller in admin.js
  - [x] 2.1 Add module state and open/close functions
    - Add `rosterScrollY`, `playerViewOpen`, and `suppressPopstate`/guard state near `currentPlayerToken`.
    - Implement `enterPlayerView()`: early-return if already open; capture `window.scrollY`; add `.player-view-open`; `scrollTo(0,0)`; `history.pushState({ adminPlayerView: true }, '', location.href)`; set `playerViewOpen = true`.
    - Implement `closePlayerDetail(fromPopstate)`: early-return if not open; remove `.player-view-open`; hide `#editRoundCard`; set `playerViewOpen = false`; if `!fromPopstate` call `history.back()`; then `scrollTo(0, rosterScrollY)`.
    - Refactor the tail of `showPlayerDetail(token)` (currently `remove('hidden')` + `scrollIntoView`) to call `enterPlayerView()` after building content; keep the `if (!player) return;` guard before entering.
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.3, 3.1, 3.2, 4.1_

  - [x] 2.2 Wire the popstate handler
    - Add `onPopState(event)` that calls `closePlayerDetail(true)` only when `playerViewOpen` is true; otherwise no-op.
    - Register the handler with `window.addEventListener('popstate', onPopState)`.
    - _Requirements: 4.2, 4.4, 4.5_

  - [ ]* 2.3 Static-analysis + manual verification of navigation
    - **Property 2: Open/close preserves roster scroll position**
    - **Property 3: Each Back action closes the view exactly once and leaves no extra history**
    - Verify via the documented manual procedure (scroll far, open, Back via top link / bottom link / gesture; confirm exact restore and no double-trigger) and static reasoning on the `playerViewOpen` guard.
    - **Validates: Requirements 3.1, 3.2, 4.1, 4.3, 4.4, 4.5, 8.6**

- [x] 3. Implement responsive rounds rendering
  - [x] 3.1 Extract the pure round-fields mapper
    - Add `roundCardFields(row)` returning `[{label, value}]` for Date, Course, Tees, Holes, Score, Diff, Putts from an already-computed round row, including `null → '—'` for Score/Putts; expose it for the Node harness (module export guarded for browser, following the existing test-harness pattern).
    - Use the mapper (or its values) as the single source so the table cells and mobile cards stay in sync.
    - _Requirements: 5.4_

  - [x] 3.2 Render round cards alongside the table
    - In `showPlayerDetail`, in addition to the existing rounds `<table>`, emit a mobile card block per round using the same `escapeHtml`-sanitized values and the same `data-round` Edit/Delete buttons (`.edit-round`/`.delete-round`).
    - Ensure the existing `.edit-round`/`.delete-round` click handlers are attached to the card buttons too.
    - _Requirements: 5.1, 5.2, 5.3, 6.4, 9.1_

  - [x]* 3.3 Unit-test the round-fields mapper
    - **Property 1: Round display values are layout-independent**
    - In the Node harness (pattern of `admin-logic.test.js`), assert `roundCardFields` returns the expected labeled values for generated round rows, covering null Score/Putts (`'—'`) and tournament/summary badge cases.
    - **Validates: Requirements 5.4**

- [x] 4. Checkpoint - verify view and rounds render
  - Ensure the mapper test passes and the player view opens full-screen with responsive rounds; ask the user if questions arise.

- [x] 5. Wire the round editor into the full-screen view
  - [x] 5.1 Make the editor a full-screen sub-view
    - In `openEditRound` and `openAddRound`, hide `#playerDetail` and show `#editRoundCard`; replace `scrollIntoView` with `scrollTo(0,0)`; leave `playerViewOpen` and the single history entry unchanged.
    - Confirm `.player-view-open` keeps only `#editRoundCard` visible (no other cards behind it).
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 5.2 Return to player view on editor success
    - Confirm the edit-round submit success path hides `#editRoundCard` and calls `showPlayerDetail(currentPlayerToken)` (which re-shows the detail; `enterPlayerView()` is idempotent so no new history entry).
    - _Requirements: 7.4, 8.2, 8.6_

- [x] 6. Wire post-mutation transitions
  - [x] 6.1 Player-preserving mutations return to the player view
    - Confirm `deleteRound` and the sex-save handler call `refresh()` then `showPlayerDetail(currentPlayerToken)` (idempotent open; no extra history entry).
    - _Requirements: 8.1, 8.3, 8.6_

  - [x] 6.2 Player-removing mutations return to the roster
    - In the `removeFromYearBtn` handler and `deletePlayer`, after setting `currentPlayerToken = null` and `refresh()`, call `closePlayerDetail(false)` so the dashboard returns to the Roster_View (replacing the ad-hoc `playerDetail.classList.add('hidden')` handling and ensuring the pushed history entry is consumed).
    - _Requirements: 8.4, 8.5_

- [x] 7. Add on-page Back links in admin.html
  - Add a "Back to roster" control at the top of `#playerDetail` and another at the bottom; both invoke the close path (`closePlayerDetail(false)` / `history.back()`).
  - Register their click handlers in `admin.js`.
  - Preserve all existing player-view controls (stats tiles, coaching focus, copy-link box, sex edit/save/cancel, Add Round, Remove from Season, Delete Player).
  - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3, 6.5_

- [x] 8. Final checkpoint - full manual verification
  - Run the design's manual verification procedure on desktop and at ≤640px (open via row and via "View full details"; top/bottom Back links; Back gesture; scroll restore; editor open/submit; delete-round & save-sex stay in view; remove-from-season & delete-player land on roster; loading composes correctly; desktop table unchanged). Confirm the diff touches only `admin.html`, `admin.js`, and `styles.css`. Ask the user if questions arise.
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Only Property 1 (round-field parity) is automatable in the dependency-free Node harness; Properties 2 and 3 are verified by static analysis + the documented manual procedure (no jsdom/puppeteer introduced, per constraint).
- Each task references specific requirement clauses for traceability.
- This is a presentation/navigation change: no backend/Apps Script, session/auth, or new-page changes.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "3.1"] },
    { "id": 1, "tasks": ["2.1", "3.3"] },
    { "id": 2, "tasks": ["2.2", "3.2"] },
    { "id": 3, "tasks": ["2.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1", "6.2"] },
    { "id": 5, "tasks": ["7"] }
  ]
}
```
