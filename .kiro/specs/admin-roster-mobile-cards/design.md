# Admin Roster Mobile Cards Bugfix Design

## Overview

The admin Roster is rendered by `rosterTableHtml(rows)` inside `renderRoster()` in
`assets/js/admin.js` as an 11-column HTML table, wrapped per group in
`<div class="table-scroll">` (the container `#rosterTable` in `admin.html`). In
`assets/css/styles.css`, `table { width:100% }`, `th,td { white-space:nowrap }`, and
`.table-scroll { overflow-x:auto }` combine so that eleven no-wrap columns exceed a
phone's width and the container scrolls horizontally.

The fix keeps the desktop experience byte-for-byte identical and adds a responsive
mobile presentation for the admin Roster only. The chosen strategy renders the same
per-player data in two coexisting layouts within each group, toggled by a single CSS
`@media` breakpoint — the project's first:

- **Table layout** (existing markup) is shown at wide widths and hidden below the
  breakpoint.
- **Card layout** (new markup) is a collapsible card per player, hidden at wide widths
  and shown below the breakpoint. Collapsed it shows Name + Avg /18 + Rounds (plus the
  always-visible status indicator); expanded it reveals the remaining stats and a
  distinct "View full details" action.

Because both layouts are emitted from the same `rows` data and the same `Stats.fmt*`
helpers, no formatting or aggregation logic changes. Visibility is controlled purely by
CSS media queries, so there is no viewport-detection JavaScript to keep in sync.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — the admin Roster is
  viewed at a mobile viewport width where the rendered roster content is wider than the
  viewport, forcing horizontal scrolling inside `.table-scroll`.
- **Property (P)**: The desired behavior for buggy inputs — at mobile widths the roster
  fits the viewport with no horizontal overflow, presented as collapsible per-player
  cards (Name + Avg /18 + Rounds collapsed; all stats + "View full details" expanded).
- **Preservation**: Existing desktop table behavior (sortable headers, click-row-to-open
  detail, all 11 columns) and all out-of-scope tables (admin player-detail "Rounds",
  public `player.html` "Recent Rounds", Team Totals) that must remain unchanged.
- **rosterTableHtml(rows)**: Function in `assets/js/admin.js` (~lines 413-437) that
  builds the roster `<table>` markup for a group of rows.
- **renderRoster()**: Function in `assets/js/admin.js` (~lines 439-489) that computes
  per-player rows, splits them into Boys/Girls/Sex Not Set groups, injects markup into
  `#rosterTable`, and wires sort-header and row-click listeners.
- **ROSTER_COLUMNS**: Column definitions (~lines 382-395) — key, label, and sort `value`
  accessor for each of the 11 columns.
- **showPlayerDetail(token)**: Function in `assets/js/admin.js` (~line 490+) that opens
  the full player detail view; the target of both the desktop row click and the new
  mobile "View full details" action.
- **.table-scroll**: CSS class (`overflow-x:auto`) wrapping each group's table; the
  element whose horizontal overflow is the observable defect.
- **mobile breakpoint**: A `max-width` media query (proposed `640px`) below which the
  card layout is shown and the table layout hidden.

## Bug Details

### Bug Condition

The bug manifests when the admin Roster is rendered at a mobile viewport width. The
roster's eleven `white-space:nowrap` columns produce a table wider than the viewport,
and its `.table-scroll` wrapper (`overflow-x:auto`) exposes that overflow as a
horizontal scrollbar. The defect is a layout property: the rendered roster content is
wider than the container/viewport.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input = { viewportWidth, rosterContainer }
         where rosterContainer is the rendered admin roster (#rosterTable subtree)
  OUTPUT: boolean

  RETURN input.viewportWidth <= MOBILE_BREAKPOINT   // e.g. 640px
         AND horizontalOverflow(input.rosterContainer)
         // horizontalOverflow == any roster group's scrollWidth > its clientWidth
END FUNCTION
```

### Examples

- On a 390px-wide phone viewport, the Boys group table renders ~700px+ wide; the
  `.table-scroll` wrapper shows a horizontal scrollbar and the "Status" / "Worse"
  columns are off-screen until the user scrolls right. (defect)
- On a 375px viewport, to read a player's "Putts /18" the user must scroll the roster
  horizontally past Name/Rounds/Avg/Diff/Fairway/GIR. (defect)
- On a 1200px desktop viewport, all 11 columns fit; no horizontal scroll occurs. (not a
  bug — must be preserved)
- Edge: a group with a single player still overflows on mobile because column widths,
  not row count, drive the overflow. (defect)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Desktop/wide roster renders the current 11-column sortable table exactly as today.
- Clicking a column header at desktop width sorts by that column and toggles direction.
- Clicking a roster row at desktop width opens `showPlayerDetail(token)`.
- The admin player-detail "Rounds" table renders unchanged at all widths.
- The public `player.html` "Recent Rounds" table renders unchanged at all widths.
- Team Totals render unchanged at all widths.
- All stat values continue to be formatted with `Stats.fmt*` and player text escaped
  with `escapeHtml`.
- Boys / Girls / Sex Not Set grouping and per-group headings remain (both layouts).

**Scope:**
All inputs that do NOT satisfy the bug condition must be completely unaffected. This
includes:
- The roster at desktop/wide viewport widths (above the breakpoint).
- Every other table in the app (player detail Rounds, public Recent Rounds, Team Totals).
- Sorting, row-click navigation, and data aggregation/formatting logic.

**Note:** The expected correct behavior for buggy inputs is defined in the Correctness
Properties section (Property 1); this section enumerates what must NOT change.

## Hypothesized Root Cause

The root cause is confirmed by reading the code, not merely hypothesized:

1. **Fixed-count wide table with no-wrap columns**: `rosterTableHtml()` always emits an
   11-column `<table>`; `th,td { white-space:nowrap }` prevents columns from wrapping,
   so the table's intrinsic width exceeds a phone viewport.

2. **Overflow surfaced by `.table-scroll`**: Each group is wrapped in
   `<div class="table-scroll">` with `overflow-x:auto`, which turns the intrinsic
   overflow into a horizontal scrollbar rather than reflowing the content.

3. **No responsive rules exist**: `styles.css` contains no `@media` breakpoints at all,
   so the layout is identical across every viewport width. There is currently no
   mechanism to present the roster differently on small screens.

The fix targets (1)–(3) by adding an alternate card layout and a media query that
switches presentation below the breakpoint, without altering the data path.

## Correctness Properties

Property 1: Bug Condition - Mobile Roster Fits Viewport As Collapsible Cards

_For any_ input where the bug condition holds (isBugCondition returns true — the admin
roster viewed at a mobile viewport width), the fixed roster SHALL render with no
horizontal overflow (each roster group's scrollWidth does not exceed its clientWidth)
and SHALL present each player as a collapsible card that is collapsed by default showing
Name + Scoring Avg /18 + Rounds count with a visible Active/Inactive status indicator,
expandable in place (via tap or keyboard, exposing `aria-expanded` / native
`<details>` state) to reveal Avg Diff, Fairway %, GIR %, Putts /18, Birdies+, Doubles,
Worse, and full Status, plus a distinct "View full details" action that invokes
`showPlayerDetail(token)`. Boys / Girls / Sex Not Set grouping and headings are
preserved.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation - Desktop Table And Out-Of-Scope Tables Unchanged

_For any_ input where the bug condition does NOT hold (isBugCondition returns false — the
roster at desktop/wide widths, and any other table at any width), the fixed code SHALL
produce the same result as the original code: the desktop roster keeps all 11 sortable
columns, header-click sorting with direction toggling, and click-row-to-open-detail
behavior; and the admin player-detail "Rounds" table, public `player.html` "Recent
Rounds" table, and Team Totals are byte-for-byte unchanged. Stat formatting
(`Stats.fmt*`) and text escaping (`escapeHtml`) are unchanged.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming the confirmed root-cause analysis:

**File**: `assets/js/admin.js`

**Function**: `rosterTableHtml(rows)` and `renderRoster()`

**Specific Changes**:
1. **Emit a card layout alongside the table**: Add a `rosterCardsHtml(rows)` helper (or
   extend the group markup in `renderRoster()`) that, for each row, produces one
   collapsible card per player using the same `rows` data and `Stats.fmt*`/`escapeHtml`
   helpers already used by `rosterTableHtml()`.
   - Collapsed/header content: Name, Avg /18, Rounds count, and the Active/Inactive
     status indicator (reuse `.pill` / `.muted` markup).
   - Expanded content: Avg Diff, Fairway %, GIR %, Putts /18, Birdies+, Doubles, Worse,
     full Status — sourced from the same `agg` / `avgDiff` fields as the table cells.
   - Carry `data-token` for the "View full details" action.

2. **Accessible collapsible**: Implement each card with a native `<details>`/`<summary>`
   (preferred — keyboard + screen-reader support and toggle behavior come for free) OR a
   button header exposing `aria-expanded`. Ensure the header is a large tap target.

3. **Separate "View full details" action inside the expanded card**: A link/button with
   `data-token` that calls `showPlayerDetail(token)`. It must be a separate control from
   the header toggle so that expanding/collapsing does NOT navigate.

4. **Wire the new action without breaking existing handlers**: In `renderRoster()`, after
   injecting markup, attach a click handler to the mobile "View full details" controls
   that calls `showPlayerDetail(el.dataset.token)`. Keep the existing `th[data-sort-key]`
   and `tr[data-token]` listeners intact for the table layout. Ensure the summary/header
   toggle does not itself trigger `showPlayerDetail`.

5. **Preserve grouping**: Render both the table and the cards inside each existing
   Boys/Girls/Sex Not Set group block so headings and counts are unchanged.

**File**: `assets/css/styles.css`

**Specific Changes**:
6. **Add the first `@media` breakpoint** (proposed `@media (max-width: 640px)`):
   - Hide the roster `.table-scroll`/table layout and show the card layout below the
     breakpoint; do the inverse above it (cards hidden by default at wide widths). Scope
     these rules to roster-specific classes so no other table is affected.
   - Card styling sourced from existing brand variables: `--navy`, `--muted`, `--border`,
     `--blue-gray`, `--card`, `--radius`. Ensure cards are full-width with no horizontal
     overflow and comfortable tap targets on the header.
   - Reuse existing `.pill` / `.muted` styling for the status indicator.

7. **Do not modify** the generic `table`, `th`, `td`, or `.table-scroll` rules in a way
   that affects other tables; add roster-scoped classes/selectors instead so the
   player-detail Rounds table, public Recent Rounds table, and Team Totals are untouched.

**File**: `admin.html`

**Specific Changes**:
8. No structural change required to `#rosterTable` (it remains the container). Only the
   markup injected into it changes. Confirm no other consumer relies on the exact roster
   inner markup.

## Testing Strategy

### Validation Approach

This is a CSS/DOM-responsive bug. The project's test harness
(`assets/js/admin-logic.test.js`, `assets/js/admin-store.test.js`) is a dependency-free
Node harness with no DOM/jsdom and no browser runner, so the layout invariant
(scrollWidth vs clientWidth at a mobile width) cannot be asserted automatically here.
The strategy is therefore two-pronged: (a) a precise, documented **manual reproduction
and verification** procedure at a mobile viewport width for the layout/behavior
invariants, and (b) **pure-logic assertions** in the Node harness for any card-content
derivation that can be factored out without a DOM (e.g. a small function that maps a row
to its collapsed-summary fields and expanded-stat fields, verifying the correct fields
and `Stats.fmt*` formatting are chosen). Do not force a brittle automated DOM test where
none of the harness supports it.

### Exploratory Bug Condition Checking

**Goal**: Surface a concrete counterexample demonstrating the horizontal-overflow bug on
UNFIXED code before implementing the fix, and confirm the root cause.

**Test Plan**: Because no DOM harness exists, document and perform a manual reproduction
against the UNFIXED code, and capture the layout invariant precisely. If a factored-out
pure function for card content is introduced, add a Node assertion that (pre-fix) no such
mobile card structure is produced.

**Test Cases** (manual, on UNFIXED code):
1. **Phone-width overflow**: Load `admin.html`, open Roster, set viewport to 390px (or
   device emulation). Observe a horizontal scrollbar on a roster group and that Status/
   Worse columns are off-screen. (will reproduce on unfixed code)
2. **scrollWidth invariant**: In devtools console, for a roster `.table-scroll` element,
   assert `el.scrollWidth > el.clientWidth` at 390px. (true on unfixed code — confirms bug)
3. **Single-player group**: A group with one player still overflows at 390px. (reproduces)
4. **Desktop control**: At 1200px, `el.scrollWidth <= el.clientWidth` and no scrollbar.
   (not a bug — baseline to preserve)

**Expected Counterexamples**:
- `.table-scroll` shows `scrollWidth > clientWidth` at mobile widths; rightmost columns
  are only reachable by horizontal scrolling.
- Root cause confirmed: 11 no-wrap columns + `overflow-x:auto` + no `@media` rules.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed roster
produces the expected behavior (fits viewport, collapsible cards, separate detail action).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderRoster_fixed(input)   // observed at mobile viewport width
  ASSERT noHorizontalOverflow(result.rosterContainer)   // scrollWidth <= clientWidth
  ASSERT eachPlayerIsCollapsibleCard(result)
  ASSERT collapsedShows(result, [Name, Avg/18, Rounds]) AND statusVisible(result)
  ASSERT expandingRevealsRemainingStats(result) AND noOverflowWhenExpanded(result)
  ASSERT viewFullDetailsAction(result) invokes showPlayerDetail(token)
  ASSERT grouping(result) == [Boys, Girls, Sex Not Set]
  ASSERT toggleIsKeyboardOperable(result) AND ariaExpandedOrDetailsPresent(result)
END FOR
```

Verified via the manual mobile-width procedure above plus keyboard/screen-reader checks.

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed
roster behaves identically to the original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderRoster_original(input) == renderRoster_fixed(input)   // desktop widths
  ASSERT otherTables_original(input) == otherTables_fixed(input)     // any width
END FOR
```

**Testing Approach**: For desktop-width behavior, verification is manual (table renders,
sorting works, row-click opens detail) supplemented by any existing Node logic tests that
exercise sort/aggregation helpers unchanged. Other tables are verified unchanged by
inspection and existing tests.

**Test Plan**: Observe UNFIXED desktop behavior first, then confirm identical behavior
after the fix.

**Test Cases**:
1. **Desktop table preserved**: At 1200px, all 11 columns render; no cards visible.
2. **Sorting preserved**: Click "Avg /18" header; rows re-sort and arrow toggles.
3. **Row-click preserved**: Click a desktop row; `showPlayerDetail` opens that player.
4. **Out-of-scope tables preserved**: Player-detail Rounds, public Recent Rounds, and
   Team Totals unchanged at both mobile and desktop widths (no horizontal-scroll change).
5. **Formatting preserved**: Stat values identical (same `Stats.fmt*` output) in both
   layouts.

### Unit Tests

- If a pure `rowToCardFields(row)` (or similar) helper is introduced, add Node harness
  assertions that it selects the correct collapsed fields (Name, Avg /18, Rounds, status)
  and expanded fields (Avg Diff, Fairway %, GIR %, Putts /18, Birdies+, Doubles, Worse,
  Status) with correct `Stats.fmt*` formatting.
- Assert `escapeHtml` is applied to player Name in card output.

### Property-Based Tests

- For any generated set of roster rows, the collapsed-summary field set is exactly
  {Name, Avg/18, Rounds}(+status) and the expanded field set is exactly the remaining
  stats — i.e. the union of collapsed + expanded equals the 11-column data with no
  omissions or duplicates.
- For any row, formatted card values equal the formatted table-cell values (same helpers).

### Integration Tests

- Manual: full mobile flow — expand a card, verify all stats visible with no horizontal
  scroll, tap "View full details", confirm the correct player detail opens; collapse the
  card and confirm no navigation occurred from the toggle.
- Manual: switch between mobile and desktop widths (resize) and confirm the layout swaps
  cleanly and grouping/headings persist.
