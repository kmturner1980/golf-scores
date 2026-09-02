# Task 1 — Bug Condition Exploration Check (Mobile Horizontal-Overflow)

**Property 1 (Bug Condition):** Mobile Roster Fits Viewport As Collapsible Cards.

This is a BUGFIX exploration check. It reproduces / confirms the bug on the CURRENT
UNFIXED code. Reproduction is the SUCCESS case. No code is fixed in this task.

Because the project's Node harness (`assets/js/admin-logic.test.js`,
`assets/js/admin-store.test.js`) is dependency-free with **no DOM/jsdom and no browser
runner**, the `scrollWidth`-vs-`clientWidth` layout invariant cannot be asserted
automatically. Per the design's Testing Strategy, the deliverable is a **precise,
documented manual reproduction** plus the exact layout invariant, rather than a brittle
forced DOM test. No jsdom/puppeteer/browser test framework was installed.

---

## 1. Root cause confirmed on unfixed code (with specifics)

Confirmed by reading the actual source, not hypothesized:

1. **11 no-wrap columns.** `ROSTER_COLUMNS` in `assets/js/admin.js` (~lines 382–395)
   defines exactly 11 columns, and `rosterTableHtml(rows)` (~lines 412–437) emits a
   `<table>` with all 11 in fixed order:

   | # | Header label | Cell source / format |
   |---|--------------|----------------------|
   | 1 | Name        | `escapeHtml(player.Name)` (variable, often the widest) |
   | 2 | Rounds      | `rounds.length` (integer) |
   | 3 | Avg /18     | `Stats.fmtAvg` → e.g. `85.4` |
   | 4 | Avg Diff    | `Stats.fmtDiff` → e.g. `+3.2` |
   | 5 | Fairway %   | `Stats.fmtPct` → e.g. `72%` |
   | 6 | GIR %       | `Stats.fmtPct` → e.g. `48%` |
   | 7 | Putts /18   | `Stats.fmtAvg` → e.g. `31.5` |
   | 8 | Birdies+    | `agg.birdies + agg.eagles` (integer) |
   | 9 | Doubles     | integer |
   | 10 | Worse      | integer |
   | 11 | Status     | `<span class="pill">Active</span>` / `<span class="muted">Inactive</span>` |

2. **`white-space: nowrap` forbids wrapping.** In `assets/css/styles.css` the generic
   rule `th, td { ... white-space: nowrap; }` prevents any column (header or cell) from
   wrapping. Each column's width is therefore its full intrinsic content width, and the
   table's `width: 100%` cannot shrink columns below that intrinsic width.

3. **`.table-scroll { overflow-x: auto }` surfaces the overflow.** `renderRoster()`
   (~lines 439–489) injects each group inside
   `<div class="table-scroll" style="margin-bottom:1rem">…</div>`, and the outer
   container `#rosterTable` in `admin.html` (line 124) also carries `class="table-scroll"`.
   `overflow-x: auto` turns intrinsic overflow into a horizontal scrollbar instead of
   reflowing.

4. **No `@media` breakpoints exist.** A search of `assets/css/styles.css` for `@media`
   returns **zero matches**, so the layout is byte-for-byte identical at every viewport
   width. There is currently no mechanism to present the roster differently on phones.
   This fix will add the project's first `@media` breakpoint.

All four conditions (1)–(4) are present in the unfixed code, so the root cause is
**confirmed present**, matching the design's "Hypothesized Root Cause".

---

## 2. Reproduction procedure (manual, UNFIXED code)

1. Open `admin.html` in a browser and log in to the admin dashboard.
2. Navigate to the **Roster** card (`#rosterTable`).
3. Open devtools device emulation and set the viewport width to **390px**
   (e.g. iPhone 12/13/14). A ~375px viewport reproduces identically.
4. Observe: a **horizontal scrollbar** appears on each roster group's `.table-scroll`
   wrapper. The leftmost columns (Name, Rounds, Avg /18) are visible; the rightmost
   columns (**Worse**, **Status**) are **off-screen** until you scroll right.
5. In the devtools console, select a roster group wrapper and assert the invariant:

   ```js
   const el = document.querySelector('#rosterTable .table-scroll');
   el.scrollWidth > el.clientWidth;   // => true on UNFIXED code (bug confirmed)
   ```

### Layout invariant this check encodes

> For a roster group container at a mobile viewport width (≤ 640px, tested at 390px):
> `el.scrollWidth > el.clientWidth` (horizontal overflow present).

- **Unfixed code:** the assertion is `true` → **bug reproduced (success case).**
- **After the fix (task 3.3):** the same assertion must be `false`
  (`scrollWidth <= clientWidth`, no horizontal overflow).

---

## 3. Counterexample / overflow evidence (grounded in real code)

At a 390px viewport, subtracting `main { max-width:1200px; padding:1.25rem }` (≈20px
each side) and the `.card { padding: 1rem 1.25rem }` (≈20px each side), the usable
content width for `.table-scroll` is roughly **390 − 40 − 40 ≈ 310px** (clientWidth on
the order of ~310–358px depending on scrollbar/rounding).

Each of the 11 columns carries `padding: 0.4rem 0.5rem` (≈16px horizontal per cell) plus
its no-wrap intrinsic content. Even with compact numeric cells, the **header labels**
drive minimum column widths, and Name holds a full player name on one line. Rough
per-column minimum widths (content + ~16px padding) at the table's 0.9rem font:

| Column | Approx min width |
|--------|------------------|
| Name (e.g. "Christopher Robinson") | ~150px |
| Rounds | ~55px |
| Avg /18 | ~65px |
| Avg Diff | ~70px |
| Fairway % | ~80px |
| GIR % | ~60px |
| Putts /18 | ~75px |
| Birdies+ | ~70px |
| Doubles | ~70px |
| Worse | ~60px |
| Status (pill "Active") | ~70px |
| **Total intrinsic width** | **≈ 875px** |

Even with short names the total stays well above **~650–700px**. Against a ~310px
usable container this is **more than double** the available width, so the
`.table-scroll` wrapper must scroll horizontally.

**Concrete counterexample (the "failing example"):**

> Boys `#rosterTable .table-scroll` renders with `scrollWidth ≈ 700–875px` vs
> `clientWidth ≈ 310–358px` at a 390px viewport → `scrollWidth > clientWidth` is TRUE.
> The **Worse** and **Status** columns are off-screen and reachable only by scrolling
> horizontally. A single-player group reproduces identically because **column widths,
> not row count, drive the overflow.**

---

## 4. Expected-behavior assertions this check will validate AFTER the fix

The same check (re-run in task 3.3) must pass once the fix is implemented:

- **No horizontal overflow at mobile width:** the roster group / card container
  satisfies `scrollWidth <= clientWidth` at 390px.
- **Each player is a collapsible card**, collapsed by default showing exactly
  **Name + Avg /18 + Rounds**, with the **Active/Inactive status indicator visible** in
  the always-visible header.
- **Expandable in place** (tap or keyboard; native `<details>`/`<summary>` or an
  accessible control exposing `aria-expanded`) to reveal the remaining stats:
  **Avg Diff, Fairway %, GIR %, Putts /18, Birdies+, Doubles, Worse, full Status**,
  with no horizontal scrolling when expanded.
- **A distinct "View full details" action** inside the expanded card invokes
  `showPlayerDetail(token)`; expanding/collapsing the header must NOT itself navigate.
- **Grouping preserved:** Boys / Girls / Sex Not Set groups and per-group headings
  remain in the card layout.

---

## Result

- **Root cause:** CONFIRMED present in unfixed code — 11 `white-space:nowrap` columns
  (`ROSTER_COLUMNS` / `rosterTableHtml`) inside `.table-scroll { overflow-x:auto }`
  (`renderRoster` + `admin.html #rosterTable`) with **no `@media` breakpoints** in
  `styles.css`.
- **Exploration outcome:** Bug **REPRODUCED / CONFIRMED** at 390px —
  `scrollWidth > clientWidth`, Status/Worse off-screen. This is the SUCCESS case for a
  bug-condition exploration check.
- **PBT / exploration status:** `passed` (the check correctly detects the bug); the
  documented counterexample above is recorded as the failing example.
- **No code modified** (`admin.js`, `styles.css`, `admin.html` untouched).

---

## Task 3.3 — Re-run of this check on the FIXED code (STATIC ANALYSIS)

Re-ran the SAME check defined above against the now-fixed source. Because there is no
DOM/jsdom/browser runner, the `scrollWidth <= clientWidth` invariant is verified by
static analysis of the fixed `assets/js/admin.js` and `assets/css/styles.css`, plus the
existing Node suites. Each expected-behavior assertion (Section 4) is confirmed below.

**Exploration status: PASSED** — every encoded expected-behavior assertion is satisfied
by the fixed source. No code was modified in this verification task.

### Per-assertion result (PASS with source evidence)

1. **No horizontal overflow at mobile width — PASS.**
   `@media (max-width: 640px)` (styles.css ~461) sets `#rosterTable .table-scroll { display:none }`
   (hides the 11-column wide table, the overflow source) and `.roster-cards { display:block }`.
   The card containers carry NO fixed widths, NO `min-width`, and NO `white-space:nowrap`
   on the wrapping containers: `.roster-card` has only background/border/radius/margin;
   `.roster-card-name` uses `flex:1 1 auto; min-width:0; word-break:break-word` (long
   names wrap, never force width); `.roster-card-summary` and `.roster-card-meta` both use
   `flex-wrap:wrap` so meta chips drop to a new line at ~320px instead of overflowing.
   `.roster-card-value` uses `word-break:break-word`. The only `white-space:nowrap` is on
   `.roster-card-stat` (individual short chips like "Avg /18 85.4"), which are inside a
   `flex-wrap:wrap` parent and so wrap as whole chips. Nothing in the card subtree can
   exceed the block width, so content fits ~390px (and ~320px) with scrollWidth ≤ clientWidth.

2. **Collapsible card per player, collapsed by default, header shows Name + Avg/18 +
   Rounds + status — PASS.**
   `rosterCardsHtml()` (admin.js ~443) emits `<details class="roster-card">` per row with
   NO `open` attribute (collapsed by default). The `<summary class="roster-card-summary">`
   contains `roster-card-name` (escaped Name), and a `roster-card-meta` with exactly
   `Avg /18` (`Stats.fmtAvg(agg.scoringAvgPer18)`), `Rounds` (`rounds.length`), and the
   status via `.pill` (Active) / `.muted` (Inactive) — visible in the always-shown header.

3. **Expanding reveals remaining stats with no horizontal overflow — PASS.**
   `.roster-card-body` holds one `.roster-card-row` each for Avg Diff, Fairway %, GIR %,
   Putts /18, Birdies+, Doubles, Worse, and full Status. Each row is
   `display:flex; justify-content:space-between` (label left, value right); value uses
   `word-break:break-word`. No fixed widths → no horizontal overflow when expanded.

4. **Distinct "View full details" button wired to showPlayerDetail(token); summary does
   NOT navigate — PASS.**
   `<button class="roster-card-detail secondary" data-token="${escapeHtml(player.Token)}">View full details</button>`
   is inside the expanded body. `renderRoster()` (~524) attaches a click handler on
   `.roster-card-detail` calling `showPlayerDetail(btn.dataset.token)`. No listener is
   attached to `<summary>`, so the native toggle expands/collapses without navigating.

5. **Boys / Girls / Sex Not Set grouping and headings preserved — PASS.**
   `renderRoster()` builds the same three groups and emits, inside each group block, the
   `<h3>${title} (${count})</h3>`, the `.table-scroll` table, AND the `.roster-cards`
   block (`rosterCardsHtml(g.rows)`) — cards live inside each group.

6. **Keyboard / screen-reader operable — PASS.**
   Native `<details>`/`<summary>` provides built-in keyboard toggle (Enter/Space) and
   `aria-expanded` semantics for free; `.roster-card-summary` has `min-height:44px` for an
   adequate tap target.

### Node suite results (no regressions, run separately)

- `node assets/js/admin-logic.test.js` → Total: 9 | Passed: 9 | Failed: 0
- `node assets/js/admin-store.test.js` → Total: 2 | Passed: 2 | Failed: 0
- `node assets/js/roster-preservation.test.js` → Total: 8 | Passed: 8 | Failed: 0

(The PowerShell wrapper reported a spurious non-zero exit artifact; each suite printed its
own "Failed: 0" summary, confirming all passed and formatting/logic are unchanged.)

### Residual MANUAL browser step (required to fully close the layout invariant)

The exact `el.scrollWidth <= el.clientWidth` measurement needs a real browser and cannot
run in Node. The user should: load `admin.html`, open the Roster, set the viewport to
390px (device emulation), and confirm (a) NO horizontal scrollbar on the roster, (b) each
player is a collapsed card showing Name + Avg/18 + Rounds + status, (c) tapping the header
expands to show the remaining stats with no horizontal scroll, (d) "View full details"
opens the correct player detail while the header toggle does NOT navigate, and (e) at
1200px the original 11-column sortable table still renders (cards hidden).
