# Implementation Plan: Admin Season Settings

## Overview

This plan relocates the rarely-changed season-management controls into a
collapsed-by-default `<details id="settingsSection">` Settings disclosure, keeps
the Viewing Season selector on the main dashboard, and adds cross-session
persistence of the last-viewed season via a guarded `localStorage` wrapper. The
work is frontend-only (vanilla-JS IIFE, single stylesheet, static HTML) with
**no build step** and **no new dependencies**.

The order is deliberately incremental: the pure helpers
(`resolveViewingYearId`, `existingPlayerCandidates`, `importCandidatesFrom`) and
their property/unit tests come first so the DOM wiring that depends on them can
be built and integrated on a tested foundation. Season markup relocation and CSS
come next, then the `admin.js` wiring (store, resolver call, write hooks,
storage-failure notice, import checklist render/collect), the single backend
`createYear` change (select-only rostering, replacing the full carry-forward),
and finally a manual verification checklist for the DOM/storage/network
behaviors that are not economically automatable here.

This revision folds in the "import selected players when creating a season"
capability: a pure `importCandidatesFrom` helper (+ property test), a
`#importPlayersList` checklist in the Create New Season block, `admin.js`
render/collect wiring, and the one backend change that makes `createYear` roster
only the selected tokens (no automatic full carry-forward). The frontend and
backend must ship in a single coordinated Apps Script redeploy with no
old-behavior fallback.

Language: **JavaScript** (matches the existing vanilla-JS module IIFE; the
design specifies JS, not pseudocode). The backend change is Google Apps Script.

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

  - [x] 1.6 Add `importCandidatesFrom` pure helper to `assets/js/admin-logic.js`
    - Add `importCandidatesFrom(players, playerYears, currentYearId)` to the existing `AdminLogic` namespace alongside `resolveViewingYearId` and `existingPlayerCandidates` (same file, same browser+Node export shape).
    - Return exactly the players rostered to `currentYearId` — i.e. the players whose `Token` matches a `PlayerYears` row with that `YearID` — ordered ascending by `Name`. Include no player outside that roster and omit none that is in it.
    - Return an empty array when `currentYearId` has no matching `PlayerYears` rows and when `currentYearId` matches nothing; treat missing/empty `players` or `playerYears` as empty inputs. No DOM, no `localStorage`.
    - _Requirements: 4.2, 4.3, 4.8_

  - [x] 1.7 Write property test for import candidates
    - Reuse the dependency-free test harness (`assets/js/admin-logic.test.js`, runnable via `node` or a `<script>` page). Hand-roll a players generator (`{ Token, Name }` with possibly duplicate/edge names), a `PlayerYears` generator (`{ YearID, PlayerToken }` rows spanning several `YearID`s — some matching the chosen `currentYearId`, some not), and a `currentYearId` generator that includes the `currentYearId`-absent boundary and the empty-roster boundary; run a minimum of 100 iterations.
    - Assert `importCandidatesFrom(players, playerYears, currentYearId)` equals exactly the players rostered to `currentYearId` sorted ascending by `Name`; assert no player outside that roster appears and none in it is omitted; assert the empty-result boundary for a `currentYearId` with no roster rows and for a `currentYearId` absent from `playerYears`.
    - `// Feature: admin-season-settings, Property 4: Import candidates are exactly the previous-current roster, name-sorted`
    - **Property 4: Import candidates are exactly the previous-current roster, name-sorted**
    - **Validates: Requirements 4.2, 4.3, 4.8**

- [x] 2. Checkpoint - pure helpers tested before any DOM wiring
  - Ensure all tests pass, ask the user if questions arise. There is no build step and nothing to compile; run tests via `node assets/js/admin-logic.test.js` or the script test page.

- [x] 3. Relocate season markup in `admin.html`
  - [x] 3.1 Reduce the Season card to the Viewing Season selector only
    - Edit the existing "Season" card so it contains only `#yearMessage` and the `#yearSelect` field with its label; remove the make-current, create-season, and any controls that move to Settings from this card. Keep `#yearSelect` and `#yearMessage` IDs and their location on the main dashboard.
    - _Requirements: 2.1, 8.4_

  - [x] 3.2 Add the collapsed-by-default Settings disclosure and relocate controls
    - Insert `<details id="settingsSection" class="card settings">` (omit the `open` attribute so it is collapsed by default) with `<summary class="settings-summary">Settings</summary>` and a `.settings-body` container after the Viewing Season card.
    - Move `#setCurrentYearBtn` (Make This the Current Season), `#newYearLabel` + `#createYearBtn` (Create New Season), and the absorbed Add Existing Player controls (`#addExistingSelect`, `#addExistingBtn`, `#addExistingMessage` plus their heading/helper text) into `.settings-body`, preserving all element IDs.
    - Add `maxlength="100"` to `#newYearLabel` to reflect the 1–100 character bound.
    - Remove the now-empty standalone "Add Existing Player" card wrapper.
    - Leave `#removeFromYearBtn` on the player detail card unchanged.
    - _Requirements: 1.1, 1.2, 1.5, 4.1, 5.1, 6.1, 7.1, 7.4_

  - [x] 3.3 Add the Import_Candidates checklist container to the Create New Season block
    - Inside the Create New Season block within `#settingsSection`, add an import group holding a `<label>` "Import players from the current season", a `<p class="muted">` helper text explaining nothing is pre-selected and a season can be created with no players, and an empty `<div id="importPlayersList"></div>` container that `admin.js` populates.
    - Place it after the `#newYearLabel` + `#createYearBtn` row so the checklist sits with the create controls. Do not pre-render any checkboxes in HTML (they are rendered by JS, all unchecked).
    - _Requirements: 4.2, 4.3_

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

  - [x] 6.3 Add `els.importPlayersList` and `renderImportCandidates()`, call from `refresh()`
    - Add `els.importPlayersList = document.getElementById('importPlayersList')` to the `els` map (the only new `els` entry).
    - Add `renderImportCandidates()`: find the season currently marked current via `isCurrentYearRow`; delegate candidate computation to `AdminLogic.importCandidatesFrom(data.players, data.playerYears, currentYear.YearID)`; render one **all-unchecked** `.import-player` checkbox row per candidate (token as `value`, name as label, HTML-escaped) into `#importPlayersList`, or a single "No players to import." `.muted` note when there is no current season or the candidate list is empty.
    - Call `renderImportCandidates()` from `refresh()` alongside `populateAddExistingSelect()` so the checklist reflects current data and resets to all-unchecked after every refresh.
    - _Requirements: 4.2, 4.3_

  - [x] 6.4 Add `collectImportSelection()`
    - Add `collectImportSelection()` that returns the array of `value`s from the checked `.import-player` boxes inside `#importPlayersList` (the Import_Selection; may be empty).
    - _Requirements: 4.4, 4.8_

  - [x] 6.5 Send `playerTokens` in the create payload and handle success/error retention
    - In the `createYearBtn` handler, include `playerTokens: collectImportSelection()` in the `createYear` request payload.
    - On **success**: clear `#newYearLabel`, reset the checklist to all-unchecked (via `refresh()` → `renderImportCandidates()`), set `selectedYearId = result.yearId` and `Store.writeViewingYearId(result.yearId)`, `refresh()`, and show the confirmation identifying the created season.
    - On **error**: show the backend reason and retain **both** the entered label (do not clear `#newYearLabel`) and the current checklist selection (do not re-render the checklist), so the Admin can retry without re-picking players; `UI.withBusy` re-enables the button.
    - _Requirements: 3.5, 4.4, 4.7, 4.8, 4.9, 4.10_

- [x] 7. Point `populateAddExistingSelect()` at the pure candidate helper
  - [x] 7.1 Use `existingPlayerCandidates` to build the add-existing options
    - Refactor `populateAddExistingSelect()` so it computes candidates via `existingPlayerCandidates(players, rosterTokensForYear(selectedYearId))` and only renders the returned array; preserve disabling the add button with the all-rostered message when the result is empty. Keep it running during `refresh()` and on `#yearSelect` change.
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Change the backend `createYear` action to roster only selected tokens
  - [x] 8.1 Pass `playerTokens` through in `apps-script/Code.gs`
    - In `doPost`, change the `'createYear'` case to call `createYear_(body.label, body.playerTokens)` after `requireSession_(body.session)`, still returning via `jsonOut_(...)`. Do not add, rename, or remove any action — this is the same `createYear` action with an extended request.
    - _Requirements: 8.1, 8.3_

  - [x] 8.2 Roster only the provided tokens in `apps-script/Years.gs` `createYear_`
    - Change the signature to `createYear_(label, playerTokens)`. Keep the existing label trim + required check, the duplicate-label check, `setAllYearsNotCurrent_()`, and the append of the new Years row (`IsCurrent: true`) unchanged.
    - Replace the roster step: iterate the provided tokens (`Array.isArray(playerTokens) ? playerTokens : []`) and roster each truthy token via `addPlayerToYear_(token, yearId)` (idempotent, so duplicate tokens are harmless). An empty or omitted list rosters nobody → empty-roster season.
    - REMOVE the unconditional `if (previousCurrent) copyPlayerYearRoster_(previousCurrent.YearID, yearId)` carry-forward (and the now-unused `previousCurrent` capture). Keep **no** old-behavior fallback.
    - _Requirements: 4.8, 8.1, 8.4_

  - [x] 8.3 Remove the now-unused `copyPlayerYearRoster_` helper in `apps-script/PlayerYears.gs`
    - Delete `copyPlayerYearRoster_` (its only caller was `createYear_`, confirmed by the design). Leave `addPlayerToYear_` and `isPlayerInYear_` in place — they are used elsewhere and by the new roster loop.
    - Note: tasks 8.1–8.3 require a single coordinated Apps Script redeploy shipped **together with** the frontend change; there is no fallback to the old full carry-forward behavior.
    - _Requirements: 8.1, 8.3, 8.4_

- [x] 9. Checkpoint - relocation and wiring integrated
  - Ensure all tests pass, ask the user if questions arise. There is no build step and nothing to compile; run the pure-helper tests via `node` or the script test page and confirm the reused `createYear`/`setCurrentYear`/`addExisting` handlers still resolve their `els.*` references after the markup move, and that the import checklist renders/collects against `#importPlayersList`.

- [~] 10. Manual verification checklist (DOM, localStorage, live backend)
  - Perform and record the following manual checks against a running deployment. These are not economically automatable here (real DOM, real `localStorage`, live Apps Script backend). Note: there is no build step and nothing to compile.
  - Settings collapse (Req 1): on load Settings is collapsed with controls hidden; summary reads "Settings" with a visible marker; clicking toggles open/closed and rotates the marker.
  - Viewing selector placement (Req 2): selector sits outside Settings, always enabled, marks the current season with `(Current)`, switching updates Team Totals/Roster/detail; an empty season shows the empty-state message.
  - Persistence (Req 3): selecting a non-current season then reloading restores it; cleared/blocked `localStorage` falls back to current season with the non-blocking notice and still completes load; a stale stored id falls back to current/newest.
  - Create season (Req 4): empty/whitespace label rejected with validation message and no request; a valid label creates, clears input, selects+persists the new season, shows confirmation; backend error shows the reason, keeps the label AND the checklist selection, re-enables the button.
  - Import checklist (Req 4.2, 4.3, 4.4, 4.8): on render no candidate is pre-checked; selecting a subset and creating rosters exactly those players onto the new season; creating with zero selected produces an empty-roster season; when there is no previous roster or no current season the checklist shows a "no players to import" note and creation still succeeds with an empty season.
  - Make current (Req 5): button hidden when viewing the current season, shown otherwise; success moves the `(Current)` marker; error leaves state unchanged.
  - Add existing player (Req 6): selector lists only non-rostered players name-sorted; updates on viewing-season change; disabled with all-rostered message when none remain; success adds to roster; error keeps selector usable.
  - Remove from season (Req 7): control present on player detail, absent from Settings; removal updates roster; error leaves player rostered.
  - Contract preservation (Req 8): with Settings collapsed the dashboard still scopes to the viewing season; the empty-season redeploy message still shows; the ONLY modified backend action is `createYear` (extended request accepting `playerTokens`), while `setCurrentYear`/`addPlayerToYear`/`removePlayerFromYear`/`adminData` are unchanged; no backend action is added, renamed, or removed; the change ships as a single coordinated Apps Script redeploy (frontend + backend together) with no old-behavior fallback.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

## Notes

- Tasks marked with `*` are optional (property, unit, and integration tests) and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific requirements (or a design property) for traceability.
- Property tests use a hand-rolled generator with a minimum of 100 iterations and add no new dependencies, honoring the no-build / no-dependency constraint.
- The three pure helpers (`resolveViewingYearId`, `existingPlayerCandidates`, `importCandidatesFrom`) and their tests come before the DOM wiring that depends on them, so integration builds on a tested foundation.
- There is no build step and nothing to compile for the frontend; tests run via `node assets/js/admin-logic.test.js` or a `<script>` test page. Checkpoints ensure incremental validation.
- The reused `setCurrentYear` / `addExisting` handlers keep their logic verbatim; only their host markup moves. The `createYear` handler keeps its trimmed-empty guard and persistence but is extended to send `playerTokens` and to retain the label + checklist on error.
- The single backend change modifies only the existing `createYear` action (`Code.gs` passthrough + `Years.gs` select-only rostering + removal of the dead `copyPlayerYearRoster_` helper). It requires one coordinated Apps Script redeploy shipped together with the frontend, with no fallback to the old full-roster carry-forward. The backend tasks touch separate files from the frontend and run in the first wave.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "8.1", "8.2", "8.3"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "4.1"] },
    { "id": 2, "tasks": ["1.6"] },
    { "id": 3, "tasks": ["1.7", "3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3"] },
    { "id": 6, "tasks": ["5.1", "5.2"] },
    { "id": 7, "tasks": ["5.3"] },
    { "id": 8, "tasks": ["5.4"] },
    { "id": 9, "tasks": ["6.1"] },
    { "id": 10, "tasks": ["6.2"] },
    { "id": 11, "tasks": ["6.3"] },
    { "id": 12, "tasks": ["6.4"] },
    { "id": 13, "tasks": ["6.5"] },
    { "id": 14, "tasks": ["7.1"] }
  ]
}
```
