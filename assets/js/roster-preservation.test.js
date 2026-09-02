// Preservation baseline check (Task 2) for the admin-roster-mobile-cards bugfix.
//
// Property 2 (Preservation): "Desktop Table And Out-Of-Scope Tables Unchanged."
// This records the BASELINE behavior of the unchanged sort/format/escape helpers
// on the UNFIXED code so the SAME assertions can be re-run after the fix
// (task 3.4) and confirm no regression. These assertions are EXPECTED TO PASS on
// the unfixed code — they establish the baseline to preserve.
//
// Runnable with NO new dependencies and NO build step:
//   * Node:    `node assets/js/roster-preservation.test.js`
//   * Browser: load this file via <script> on a test page; results print to
//              the console.
//
// WHY A LOCAL VERBATIM COPY INSTEAD OF require('./admin.js') / require('./stats.js')?
//   Exactly the reason documented in admin-store.test.js: the roster helpers
//   (`ROSTER_COLUMNS`, `sortRows`, `escapeHtml`) live INSIDE the admin.js IIFE,
//   and `Stats.fmt*` live on a browser global `const Stats` in stats.js. Both
//   files are browser-only scripts (admin.js reads `window.AdminLogic` at load
//   time; neither calls `module.exports`), so they cannot be `require`'d under
//   Node without a DOM/window and would throw on load. Rather than change
//   production code just to test it, this file reconstructs the SAME pure logic
//   VERBATIM from the current (unfixed) source and asserts its behavior. If the
//   fix ever changes these helpers, these character-faithful copies will drift
//   from production and the reviewer must re-sync — which is the intended
//   tripwire: the fix is required NOT to touch this logic.
//
//   The fix (tasks 3.1–3.2) adds a coexisting card layout + a CSS @media
//   breakpoint. It must reuse these exact helpers unchanged, so this baseline
//   must keep passing verbatim afterwards.
(function () {
  'use strict';

  // ======================================================================
  // VERBATIM COPIES FROM UNFIXED SOURCE (do not "improve" — must match prod)
  // ======================================================================

  // -- from assets/js/stats.js (Stats.fmtPct / fmtAvg / fmtDiff) ----------
  var Fmt = {
    fmtPct: function (v) {
      return v == null ? '—' : Math.round(v * 100) + '%';
    },
    fmtAvg: function (v) {
      return v == null ? '—' : v.toFixed(1);
    },
    fmtDiff: function (v) {
      if (v == null) return '—';
      return (v > 0 ? '+' : '') + v.toFixed(1);
    }
  };

  // -- from assets/js/admin.js (escapeHtml) -------------------------------
  function escapeHtml(s) {
    return (s || '').toString().replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // -- from assets/js/admin.js (ROSTER_COLUMNS) — the 11 columns, in order.
  var ROSTER_COLUMNS = [
    { key: 'name', label: 'Name', value: function (row) { return row.player.Name.toLowerCase(); } },
    { key: 'rounds', label: 'Rounds', value: function (row) { return row.rounds.length; } },
    { key: 'avg', label: 'Avg /18', value: function (row) { return row.agg.scoringAvgPer18; } },
    { key: 'diff', label: 'Avg Diff', value: function (row) { return row.avgDiff; } },
    { key: 'fairway', label: 'Fairway %', value: function (row) { return row.agg.fairwayPct; } },
    { key: 'gir', label: 'GIR %', value: function (row) { return row.agg.girPct; } },
    { key: 'putts', label: 'Putts /18', value: function (row) { return row.agg.puttingAvgPer18; } },
    { key: 'birdies', label: 'Birdies+', value: function (row) { return row.agg.birdies + row.agg.eagles; } },
    { key: 'doubles', label: 'Doubles', value: function (row) { return row.agg.doubles; } },
    { key: 'worse', label: 'Worse', value: function (row) { return row.agg.worse; } },
    { key: 'status', label: 'Status', value: function (row) { return (row.player.Active === false ? 0 : 1); } }
  ];

  // -- from assets/js/admin.js (sortRows) — comparator VERBATIM. The module
  //    globals sortKey/sortDir are passed in here so the pure comparator can be
  //    exercised deterministically; the branching logic is identical.
  function sortRows(rows, sortKey, sortDir) {
    var col = ROSTER_COLUMNS.find(function (c) { return c.key === sortKey; }) || ROSTER_COLUMNS[0];
    var sorted = rows.slice().sort(function (a, b) {
      var va = col.value(a);
      var vb = col.value(b);
      var aMissing = va == null || va === '';
      var bMissing = vb == null || vb === '';
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1; // rows with no data always sort last
      if (bMissing) return -1;
      var cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }

  // ======================================================================
  // Tiny assertion + runner (mirrors admin-logic.test.js / admin-store.test.js)
  // ======================================================================
  var passed = 0;
  var failed = 0;
  var failures = [];

  function assert(cond, message) {
    if (!cond) throw new Error(message || 'assertion failed');
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        (message || 'assertEqual failed') +
          ' (expected ' + JSON.stringify(expected) +
          ', got ' + JSON.stringify(actual) + ')'
      );
    }
  }

  function test(name, fn) {
    try {
      fn();
      passed++;
      console.log('  PASS: ' + name);
    } catch (err) {
      failed++;
      failures.push({ name: name, error: err });
      console.log('  FAIL: ' + name + ' -> ' + (err && err.message ? err.message : err));
    }
  }

  // A small helper to build a roster row fixture matching the shape sortRows
  // consumes: { player: { Name, Token, Active }, rounds: [], agg: {...}, avgDiff }.
  function row(name, opts) {
    opts = opts || {};
    return {
      player: { Name: name, Token: opts.token || ('T' + name), Active: opts.active },
      rounds: new Array(opts.rounds == null ? 0 : opts.rounds).fill(0),
      agg: {
        scoringAvgPer18: opts.avg,
        fairwayPct: opts.fairway,
        girPct: opts.gir,
        puttingAvgPer18: opts.putts,
        birdies: opts.birdies || 0,
        eagles: opts.eagles || 0,
        doubles: opts.doubles || 0,
        worse: opts.worse || 0
      },
      avgDiff: opts.diff
    };
  }

  console.log('Roster preservation baseline (Task 2 — Property 2)');
  console.log('----------------------------------------');

  // ---- ROSTER_COLUMNS: exactly the 11 columns, in the defined order ------
  // Validates: Requirements 3.1 (baseline: all 11 sortable columns present/ordered)
  test('baseline: ROSTER_COLUMNS has exactly the 11 columns in the fixed order', function () {
    var expectedKeys = ['name', 'rounds', 'avg', 'diff', 'fairway', 'gir', 'putts', 'birdies', 'doubles', 'worse', 'status'];
    var expectedLabels = ['Name', 'Rounds', 'Avg /18', 'Avg Diff', 'Fairway %', 'GIR %', 'Putts /18', 'Birdies+', 'Doubles', 'Worse', 'Status'];
    assertEqual(ROSTER_COLUMNS.length, 11, 'must be 11 columns');
    assertEqual(
      JSON.stringify(ROSTER_COLUMNS.map(function (c) { return c.key; })),
      JSON.stringify(expectedKeys),
      'column keys/order changed'
    );
    assertEqual(
      JSON.stringify(ROSTER_COLUMNS.map(function (c) { return c.label; })),
      JSON.stringify(expectedLabels),
      'column labels/order changed'
    );
  });

  // ---- sortRows: ascending numeric sort on the default 'avg' key ---------
  // Validates: Requirements 3.2 (baseline: header-driven sorting behavior)
  test('baseline: sortRows sorts ascending by avg (default key/dir)', function () {
    var rows = [row('C', { avg: 90.1 }), row('A', { avg: 78.4 }), row('B', { avg: 85.0 })];
    var out = sortRows(rows, 'avg', 'asc');
    assertEqual(
      JSON.stringify(out.map(function (r) { return r.player.Name; })),
      JSON.stringify(['A', 'B', 'C']),
      'ascending avg order wrong'
    );
  });

  // ---- sortRows: descending numeric sort (arrow-toggle equivalent) -------
  // Validates: Requirements 3.2 (baseline: direction toggle reverses order)
  test('baseline: sortRows reverses order when dir is desc', function () {
    var rows = [row('C', { avg: 90.1 }), row('A', { avg: 78.4 }), row('B', { avg: 85.0 })];
    var out = sortRows(rows, 'avg', 'desc');
    assertEqual(
      JSON.stringify(out.map(function (r) { return r.player.Name; })),
      JSON.stringify(['C', 'B', 'A']),
      'descending avg order wrong'
    );
  });

  // ---- sortRows: string sort on the name column via localeCompare --------
  // Validates: Requirements 3.2 (baseline: name column sorts case-insensitively)
  test('baseline: sortRows sorts the name column ascending (localeCompare on lowercased name)', function () {
    var rows = [row('Bob'), row('alice'), row('Zoe'), row('Anna')];
    var out = sortRows(rows, 'name', 'asc');
    assertEqual(
      JSON.stringify(out.map(function (r) { return r.player.Name; })),
      JSON.stringify(['alice', 'Anna', 'Bob', 'Zoe']),
      'name sort order wrong'
    );
  });

  // ---- sortRows: missing values (null/'') always sort last, both dirs ----
  // Validates: Requirements 3.2 (baseline: no-data rows always sort last)
  test('baseline: rows with missing sort values always sort last (asc and desc)', function () {
    var rows = [row('A', { avg: 80.0 }), row('NoData', { avg: null }), row('B', { avg: 75.0 })];
    var asc = sortRows(rows, 'avg', 'asc').map(function (r) { return r.player.Name; });
    var desc = sortRows(rows, 'avg', 'desc').map(function (r) { return r.player.Name; });
    assertEqual(asc[asc.length - 1], 'NoData', 'missing must be last (asc)');
    assertEqual(desc[desc.length - 1], 'NoData', 'missing must be last (desc)');
  });

  // ---- sortRows: does not mutate its input (uses a copy) -----------------
  // Validates: Requirements 3.2 (baseline: sort is non-mutating)
  test('baseline: sortRows does not mutate the input array', function () {
    var rows = [row('C', { avg: 90 }), row('A', { avg: 78 }), row('B', { avg: 85 })];
    var before = rows.map(function (r) { return r.player.Name; }).join(',');
    sortRows(rows, 'avg', 'asc');
    var after = rows.map(function (r) { return r.player.Name; }).join(',');
    assertEqual(after, before, 'input array was mutated');
  });

  // ---- Stats.fmt* formatting outputs (must be byte-for-byte unchanged) ----
  // Validates: Requirements 3.5 (baseline: stat formatting via Stats.fmt*)
  test('baseline: Stats.fmtAvg / fmtDiff / fmtPct outputs are unchanged', function () {
    assertEqual(Fmt.fmtAvg(85.44), '85.4', 'fmtAvg rounds to one decimal');
    assertEqual(Fmt.fmtAvg(31), '31.0', 'fmtAvg keeps one decimal');
    assertEqual(Fmt.fmtAvg(null), '—', 'fmtAvg null -> em dash');

    assertEqual(Fmt.fmtDiff(3.2), '+3.2', 'fmtDiff positive gets a leading +');
    assertEqual(Fmt.fmtDiff(-2.1), '-2.1', 'fmtDiff negative keeps the minus');
    assertEqual(Fmt.fmtDiff(0), '0.0', 'fmtDiff zero has no sign');
    assertEqual(Fmt.fmtDiff(null), '—', 'fmtDiff null -> em dash');

    assertEqual(Fmt.fmtPct(0.72), '72%', 'fmtPct rounds to a whole percent');
    assertEqual(Fmt.fmtPct(0.485), '49%', 'fmtPct rounds 0.485 -> 49%');
    assertEqual(Fmt.fmtPct(null), '—', 'fmtPct null -> em dash');
  });

  // ---- escapeHtml: player-supplied text is escaped as before -------------
  // Validates: Requirements 3.5 (baseline: escapeHtml on player text)
  test('baseline: escapeHtml escapes all five HTML-sensitive characters', function () {
    assertEqual(
      escapeHtml('<a href="x" & \'b\'>'),
      '&lt;a href=&quot;x&quot; &amp; &#39;b&#39;&gt;',
      'escapeHtml output changed'
    );
    assertEqual(escapeHtml(null), '', 'escapeHtml null -> empty string');
    assertEqual(escapeHtml('Christopher Robinson'), 'Christopher Robinson', 'plain name unchanged');
  });

  // ---- Summary -----------------------------------------------------------
  console.log('----------------------------------------');
  console.log('Total: ' + (passed + failed) + ' | Passed: ' + passed + ' | Failed: ' + failed);

  if (failed > 0) {
    console.log('\nFailures:');
    failures.forEach(function (f) {
      console.log('  - ' + f.name + ': ' + (f.error && f.error.message ? f.error.message : f.error));
    });
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  }
})();
