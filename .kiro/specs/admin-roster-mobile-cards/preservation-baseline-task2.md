# Task 2 — Preservation Baseline (Desktop Table & Out-Of-Scope Tables Unchanged)

**Property 2 (Preservation):** _For any_ input where the bug condition does NOT hold
(the roster at desktop/wide widths, and any other table at any width), the fixed code
SHALL produce the same result as the original code.

This note RECORDS the current behavior of the UNFIXED code so it can be re-verified
identical after the fix (task 3.4). **Expected outcome for every item here: PASS on the
unfixed code** — this is the baseline to preserve, not a bug to reproduce.

**No production code was modified in this task.** `admin.js`, `assets/css/styles.css`,
and `admin.html` are untouched. The only new file is the pure-logic baseline check
`assets/js/roster-preservation.test.js` (a test, not shipped app code).

Verified at desktop/wide width (**1200px**) unless noted. Line references are to the
current (unfixed) `assets/js/admin.js`.

---

## A. Documented desktop-width observations (baseline to preserve)

### A1. All 11 roster columns render in the defined order — Req 3.1
`ROSTER_COLUMNS` (admin.js ~lines 382–395) defines exactly 11 columns, and
`rosterTableHtml(rows)` (~lines 413–437) emits `<thead>` headers + one `<td>` per column
in this fixed order:

| # | Header (`label`) | Sort `key` | Cell source / `Stats.fmt*` |
|---|------------------|-----------|-----------------------------|
| 1 | Name       | `name`    | `escapeHtml(player.Name)` |
| 2 | Rounds     | `rounds`  | `rounds.length` |
| 3 | Avg /18    | `avg`     | `Stats.fmtAvg(agg.scoringAvgPer18)` |
| 4 | Avg Diff   | `diff`    | `Stats.fmtDiff(avgDiff)` |
| 5 | Fairway %  | `fairway` | `Stats.fmtPct(agg.fairwayPct)` |
| 6 | GIR %      | `gir`     | `Stats.fmtPct(agg.girPct)` |
| 7 | Putts /18  | `putts`   | `Stats.fmtAvg(agg.puttingAvgPer18)` |
| 8 | Birdies+   | `birdies` | `agg.birdies + agg.eagles` |
| 9 | Doubles    | `doubles` | `agg.doubles` |
| 10 | Worse     | `worse`   | `agg.worse` |
| 11 | Status    | `status`  | `<span class="pill">Active</span>` or `<span class="muted">Inactive</span>` |

At 1200px the table fits with no horizontal scrollbar (baseline control; the mobile
overflow is out of scope for this preservation note). **Must remain: all 11 columns,
these labels, this order, these formatters.**

### A2. Clicking a column header sorts + toggles the ▲/▼ arrow — Req 3.2
Wiring in `renderRoster()` (~lines 468–477): each `th[data-sort-key]` gets a click
handler. Recorded baseline behavior:
- Clicking a header whose key differs from the current `sortKey` sets
  `sortKey = key` and `sortDir = 'asc'`.
- Clicking the already-active header flips `sortDir` between `'asc'` and `'desc'`.
- The active header shows a direction arrow: `' ▲'` when `asc`, `' ▼'` when `desc`
  (built in `rosterTableHtml` ~line 415); inactive headers show no arrow.
- Defaults on load: `sortKey = 'avg'`, `sortDir = 'asc'` (admin.js lines 100–101).
- Ordering comes from `sortRows()` (~lines 397–410): numeric columns compare by
  subtraction, the `name` column by `localeCompare` on the lowercased name, and rows
  whose value is `null`/`''` always sort last (both directions). Sort is non-mutating
  (`[...rows].sort(...)`).

**Must remain:** header click re-sorts, arrow toggles ▲/▼, missing-value rows last,
non-mutating.

### A3. Clicking a roster row opens `showPlayerDetail(token)` — Req 3.3
`renderRoster()` (~lines 478–480) attaches a click handler to each `tr[data-token]`
that calls `showPlayerDetail(tr.dataset.token)`. Each row carries
`data-token="${escapeHtml(player.Token)}"` (rosterTableHtml ~line 421). Clicking a row
opens that player's full detail view. **Must remain** for the desktop table layout.
(The fix adds a separate mobile "View full details" control; the header toggle must NOT
navigate — but that is task 3, not part of this baseline.)

### A4. Out-of-scope tables render unchanged at ALL widths — Req 3.4
These are outside the fix scope and must be byte-for-byte unchanged at every width:
- **Admin player-detail "Rounds" table** — `showPlayerDetail()` in admin.js
  (~lines 520+): a `<table>` with columns Date, Course, Tees, Holes, Score, Diff, Putts
  (+ action columns), wrapped like the other tables. No roster-specific selectors touch
  it.
- **Public `player.html` "Recent Rounds" table** — rendered by `assets/js/player.js`;
  entirely separate page, not reached by the roster fix.
- **Team Totals** — the `stat-tile` grid emitted near admin.js ~lines 360–374
  (`<h3>… Team Totals</h3>` + `.stat-grid`). Not a `<table>`, not roster-scoped.

The fix must add ONLY roster-scoped CSS/markup and its first `@media (max-width:640px)`
breakpoint; the generic `table`/`th`/`td`/`.table-scroll` rules and these three surfaces
must be unaffected. **Baseline: unchanged at both 1200px and 390px.**

### A5. Stat formatting via `Stats.fmt*`; player text via `escapeHtml` — Req 3.5
- `Stats.fmtPct` → `Math.round(v*100) + '%'`, `null → '—'` (stats.js ~line 217).
- `Stats.fmtAvg` → `v.toFixed(1)`, `null → '—'` (stats.js ~line 221).
- `Stats.fmtDiff` → `(v>0?'+':'') + v.toFixed(1)`, `null → '—'` (stats.js ~line 225).
- `escapeHtml` escapes `& < > " '` and coerces null/undefined to `''`
  (admin.js ~line 304).
Player Name and Token are passed through `escapeHtml` in the row markup.
**Must remain:** any card layout the fix adds must reuse these exact helpers, so
formatted card values equal formatted table-cell values.

---

## B. Pure-logic Node assertions added (feasible without a DOM)

**File:** `assets/js/roster-preservation.test.js` (new test file; dependency-free,
no jsdom, no browser runner — mirrors the existing `admin-logic.test.js` /
`admin-store.test.js` style).

**Why a verbatim reconstruction rather than `require('./admin.js')`:** identical to the
reason already documented in `admin-store.test.js` — `admin.js` and `stats.js` are
browser-only IIFEs/globals (admin.js reads `window.AdminLogic` at load and neither file
calls `module.exports`), so they throw if `require`'d under Node. Per the project's
established convention, the check reconstructs `ROSTER_COLUMNS`, `sortRows`, the
`Stats.fmt*` formatters, and `escapeHtml` **verbatim** from the current source and
asserts their behavior. No dependencies were added and no production code changed. These
copies act as a tripwire: the fix is required NOT to change this logic, so the copies
must keep matching after the fix.

Assertions (all pure, no DOM):
1. `ROSTER_COLUMNS` has exactly the 11 keys/labels in order (Req 3.1).
2. `sortRows` sorts ascending by `avg` with the default key/dir (Req 3.2).
3. `sortRows` reverses order when `dir === 'desc'` (arrow-toggle equivalent) (Req 3.2).
4. `sortRows` sorts the `name` column via `localeCompare` on the lowercased name (3.2).
5. Rows with missing (`null`/`''`) values always sort last, asc and desc (Req 3.2).
6. `sortRows` does not mutate its input array (Req 3.2).
7. `Stats.fmtAvg` / `fmtDiff` / `fmtPct` outputs are byte-for-byte unchanged (Req 3.5).
8. `escapeHtml` escapes all five HTML-sensitive characters and handles null (Req 3.5).

### Run result on UNFIXED code — PASS

```
$ node assets/js/roster-preservation.test.js
Roster preservation baseline (Task 2 — Property 2)
----------------------------------------
  PASS: baseline: ROSTER_COLUMNS has exactly the 11 columns in the fixed order
  PASS: baseline: sortRows sorts ascending by avg (default key/dir)
  PASS: baseline: sortRows reverses order when dir is desc
  PASS: baseline: sortRows sorts the name column ascending (localeCompare on lowercased name)
  PASS: baseline: rows with missing sort values always sort last (asc and desc)
  PASS: baseline: sortRows does not mutate the input array
  PASS: baseline: Stats.fmtAvg / fmtDiff / fmtPct outputs are unchanged
  PASS: baseline: escapeHtml escapes all five HTML-sensitive characters
----------------------------------------
Total: 8 | Passed: 8 | Failed: 0
```

The existing suites remain green as well (`node assets/js/admin-logic.test.js` → 9/9;
`node assets/js/admin-store.test.js` → 2/2), confirming no regression from adding this
file.

---

## C. What could NOT be asserted in pure logic (relies on manual observation)

The layout/interaction pieces need a DOM/browser and are covered by the documented
desktop-width observations in section A, not automated here (consistent with the
design's Testing Strategy — no DOM/jsdom/browser runner in this project):
- Header **click** re-render + arrow toggle (A2) — comparator logic is asserted (B3–B5),
  but the DOM click→`renderRoster()` re-render is observed manually.
- Row **click** → `showPlayerDetail(token)` (A3).
- Out-of-scope tables rendering unchanged at both widths (A4).

---

## Result

- **Baseline recorded:** desktop 11-column sortable table, header-click sort + ▲/▼
  toggle, row-click → `showPlayerDetail`, out-of-scope tables (player-detail Rounds,
  public Recent Rounds, Team Totals) unchanged at all widths, and `Stats.fmt*` /
  `escapeHtml` formatting.
- **Pure-logic assertions:** 8/8 **PASS** on the unfixed code
  (`assets/js/roster-preservation.test.js`).
- **Expected outcome met:** PASS (this establishes the baseline to preserve; re-run in
  task 3.4 to confirm no regression).
- **No production code modified** (`admin.js`, `styles.css`, `admin.html` untouched).
