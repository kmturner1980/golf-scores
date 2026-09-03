# Implementation Plan: Admin Year Management & Navigation

## Overview

Frontend-only restructure of the Coach Admin app (`admin.html`, `assets/js/admin.js`, `assets/css/styles.css`, `assets/js/admin-logic.js`). Work proceeds bottom-up: first extract and test the DOM-free logic helpers, then add the CSS view-state and hamburger-menu markup, then wire the JS controllers (menu, year-management view-state mirroring the player view, edit-year with `editingYearId`, and the 4-step walkthrough with best-effort confirm), then relocate the existing Settings/Add-Player controls into their new homes, and finally run the documented manual verification. No Apps Script/backend changes, no new HTML page, no session/auth change. All relocated controls keep using the existing backend actions. No jsdom/puppeteer; property/unit tests run in the existing dependency-free Node harness.

## Tasks

- [x] 1. Extract pure walkthrough/year-list logic into AdminLogic
  - [x] 1.1 Add `isValidYearLabel`, `walkStepValidation`, `validateNewPlayerRow`, `collectNewPlayers`, `buildConfirmSummary`, and `yearListRows` to `assets/js/admin-logic.js`
    - Keep all helpers DOM-free, storage-free, navigation-free; export via the existing UMD-ish factory alongside the current helpers
    - `walkStepValidation(walk)` returns `{ labelValid, step1Complete, canConfirm }` with `canConfirm === isValidYearLabel(walk.label)` (steps 2 & 3 skippable)
    - `collectNewPlayers` drops blank-name rows, trims names, preserves order; `buildConfirmSummary` reuses it
    - `yearListRows(years, isCurrent)` returns newest-first `{ yearId, label, isCurrent, canMakeCurrent }` mirroring `populateYearSelect`'s sort
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 5.3, 6.3, 6.5, 6.7, 6.8, 6.9, 6.10_

  - [x]* 1.2 Write property test for label validity
    - **Property 3: Label validity ignores surrounding whitespace**
    - **Validates: Requirements 6.3**

  - [x]* 1.3 Write property test for confirm gating / skippable steps
    - **Property 4: Confirm is gated only by the label (steps 2 and 3 are skippable)**
    - **Validates: Requirements 6.3, 6.5, 6.7, 6.8**

  - [x]* 1.4 Write property test for new-player collection
    - **Property 5: New-player collection drops blank rows and preserves order**
    - **Validates: Requirements 6.10**

  - [x]* 1.5 Write property test for confirm summary
    - **Property 6: Confirm summary reflects the model faithfully**
    - **Validates: Requirements 6.9**

  - [x]* 1.6 Write property tests for the season-list view model
    - **Property 1: Season list is complete and newest-first**
    - **Property 2: Make-current visibility is exactly the non-current seasons**
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5, 5.3**

- [x] 2. Checkpoint - Ensure all AdminLogic tests pass
  - Run the Node harness (`admin-logic.test.js`) for the new helpers; ensure all pass, ask the user if questions arise.

- [x] 3. Add markup and CSS for the new views and menu
  - [x] 3.1 Add hamburger button + menu panel markup to `header.app-header` in `admin.html`
    - `#menuToggle` button with `aria-label`, `aria-expanded`, `aria-controls`; `#menuPanel` listing "Dashboard" (`#menuDashboard`) and "Year Management" (`#menuYearMgmt`)
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Add the `#yearMgmt` full-screen view container to `#dashboard` in `admin.html`
    - Include a season-list region, an in-view Back control, an Add-New-Year button, an Edit-Year panel region, and a Walkthrough region (all initially empty/hidden, rendered by JS)
    - Leave `#playerDetail` and `#editRoundCard` intact
    - _Requirements: 3.1, 3.3, 4.1, 4.7, 5.1, 6.1_

  - [x] 3.3 Add CSS view-state and menu styles to `assets/css/styles.css`
    - Add `#dashboard.year-mgmt-open > *:not(#yearMgmt) { display: none !important; }` mirroring the `.player-view-open` rule, composing with `.dashboard-loading`
    - Style the menu panel and hamburger using `:root` brand vars and `.card` conventions; ensure the `@media (max-width:640px)` block covers menu/year-mgmt/edit-year/walkthrough layout
    - Note the now-unused `.settings`/`.settings-summary` rules (the Settings disclosure is being removed); leave a comment or remove them
    - _Requirements: 3.1, 3.7, 8.3_

- [x] 4. Wire the hamburger menu controller
  - [x] 4.1 Add menu open/close/keyboard/outside-click behavior in `assets/js/admin.js`
    - Toggle on click; reflect state in `aria-expanded`; Escape and outside-click close; focus management on open
    - "Dashboard" closes any open full-screen view and shows the Main_Dashboard; "Year Management" closes the menu and calls `openYearMgmt()`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 5. Wire the Year Management full-screen view-state (mirror the player view)
  - [x] 5.1 Add `yearMgmtOpen` guard and `openYearMgmt`/`closeYearMgmt(fromPopstate)` in `assets/js/admin.js`
    - Mirror `enterPlayerView`/`closePlayerDetail`: capture scrollY, toggle `.year-mgmt-open`, single `pushState` on open, idempotent when already open, `history.back()` only when `fromPopstate` is false, restore scroll on close
    - Enforce the single-open invariant: `openYearMgmt` closes the player view first if open; ensure `openYearMgmt`/`showPlayerDetail` never leave both guards true
    - Extend the shared `popstate` handler to dispatch: if `playerViewOpen` close player view, else if `yearMgmtOpen` close year management
    - Wire the in-view Back control to `closeYearMgmt(false)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 5.2 Render the season list from `AdminLogic.yearListRows(data.years, isCurrentYearRow)`
    - One row per season with label + Current marker; per-row Edit control; per-row Make-current control only when `canMakeCurrent`; Add-New-Year button
    - Make-current calls `setCurrentYear` for that row's YearID then `refresh()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 6. Wire the Edit-Year panel (targets editingYearId)
  - [x] 6.1 Add `editingYearId` state and `openEditYear(yearId)`/`closeEditYear()` in `assets/js/admin.js`
    - `openEditYear` records `editingYearId` (separate from `selectedYearId`) and renders the panel; `closeEditYear` returns to the season list without pushing history
    - _Requirements: 5.1, 5.2_

  - [x] 6.2 Render the edited season's roster with per-player removal
    - List `rosterPlayersForYear(editingYearId)`; Remove calls `removePlayerFromYear(token, editingYearId)` then `refresh()` and re-renders the panel
    - Show a Make-current control only when the edited season is not current, calling `setCurrentYear(editingYearId)`
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 6.3 Wire Add-Existing-Player scoped to editingYearId
    - Candidates from `existingPlayerCandidates(data.players, rosterTokensForYear(editingYearId))`; add calls `addPlayerToYear(token, editingYearId)` then `refresh()`
    - _Requirements: 5.6, 5.7_

  - [x] 6.4 Wire Add-brand-new-player scoped to editingYearId
    - Name + Boy/Girl form calls `addPlayer(name, sex, editingYearId)`; show the generated `playerLink(token)` in a copyable link box; do NOT add any rename control
    - _Requirements: 5.8, 5.9, 5.10, 5.11_

- [x] 7. Checkpoint - Ensure view-state and edit-year compose correctly
  - Ensure all tests pass; verify (static + quick manual) that player-view and year-mgmt never open together and edit-year actions target editingYearId. Ask the user if questions arise.

- [x] 8. Implement the Add New Year walkthrough
  - [x] 8.1 Add the walkthrough model + step navigation in `assets/js/admin.js`
    - `walk = { step, label, returningTokens, newPlayers, result }`; `startWalkthrough`, `walkGoTo`, `renderWalkStep` with a visible progress indicator and Back/Next; gate Next/Confirm using `AdminLogic.walkStepValidation`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Render Step 2 (returning) and Step 3 (new players), both skippable
    - Step 2: checklist from `importCandidatesFrom(data.players, data.playerYears, previousCurrentYearId)`, nothing selected by default; Step 3: repeatable name+Boy/Girl rows with add-another; both steps skippable
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 8.3 Render Step 4 review from `AdminLogic.buildConfirmSummary(walk, data.players)`
    - Summarize label, selected returning players, and the new players to be created (blank rows already dropped by `collectNewPlayers`)
    - _Requirements: 6.9, 6.10_

  - [x] 8.4 Implement `walkConfirm()` best-effort creation sequence
    - Call `createYear(walk.label, walk.returningTokens)`; on failure report and keep the walkthrough open with nothing created
    - On success, call `addPlayer(name, sex, yearId)` per valid new row, partitioning results into `created` (with `playerLink(token)`) and `failed`; keep the year and successes on partial failure (no rollback)
    - Set `selectedYearId = yearId`, `Store.writeViewingYearId(yearId)`, `await refresh()`; show a success screen listing created players + links and any failures, directing the user to edit that season to retry
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 9. Relocate existing controls and trim the Main dashboard
  - [x] 9.1 Remove the `#settingsSection` `<details>` and the standalone Add Player card from `admin.html`
    - Delete the Settings card (`setCurrentYearBtn`, `newYearLabel`/`createYearBtn`, `#importPlayersList`, `#addExistingSelect`/`addExistingBtn`) and the Add Player card (`#addPlayerForm`, `#newLinkBox`); keep the Season selector, Team Totals, and Roster
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 9.2 Re-home the relocated controllers in `assets/js/admin.js` and clean up `refresh()`
    - Point create-year through the walkthrough; point make-current/import/add-existing/add-player through the year-management/edit-year handlers using the same backend actions; update the `els` map and remove now-dangling references to deleted elements; ensure `refresh()` re-renders the season list / edit-year panel when a full-screen view is open and preserves existing Main_Dashboard rendering and season scoping
    - _Requirements: 2.4, 8.1, 8.2, 8.4_

- [ ] 10. Documented manual verification (no automated runner)
  - [ ]* 10.1 Author and execute the manual verification procedure at ~390px and desktop
    - Cover: hamburger open/close + keyboard/Escape/outside-click/aria; enter/exit Year Management via menu, in-view Back, and browser Back; single-open invariant (player view ↔ year management) and no double-Back; edit-year actions target `editingYearId` (edit a season other than the viewed one); the 4-step walkthrough including skipping steps 2 & 3 and empty-season creation; confirm success and simulated partial failure with retry guidance; and a regression pass over player view, roster, team totals, rounds editing, loading overlay, and mobile responsiveness
    - _Requirements: 1.1-1.9, 3.1-3.8, 5.1-5.11, 6.1-6.10, 7.1-7.8, 8.1-8.4_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all AdminLogic tests pass and the manual procedure is complete; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (all tests and the manual procedure) and can be skipped for a faster MVP, though the manual procedure is the primary safety net for the DOM/navigation behavior under the no-jsdom constraint.
- Each task references specific requirement sub-clauses for traceability.
- Property tests validate the extracted DOM-free `AdminLogic` helpers (≥100 iterations, tagged `Feature: admin-year-management-nav, Property N: ...`); navigation/view-state/backend-wiring behavior is verified by static analysis + the documented manual procedure.
- No Apps Script/backend edits, no new HTML page, no session/auth change; all relocated controls reuse the existing backend actions.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["4.1", "5.1"] },
    { "id": 3, "tasks": ["5.2", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "8.1"] },
    { "id": 5, "tasks": ["8.2", "8.3"] },
    { "id": 6, "tasks": ["8.4"] },
    { "id": 7, "tasks": ["9.1"] },
    { "id": 8, "tasks": ["9.2"] },
    { "id": 9, "tasks": ["10.1"] }
  ]
}
```
