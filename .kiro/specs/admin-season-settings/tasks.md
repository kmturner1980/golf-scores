# Implementation Plan: Admin Season Settings

## Overview

This plan relocates the rarely-changed season-management controls into a
collapsed-by-default `<details id="settingsSection">` Settings disclosure, keeps
the Viewing Season selector on the main dashboard, and adds cross-session
persistence of the last-viewed season via a guarded `localStorage` wrapper. The
work is frontend-only (vanilla-JS IIFE, single stylesheet, static HTML) with
**no build step** and **no new dependencies**.

The order is deliberately incremental: the two pure helpers
(`resolveViewingYearId`, `existingPlayerCandidates`) and their property/unit
tests come first so the DOM wiring that depends on them can be built and
integrated on a tested foundation. Season markup relocation and CSS come next,
then the `admin.js` wiring (store, resolver call, write hooks, storage-failure
notice), and finally a manual verification checklist for the DOM/storage/network
behaviors that are not economically automatable here.

Language: **JavaScript** (matches the existing vanilla-JS module IIFE; the
design specifies JS, not pseudocode).

## Tasks

- [x] 1. Create the pure logic module and expose it without a build step
  - [x] 1.1 Create `assets/js/admin-logic.js` with the pure helpers and namespace
    - Create the sibling file `assets/js/admin-logic.js` that defines an `AdminLogic` namespace loadable both in the browser (attach to `window.AdminLogic`) and under Node (`module.exports` when `module` is defined), so a `<script>` test page or `node` harness can load it with no bundler.
    - Move/define `isCurrentYearRow(row)` in this module so it accepts boolean `true` and the strings `"TRUE"`/`"true"` and rejects `false`/`undefined` (used as the `isCurrent` predicate by the resolver).
    - Implement pure `resolveViewingYearId(years, storedId, isCurrent)`: return `null` when `years` is empty; return `storedId` when it matches a loaded season's `YearID`; else return the `IsCurrent` season's `YearID` when one exists; else return the `YearID` of the season with the most recent `CreatedAt`. It must never return an id absent from `years`. No DOM, no `localStorage`.
    - Implement pure `existingPlayerCandidates(players, rosterTokens)`: return exactly the players whose token is not in `rosterTokens`, ordered ascending by `Name`, with no rostered player included and no non-rostered player omitted.
    - _Requirements: 3.2, 3.3, 3.4, 3.6, 6.1, 6.2, 6.3, 8.1_

  - [x] 1.2 Write property test for season-selection precedence
    - Add a dependency-free test file (e.g. `assets/js/admin-logic.test.js`) runnable via `node assets/js/admin-logic.test.js` or a `<script>` test page; hand-roll a season-list generator (`{ YearID, Label, CreatedAt, IsCurrent }` with random ids, `CreatedAt` timestamps including ties, zero/one/many current rows as boolean or `"TRUE"`/`"true"`, plus the empty-list case) and a stored-id generator (`null`, an id from the list, or a stale random id); run a minimum of 100 iterations.
    - Assert the returned id follows the precedence chain stored→current→newest→null for each generated `(years, storedId)`.
    - `// Feature: admin-season-settings, Property 1: Season selection honors precedence`
    - **Property 1: Season selection honors precedence**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.6**

  - [x] 1.3 Write property test for resolver validity/totality
    - Reuse the generators from 1.2; run a minimum of 100 iterations.
    - Assert the result is `null` iff `years` is empty, and otherwise is a `YearID` present in `years` — the safety net catching any fabricated id.
    - `// Feature: admin-season-settings, Property 2: Resolver result is always a valid loaded season id or null`
    - **Property 2: Resolver result is always a valid loaded season id or null**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.6**

  - [x] 1.4 Write property test for add-existing candidates
    - Hand-roll a players generator (`{ Token, Name }` with possibly duplicate/edge names) and a roster-token generator (random subset including the all-rostered and none-rostered boundaries); run a minimum of 100 iterations.
    - Assert `existingPlayerCandidates(players, rosterTokens)` equals the non-rostered players sorted ascending by `Name`; assert no rostered token appears; assert the empty-result boundary when every player is rostered.
    - `// Feature: admin-season-settings, Property 3: Add-existing candidates are exactly the non-rostered players, name-sorted`
    - **Property 3: Add-existing candidates are exactly the non-rostered players, name-sorted**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 1.5 Write unit/example tests for the pure helpers
    - `isCurrentYearRow` accepts `true`, `"TRUE"`, `"true"` and rejects `false`/`undefined`.
    - Trimmed-empty label detection: `"   "` is treated as empty (drives Req 4.4).
    - _Requirements: 4.4, 5.1_

- [x] 2. Checkpoint - pure helpers tested before any DOM wiring
  - Ensure all tests pass, ask the user if questions arise. There is no build step and nothing to compile; run tests via `node assets/js/admin-logic.test.js` or the script test page.

- [ ] 3. Relocate season markup in `admin.html`
  - [-] 3.1 Reduce the Season card to the Viewing Season selector only
    - Edit the existing "Season" card so it contains only `#yearMessage` and the `#yearSelect` field with its label; remove the make-current, create-season, and any controls that move to Settings from this card. Keep `#yearSelect` and `#yearMessage` IDs and their location on the main dashboard.
    - _Requirements: 2.1, 8.4_

  - [x] 3.2 Add the collapsed-by-default Settings disclosure and relocate controls
    - Insert `<details id="settingsSection" class="card settings">` (omit the `open` attribute so it is collapsed by default) with `<summary class="settings-summary">Settings</summary>` and a `.settings-body` container after the Viewing Season card.
    - Move `#setCurrentYearBtn` (Make This the Current Season), `#newYearLabel` + `#createYearBtn` (Create New Season), and the absorbed Add Existing Player controls (`#addExistingSelect`, `#addExistingBtn`, `#addExistingMessage` plus their heading/helper text) into `.settings-body`, preserving all element IDs.
    - Add `maxlength="100"` to `#newYearLabel` to reflect the 1–100 character bound.
    - Remove the now-empty standalone "Add Existing Player" card wrapper.
    - Leave `#removeFromYearBtn` on the player detail card unchanged.
    - _Requirements: 1.1, 1.2, 1.5, 4.1, 5.1, 6.1, 7.1, 7.4_

- [x] 4. Add Settings disclosure styles in `assets/css/styles.css`
  - [x] 4.1 Style the Settings summary and open/closed marker from brand variables
    - Add `.settings > summary.settings-summary` rules (cursor, `list-style: none`, heading font, navy color, flex layout) and the `::-webkit-details-marker { display:none }` reset so the native triangle is suppressed.
    - Add a `::before` gold triangle marker built from `var(--gold)` that rotates 90deg via `.settings[open] > summary.settings-summary::before`, giving the visible open/closed indicator with no JS. Reuse the existing `.card` shell for the section; add `.settings .settings-body { margin-top: ... }` spacing.
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 5. Wire the guarded storage wrapper and resolver into `admin.js`
  - [x] 5.1 Add the guarded `Store` wrapper and `storageOk` flag
    - Load `admin-logic.js` before `admin.js` (add the `<script>` in `admin.html`) and reference the exposed helpers from the IIFE.
    - Add module-private `VIEWING_SEASON_STORE_KEY = 'golf.admin.viewingYearId'`, a `storageOk` flag defaulting to `true`, and a `Store` object with `readViewingYearId()` / `writeViewingYearId(yearId)` that wrap `localStorage` in try/catch; on any failure flip `storageOk = false` and return `null` (read) / no-op (write). `writeViewingYearId` only writes truthy ids.
    - _Requirements: 3.1, 3.7_

  - [x] 5.2 Write unit test for guarded Store read failure
    - With a `localStorage` stub whose `getItem` throws, assert `Store.readViewingYearId()` returns `null` and sets `storageOk = false` (drives the Req 3.7 fallback and the empty/guard paths).
    - _Requirements: 3.7_

  - [x] 5.3 Read the store and resolve initial selection in `populateYearSelect()`
    - Replace the current keep-or-fallback logic with a single `Store.readViewingYearId()` read, then `selectedYearId = resolveViewingYearId(data.years, storedId, isCurrentYearRow)`. Preserve the empty-seasons branch (existing actionable redeploy message into `#yearMessage`, no store write). Keep the `(Current)` marker and sort-by-`CreatedAt` option rendering unchanged.
    - _Requirements: 2.4, 3.2, 3.3, 3.4, 3.6, 8.4_

  - [x] 5.4 Render the non-blocking storage-failure notice
    - After selection resolves in `populateYearSelect()`, if `storageOk` is `false` and seasons exist, render a non-blocking `.muted` notice into `#yearMessage` indicating the last-viewed season couldn't be restored. Load must never be blocked.
    - _Requirements: 3.7_

- [x] 6. Wire the write-on-change and write-on-create hooks in `admin.js`
  - [x] 6.1 Persist selection in the `#yearSelect` change handler
    - In the existing change handler, call `Store.writeViewingYearId(selectedYearId)` immediately after setting `selectedYearId` and before any re-render, so the next load can read it. Keep the existing re-render calls (`renderTeamTiles`/`renderRoster`/`populateAddExistingSelect`/`syncSetCurrentYearBtn`) unchanged.
    - _Requirements: 2.2, 3.1_

  - [x] 6.2 Persist the new season in the `createYearBtn` success path
    - In the existing `createYear` success path, after `selectedYearId = result.yearId`, call `Store.writeViewingYearId(result.yearId)`. Leave the rest of the handler (clear label, success message, `refresh()`) unchanged.
    - _Requirements: 3.5, 4.5, 4.6_

- [x] 7. Point `populateAddExistingSelect()` at the pure candidate helper
  - [x] 7.1 Use `existingPlayerCandidates` to build the add-existing options
    - Refactor `populateAddExistingSelect()` so it computes candidates via `existingPlayerCandidates(players, rosterTokensForYear(selectedYearId))` and only renders the returned array; preserve disabling the add button with the all-rostered message when the result is empty. Keep it running during `refresh()` and on `#yearSelect` change.
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Checkpoint - relocation and wiring integrated
  - Ensure all tests pass, ask the user if questions arise. There is no build step and nothing to compile; run the pure-helper tests via `node` or the script test page and confirm the reused `createYear`/`setCurrentYear`/`addExisting` handlers still resolve their `els.*` references after the markup move.

- [x] 9. Manual verification checklist (DOM, localStorage, live backend)
  - Perform and record the following manual checks against a running deployment. These are not economically automatable here (real DOM, real `localStorage`, live Apps Script backend). Note: there is no build step and nothing to compile.
  - Settings collapse (Req 1): on load Settings is collapsed with controls hidden; summary reads "Settings" with a visible marker; clicking toggles open/closed and rotates the marker.
  - Viewing selector placement (Req 2): selector sits outside Settings, always enabled, marks the current season with `(Current)`, switching updates Team Totals/Roster/detail; an empty season shows the empty-state message.
  - Persistence (Req 3): selecting a non-current season then reloading restores it; cleared/blocked `localStorage` falls back to current season with the non-blocking notice and still completes load; a stale stored id falls back to current/newest.
  - Create season (Req 4): empty/whitespace label rejected with validation message and no request; a valid label creates, clears input, selects+persists the new season, shows confirmation; backend error shows the reason, keeps the label, re-enables the button.
  - Make current (Req 5): button hidden when viewing the current season, shown otherwise; success moves the `(Current)` marker; error leaves state unchanged.
  - Add existing player (Req 6): selector lists only non-rostered players name-sorted; updates on viewing-season change; disabled with all-rostered message when none remain; success adds to roster; error keeps selector usable.
  - Remove from season (Req 7): control present on player detail, absent from Settings; removal updates roster; error leaves player rostered.
  - Contract preservation (Req 8): with Settings collapsed the dashboard still scopes to the viewing season; the empty-season redeploy message still shows; no files under `apps-script/` are modified.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

## Notes

- Tasks marked with `*` are optional (property, unit, and integration tests) and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific requirements (or a design property) for traceability.
- Property tests use a hand-rolled generator with a minimum of 100 iterations and add no new dependencies, honoring the no-build / no-dependency constraint.
- The two pure helpers and their tests come before the DOM wiring that depends on them, so integration builds on a tested foundation.
- There is no build step and nothing to compile; tests run via `node assets/js/admin-logic.test.js` or a `<script>` test page. Checkpoints ensure incremental validation.
- The reused `createYear` / `setCurrentYear` / `addExisting` handlers keep their logic verbatim; only their host markup moves.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "4.1"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3"] },
    { "id": 6, "tasks": ["5.4"] },
    { "id": 7, "tasks": ["6.1"] },
    { "id": 8, "tasks": ["6.2"] },
    { "id": 9, "tasks": ["7.1"] }
  ]
}
```
