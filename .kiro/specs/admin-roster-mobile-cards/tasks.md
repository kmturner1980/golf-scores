# Implementation Plan

- [x] 1. Write bug condition exploration check (mobile horizontal-overflow)
  - **Property 1: Bug Condition** - Mobile Roster Fits Viewport As Collapsible Cards
  - **CRITICAL**: This check MUST FAIL / REPRODUCE on unfixed code — reproduction confirms the bug exists
  - **DO NOT attempt to fix the code when it reproduces**
  - **NOTE**: This encodes the expected behavior — it validates the fix when it passes after implementation
  - **GOAL**: Surface a concrete counterexample demonstrating horizontal overflow of the admin roster at a mobile viewport width
  - **UI/hard-to-automate caveat**: The project's Node harness (`assets/js/admin-logic.test.js`, `assets/js/admin-store.test.js`) has no DOM/jsdom and no browser runner, so the scrollWidth-vs-clientWidth invariant cannot be asserted automatically. Follow the documented manual reproduction below instead of forcing a brittle DOM test.
  - **Scoped reproduction (from Bug Condition in design)**: Open `admin.html`, go to Roster, set viewport to 390px (device emulation). In devtools, for a roster `.table-scroll` element assert `el.scrollWidth > el.clientWidth`.
  - The expected-behavior assertions this check encodes (must pass AFTER fix): at mobile width the roster has no horizontal overflow, each player is a collapsible card showing Name + Avg /18 + Rounds collapsed (status visible), expandable to reveal remaining stats, with a separate "View full details" action.
  - Run against the UNFIXED code
  - **EXPECTED OUTCOME**: Reproduces — `scrollWidth > clientWidth` at 390px and rightmost columns require horizontal scrolling (this is correct; it proves the bug exists)
  - Document counterexamples found (e.g. "Boys `.table-scroll` scrollWidth ~700px vs clientWidth 358px at 390px viewport; Status/Worse off-screen")
  - Mark task complete when the check is performed, run on unfixed code, and the failure/counterexample is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation checks (BEFORE implementing fix)
  - **Property 2: Preservation** - Desktop Table And Out-Of-Scope Tables Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe on UNFIXED code and record: at 1200px the roster shows all 11 sortable columns; clicking a header sorts and toggles the arrow; clicking a row opens `showPlayerDetail`; the admin player-detail "Rounds" table, public `player.html` "Recent Rounds" table, and Team Totals render without change; stat values are formatted via `Stats.fmt*`.
  - Capture these as: (a) documented manual desktop-width observations, and (b) any feasible pure-logic assertions in the Node harness for unchanged sort/aggregation/formatting helpers.
  - Property-based angle (pure logic, if a `rowToCardFields`-style helper is factored out): collapsed fields = {Name, Avg/18, Rounds}(+status) and expanded fields = the remaining stats; union equals the 11-column data with no omissions/duplicates; formatted card values equal formatted table-cell values.
  - Run checks/observations on the UNFIXED code
  - **EXPECTED OUTCOME**: PASS (confirms the baseline behavior to preserve)
  - Mark task complete when observations are recorded and any pure-logic assertions pass on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix admin Roster horizontal-overflow with responsive collapsible cards

  - [x] 3.1 Add mobile card layout to the roster renderer
    - In `assets/js/admin.js`, emit a per-player collapsible card layout alongside the existing table for each Boys/Girls/Sex Not Set group, using the same `rows` data and `Stats.fmt*` / `escapeHtml` helpers
    - Collapsed/header content: Name, Avg /18, Rounds count, and Active/Inactive status indicator (reuse `.pill` / `.muted`)
    - Expanded content: Avg Diff, Fairway %, GIR %, Putts /18, Birdies+, Doubles, Worse, full Status
    - Use a native `<details>`/`<summary>` (or accessible button with `aria-expanded`) for keyboard + screen-reader support and an adequate tap target
    - Add a distinct "View full details" control inside the expanded card carrying `data-token`, wired to `showPlayerDetail(token)`; ensure the header toggle does NOT navigate
    - _Bug_Condition: isBugCondition(input) — roster at mobile viewport width with horizontal overflow (from design)_
    - _Expected_Behavior: Property 1 correct behavior (from design)_
    - _Preservation: Preservation Requirements (from design)_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.2 Add the mobile breakpoint and card styles in CSS
    - In `assets/css/styles.css`, add the project's first `@media` breakpoint (proposed `max-width: 640px`) scoped to roster-specific selectors: show cards / hide the roster table below the breakpoint, and hide cards / show the table above it
    - Do NOT alter the generic `table`, `th`, `td`, or `.table-scroll` rules in a way that affects other tables; keep player-detail Rounds, public Recent Rounds, and Team Totals untouched
    - Source card colors/spacing from existing brand variables (`--navy`, `--muted`, `--border`, `--blue-gray`, `--card`, `--radius`); ensure full-width cards with no horizontal overflow
    - _Bug_Condition: isBugCondition(input) (from design)_
    - _Expected_Behavior: Property 1 — no horizontal overflow at mobile widths (from design)_
    - _Preservation: Preservation Requirements — out-of-scope tables unchanged (from design)_
    - _Requirements: 2.1, 2.3, 3.4_

  - [x] 3.3 Verify bug condition exploration check now passes
    - **Property 1: Expected Behavior** - Mobile Roster Fits Viewport As Collapsible Cards
    - **IMPORTANT**: Re-run the SAME manual check from task 1 — do NOT write a new one
    - At 390px: assert roster `.table-scroll`/card container `scrollWidth <= clientWidth` (no horizontal overflow), each player is a collapsible card (Name + Avg /18 + Rounds collapsed, status visible), expanding reveals remaining stats with no overflow, and "View full details" opens `showPlayerDetail`; grouping/headings preserved; toggle is keyboard-operable
    - **EXPECTED OUTCOME**: Passes (confirms the bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.4 Verify preservation checks still pass
    - **Property 2: Preservation** - Desktop Table And Out-Of-Scope Tables Unchanged
    - **IMPORTANT**: Re-run the SAME checks/observations from task 2 — do NOT write new ones
    - At 1200px: 11-column sortable table, header-click sorting with arrow toggle, row-click opens detail; player-detail Rounds, public Recent Rounds, and Team Totals unchanged at all widths; stat formatting unchanged
    - Confirm any pure-logic Node assertions still pass (no regressions)
    - **EXPECTED OUTCOME**: Pass (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all checks pass
  - Ensure the exploration check passes, all preservation checks pass, and the manual mobile + desktop procedures confirm the expected behavior. Ask the user if questions arise.
