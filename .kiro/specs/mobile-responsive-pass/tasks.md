# Implementation Plan: Mobile Responsive Pass

## Overview

Frontend-only changes. Almost all work is CSS added to the existing `@media (max-width: 640px)` block in `assets/css/styles.css`. The single non-CSS change is behavior-neutral `data-label` markup in `assets/js/holeTable.js`'s `render()`. No new files, no backend/Apps Script/auth changes, and desktop (> 640px) layout plus all existing behavior are preserved. There are no correctness properties for this feature (CSS reflow has no PBT-amenable pure functions — see design Testing Strategy), so there are no property-test sub-tasks; verification is static analysis, existing Node regression suites, and a documented manual procedure.

## Tasks

- [x] 1. Add `data-label` markup to the shared hole-table renderer
  - [x] 1.1 Add `data-label` attributes and hole-num class in `holeTable.js` `render()`
    - In `assets/js/holeTable.js`, edit only the `render()` template so each `<td>` gains a `data-label` (`Hole`, `Par`, `Score`, `Fairway`, `GIR`, `Putts`, `Penalty`) and the hole-number cell also gets `class="hole-num"`
    - Change nothing else: keep input classes (`.par`/`.score`/`.fairway`/`.fairway-na`/`.gir`/`.putts`/`.penalty`), values, `required`/`disabled`, inline `width:4.5em`, and the Par-3 branch identical
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 1.2 Optional: assert render() markup contract in the Node harness
    - Only if it fits the existing dependency-free harness style: call `HoleTable.render()` with a minimal stub `tbody` (settable `innerHTML`, no-op `querySelectorAll`) and assert the output string contains `data-label="Par"`, `data-label="Score"`, …, `class="hole-num"`, and still contains `class="par"`, `class="score"`, etc.
    - Do NOT add jsdom/puppeteer or any DOM library to enable this
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Collapse paired form fields on mobile
  - [x] 2.1 Add the single-column `.field-row` rule inside the 640px breakpoint
    - In `assets/css/styles.css`, inside the existing `@media (max-width: 640px)` block, add `.field-row { grid-template-columns: 1fr; }`
    - Leave the desktop `.field-row` rule (outside the media query) untouched
    - _Requirements: 1.1, 1.2, 1.3, 8.1_

- [x] 3. Reflow the hole-by-hole table into stacked cards on mobile
  - [x] 3.1 Add the `.hole-table` reflow rules inside the 640px breakpoint
    - In `assets/css/styles.css`, inside the `@media (max-width: 640px)` block, add rules scoped to `.hole-table`: make `tbody`/`tr`/`td` `display:block`; hide `thead`; style each `tr` as a bordered card using `--card`/`--border`/`--radius`; make each `td` a flex label-left/value-right line with `::before { content: attr(data-label); }` and `white-space: normal`; style `td.hole-num` as a card heading; grow inputs/selects to `min-height:40px` and a wider `min-width` overriding the inline 4.5em
    - Ensure the reflowed hole table introduces no horizontal scrollbar (full-width blocks) and that `.table-scroll` is not globally hidden
    - Verify every new selector is rooted at `.hole-table` so the roster table, player-detail Rounds table, and public Recent Rounds table are unaffected
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.5, 8.1, 8.2_

- [x] 4. Checkpoint - hole table + forms reflow
  - Ensure the existing Node test suites still pass and the reflow selectors are correctly scoped; ask the user if questions arise.

- [x] 5. Verify and, if needed, adjust summary/stat grids
  - [x] 5.1 Confirm grid reflow at 390px; conditionally reduce summary-grid min
    - Inspect `.summary-grid` (`minmax(140px,1fr)`) and `.stat-grid` (`minmax(110px,1fr)`) at ~390px
    - Only if 140px causes overflow/cramping, add `.summary-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }` inside the 640px breakpoint; otherwise make no change
    - _Requirements: 4.1, 4.2, 4.3, 8.1_

- [x] 6. Fix button clusters, link boxes, and header spacing on mobile
  - [x] 6.1 Add audit-fix CSS inside the 640px breakpoint
    - In `assets/css/styles.css`, inside the `@media (max-width: 640px)` block, add rules so the player-detail right-aligned button clusters (Remove-from-Season / Delete-Player, Edit/Save/Cancel sex controls, Add Round) wrap or go full-width; let `.link-box input` shrink (`min-width:0`) and give `.link-box button` a ≥40px tap target; tighten `header.app-header` padding and title size so the logo+title fit
    - Prefer CSS selectors targeting existing inline `text-align:right` wrappers; only if a selector is too brittle, apply a minimal HTML class addition and document it
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2_

- [x] 7. Document and verify the public Recent Rounds decision
  - [x] 7.1 Confirm Recent Rounds remains readable via its scroll container
    - No code change expected; confirm `#recentRounds` (rendered by `player.js`) remains usable via its existing `.table-scroll` at ~390px and that the documented decision in design.md matches the observed behavior
    - _Requirements: 6.1, 6.2_

- [ ] 8. Regression and manual verification
  - [x] 8.1 Run existing Node test suites
    - Run the existing dependency-free suites (e.g. `node assets/js/admin-logic.test.js`, `node assets/js/roster-preservation.test.js`) and confirm they still pass, proving no logic was touched
    - _Requirements: 3.4, 7.3_

  - [~] 8.2 Perform the documented manual verification at ~390px and ~768px on both pages
    - Follow the design Testing Strategy manual checklist on `player.html` and `admin.html`: add round (hole-by-hole cards + Par-3 "—" + running total), totals mode grids, submit; admin add-player form + link box; player-detail button clusters + link box; edit round hole cards + save; confirm Roster and player-detail Rounds cards are unaffected; desktop (>640px) regression check
    - _Requirements: 2.1-2.8, 3.5, 4.1-4.3, 5.1-5.4, 6.2, 7.1, 7.2, 7.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- There are no property-based tests: this feature is CSS reflow + behavior-neutral markup with no PBT-amenable pure functions (see design Testing Strategy). Verification is static analysis + existing Node regression suites + a documented manual procedure; no jsdom/puppeteer is introduced.
- The preservation invariant is central: desktop (>640px) layout and all existing behavior (hole entry, `collect()`, par/fairway sync, running total, form submit, already-done roster/rounds cards) must remain unchanged.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "3.1", "6.1"] },
    { "id": 2, "tasks": ["5.1"] },
    { "id": 3, "tasks": ["7.1", "8.1"] },
    { "id": 4, "tasks": ["8.2"] }
  ]
}
```
