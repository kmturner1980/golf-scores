// Dependency-free tests for the AdminLogic pure helpers.
//
// Runnable two ways, with NO new dependencies and NO build step:
//   * Node:    `node assets/js/admin-logic.test.js`
//   * Browser: load admin-logic.js then this file via <script> on a test page;
//              results are printed to the console.
//
// It hand-rolls its own generators, assertion helpers, and test runner. Each
// property test runs a minimum of 100 randomized iterations (PROP_ITERATIONS).
(function () {
  'use strict';

  // ---- Load the module under test (Node require, or window in the browser) --
  var AdminLogic;
  if (typeof require !== 'undefined') {
    AdminLogic = require('./admin-logic.js');
  } else if (typeof window !== 'undefined' && window.AdminLogic) {
    AdminLogic = window.AdminLogic;
  } else {
    throw new Error('AdminLogic module not available');
  }

  var isCurrentYearRow = AdminLogic.isCurrentYearRow;
  var resolveViewingYearId = AdminLogic.resolveViewingYearId;
  var existingPlayerCandidates = AdminLogic.existingPlayerCandidates;
  var importCandidatesFrom = AdminLogic.importCandidatesFrom;
  var roundCardFields = AdminLogic.roundCardFields;

  var PROP_ITERATIONS = 200; // >= 100 as required by the spec

  // ---- Tiny assertion + runner -------------------------------------------
  var passed = 0;
  var failed = 0;
  var failures = [];

  function assert(cond, message) {
    if (!cond) {
      throw new Error(message || 'assertion failed');
    }
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

  // ---- Hand-rolled PRNG + generator primitives ---------------------------
  // Seeded so a failure is reproducible from run to run. Mulberry32.
  var _seed = 0x9e3779b9;
  function rand() {
    _seed |= 0;
    _seed = (_seed + 0x6d2b79f5) | 0;
    var t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function randInt(minInclusive, maxInclusive) {
    return minInclusive + Math.floor(rand() * (maxInclusive - minInclusive + 1));
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  // ---- Season-list generator (shared by Property 1 and Property 2) -------
  // Produces arrays of { YearID, Label, CreatedAt, IsCurrent } with:
  //  * random YearIDs (unique within a list),
  //  * random CreatedAt timestamps INCLUDING ties (drawn from a small pool),
  //  * zero / one / many current rows, encoded as boolean true, "TRUE", "true",
  //  * plus the empty-list case.
  var CURRENT_TRUE_ENCODINGS = [true, 'TRUE', 'true'];
  var CURRENT_FALSE_ENCODINGS = [false, undefined, 'FALSE', 'no', 0, null];

  function genSeasonList() {
    var len = randInt(0, 6); // includes the empty-list case (len === 0)
    var list = [];
    var usedIds = {};
    // A small timestamp pool so ties are common.
    var tsPool = [
      1000, 1000, 2000, 2000, 3000, 5000, 8000, 8000
    ];
    for (var i = 0; i < len; i++) {
      var id;
      do {
        id = 'Y' + randInt(1, 40);
      } while (usedIds[id]);
      usedIds[id] = true;

      var isCurrentTrue = rand() < 0.4; // ~40% chance of being current-ish
      var row = {
        YearID: id,
        Label: 'Season ' + id,
        CreatedAt: new Date(pick(tsPool)).toISOString(),
        IsCurrent: isCurrentTrue ? pick(CURRENT_TRUE_ENCODINGS) : pick(CURRENT_FALSE_ENCODINGS)
      };
      list.push(row);
    }
    return list;
  }

  // ---- Stored-id generator -----------------------------------------------
  // null, an id drawn from the list, or a stale random id NOT in the list.
  function genStoredId(list) {
    var choice = randInt(0, 2);
    if (choice === 0) return null;
    if (choice === 1 && list.length) {
      return pick(list).YearID;
    }
    // Stale id: keep drawing until it is not present in the list.
    var stale;
    var present;
    do {
      stale = 'Y' + randInt(41, 200); // outside the list's id space (1..40)
      present = list.some(function (y) { return y.YearID === stale; });
    } while (present);
    return stale;
  }

  // Reference precedence: the plain-language chain from the design doc.
  function expectedResolution(list, storedId) {
    if (!list.length) return null;
    if (storedId && list.some(function (y) { return y.YearID === storedId; })) {
      return storedId;
    }
    var current = list.find(isCurrentYearRow);
    if (current) return current.YearID;
    var newest = list.slice().sort(function (a, b) {
      return new Date(b.CreatedAt) - new Date(a.CreatedAt);
    })[0];
    return newest ? newest.YearID : null;
  }

  // =========================================================================
  console.log('AdminLogic tests');
  console.log('----------------------------------------');

  // ---- TASK 1.2 ----------------------------------------------------------
  // Feature: admin-season-settings, Property 1: Season selection honors precedence
  // Validates: Requirements 3.2, 3.3, 3.4, 3.6
  test('Property 1: season selection honors the stored->current->newest->null precedence', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var list = genSeasonList();
      var storedId = genStoredId(list);
      var actual = resolveViewingYearId(list, storedId, isCurrentYearRow);
      var expected = expectedResolution(list, storedId);
      assertEqual(
        actual,
        expected,
        'precedence mismatch for years=' + JSON.stringify(list) + ' storedId=' + JSON.stringify(storedId)
      );

      // Spell out the individual precedence rules for extra safety.
      if (!list.length) {
        assertEqual(actual, null, 'empty list must resolve to null');
      } else if (storedId && list.some(function (y) { return y.YearID === storedId; })) {
        assertEqual(actual, storedId, 'a matching stored id must win');
      } else {
        var current = list.find(isCurrentYearRow);
        if (current) {
          assertEqual(actual, current.YearID, 'current season must win when no stored match');
        } else {
          // No stored match, no current: must be a newest-by-CreatedAt id.
          var maxTs = Math.max.apply(null, list.map(function (y) { return new Date(y.CreatedAt).getTime(); }));
          var resolvedRow = list.find(function (y) { return y.YearID === actual; });
          assert(!!resolvedRow, 'resolved id must be in the list');
          assertEqual(
            new Date(resolvedRow.CreatedAt).getTime(),
            maxTs,
            'resolved season must have the most recent CreatedAt when falling through to newest'
          );
        }
      }
    }
  });

  // ---- TASK 1.3 ----------------------------------------------------------
  // Feature: admin-season-settings, Property 2: Resolver result is always a valid loaded season id or null
  // Validates: Requirements 3.2, 3.3, 3.4, 3.6
  test('Property 2: resolver result is always a valid loaded season id, or null iff the list is empty', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var list = genSeasonList();
      var storedId = genStoredId(list);
      var result = resolveViewingYearId(list, storedId, isCurrentYearRow);

      if (list.length === 0) {
        assertEqual(result, null, 'empty list must return null');
      } else {
        assert(result !== null, 'non-empty list must not return null');
        var found = list.some(function (y) { return y.YearID === result; });
        assert(
          found,
          'resolver fabricated an id absent from the list: ' + JSON.stringify(result) +
            ' for years=' + JSON.stringify(list)
        );
      }
    }
  });

  // ---- Players + roster generators (Property 3) --------------------------
  // Player names deliberately include duplicates and edge values so the sort
  // and set-difference are exercised on tricky inputs.
  var NAME_POOL = [
    'Alice', 'alice', 'Bob', 'bob', 'Charlie', 'Zoe', 'zoe',
    'anna', 'Anna', '', '  ', 'Éowyn', '10', '2', 'Óscar'
  ];

  function genPlayers() {
    var len = randInt(0, 8);
    var players = [];
    var usedTokens = {};
    for (var i = 0; i < len; i++) {
      var token;
      do {
        token = 'T' + randInt(1, 60);
      } while (usedTokens[token]);
      usedTokens[token] = true;
      players.push({ Token: token, Name: pick(NAME_POOL) });
    }
    return players;
  }

  // Random subset of the players' tokens, including the all-rostered and
  // none-rostered boundaries, occasionally with a stale token that no player
  // owns (should be harmlessly ignored).
  function genRosterTokens(players) {
    var boundary = randInt(0, 4);
    if (boundary === 0) return []; // none rostered
    if (boundary === 1) return players.map(function (p) { return p.Token; }); // all rostered
    var tokens = [];
    players.forEach(function (p) {
      if (rand() < 0.5) tokens.push(p.Token);
    });
    if (boundary === 2) tokens.push('T' + randInt(61, 120)); // add a stale token
    // Randomly return a Set half the time to exercise both accepted shapes.
    return rand() < 0.5 ? tokens : new Set(tokens);
  }

  function rosterHas(rosterTokens, token) {
    if (rosterTokens instanceof Set) return rosterTokens.has(token);
    return rosterTokens.indexOf(token) !== -1;
  }

  // ---- TASK 1.4 ----------------------------------------------------------
  // Feature: admin-season-settings, Property 3: Add-existing candidates are exactly the non-rostered players, name-sorted
  // Validates: Requirements 6.1, 6.2, 6.3
  test('Property 3: add-existing candidates are exactly the non-rostered players, sorted ascending by Name', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var players = genPlayers();
      var rosterTokens = genRosterTokens(players);
      var result = existingPlayerCandidates(players, rosterTokens);

      // 1. No rostered token appears in the result.
      result.forEach(function (p) {
        assert(
          !rosterHas(rosterTokens, p.Token),
          'rostered token leaked into candidates: ' + JSON.stringify(p)
        );
      });

      // 2. Every non-rostered player is present exactly once (set equality by token).
      var expectedTokens = players
        .filter(function (p) { return !rosterHas(rosterTokens, p.Token); })
        .map(function (p) { return p.Token; })
        .sort();
      var actualTokens = result.map(function (p) { return p.Token; }).slice().sort();
      assertEqual(
        JSON.stringify(actualTokens),
        JSON.stringify(expectedTokens),
        'candidate token set differs from the non-rostered set'
      );

      // 3. Result is sorted ascending by Name (localeCompare, matching impl).
      for (var j = 1; j < result.length; j++) {
        assert(
          String(result[j - 1].Name).localeCompare(String(result[j].Name)) <= 0,
          'candidates are not name-sorted ascending: ' +
            JSON.stringify(result[j - 1].Name) + ' before ' + JSON.stringify(result[j].Name)
        );
      }

      // 4. Empty-result boundary: when every player is rostered, result is empty.
      var everyRostered = players.length > 0 && players.every(function (p) {
        return rosterHas(rosterTokens, p.Token);
      });
      if (everyRostered) {
        assertEqual(result.length, 0, 'all-rostered case must yield an empty candidate list');
      }
    }
  });

  // ---- PlayerYears + currentYearId generators (Property 4) ---------------
  // A pool of YearIDs so several years coexist; the chosen currentYearId is
  // drawn to include the boundaries: a year with roster rows, a year with none,
  // an id absent from playerYears entirely, and the empty-roster case.
  var YEAR_ID_POOL = ['Y1', 'Y2', 'Y3', 'Y4'];

  // Build PlayerYears rows ({ YearID, PlayerToken }) spanning several YearIDs.
  // Tokens are drawn from the players' tokens (so some rows match real players)
  // plus occasional stale tokens that no player owns (harmlessly ignored).
  function genPlayerYears(players) {
    var len = randInt(0, 12); // includes the empty roster-rows case (len === 0)
    var rows = [];
    for (var i = 0; i < len; i++) {
      var token;
      if (players.length && rand() < 0.8) {
        token = pick(players).Token;      // usually a real player's token
      } else {
        token = 'T' + randInt(61, 120);   // occasionally a stale token
      }
      rows.push({ YearID: pick(YEAR_ID_POOL), PlayerToken: token });
    }
    return rows;
  }

  // currentYearId generator: a year present in the pool (may or may not have
  // rows), plus a stale id absent from playerYears entirely (a boundary).
  function genCurrentYearId() {
    var choice = randInt(0, 3);
    if (choice === 3) return 'Y99'; // absent from the pool -> empty result
    return YEAR_ID_POOL[choice];
  }

  // ---- TASK 1.7 ----------------------------------------------------------
  // Feature: admin-season-settings, Property 4: Import candidates are exactly the previous-current roster, name-sorted
  // Validates: Requirements 4.2, 4.3, 4.8
  test('Property 4: import candidates are exactly the previous-current roster, sorted ascending by Name', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var players = genPlayers();
      var playerYears = genPlayerYears(players);
      var currentYearId = genCurrentYearId();
      var result = importCandidatesFrom(players, playerYears, currentYearId);

      // Reference roster: the set of player tokens rostered to currentYearId
      // (only tokens that belong to a real player count).
      var playerTokens = {};
      players.forEach(function (p) { playerTokens[p.Token] = true; });
      var rosteredTokens = {};
      playerYears.forEach(function (r) {
        if (r.YearID === currentYearId && playerTokens[r.PlayerToken]) {
          rosteredTokens[r.PlayerToken] = true;
        }
      });

      // 1. No player outside the currentYearId roster appears in the result.
      result.forEach(function (p) {
        assert(
          rosteredTokens[p.Token] === true,
          'non-rostered player leaked into import candidates: ' + JSON.stringify(p) +
            ' for currentYearId=' + JSON.stringify(currentYearId)
        );
      });

      // 2. Every rostered player is present exactly once (set equality by token).
      var expectedTokens = Object.keys(rosteredTokens).sort();
      var actualTokens = result.map(function (p) { return p.Token; }).slice().sort();
      assertEqual(
        JSON.stringify(actualTokens),
        JSON.stringify(expectedTokens),
        'import candidate token set differs from the currentYearId roster set'
      );

      // 3. Result is sorted ascending by Name (localeCompare, matching impl).
      for (var j = 1; j < result.length; j++) {
        assert(
          String(result[j - 1].Name).localeCompare(String(result[j].Name)) <= 0,
          'import candidates are not name-sorted ascending: ' +
            JSON.stringify(result[j - 1].Name) + ' before ' + JSON.stringify(result[j].Name)
        );
      }

      // 4. Empty-result boundaries: a currentYearId with no roster rows, and a
      //    currentYearId absent from playerYears, both yield an empty array.
      var hasRosterRows = playerYears.some(function (r) {
        return r.YearID === currentYearId && playerTokens[r.PlayerToken];
      });
      if (!hasRosterRows) {
        assertEqual(
          result.length,
          0,
          'currentYearId with no roster rows must yield an empty import candidate list'
        );
      }
    }
  });

  // Explicit empty-result boundary checks (independent of the randomized run).
  test('Property 4 boundary: empty result for a currentYearId with no roster rows', function () {
    var players = [{ Token: 'T1', Name: 'Alice' }, { Token: 'T2', Name: 'Bob' }];
    var playerYears = [
      { YearID: 'Y1', PlayerToken: 'T1' },
      { YearID: 'Y1', PlayerToken: 'T2' }
    ];
    // Y2 exists in no PlayerYears row -> empty roster for Y2.
    assertEqual(importCandidatesFrom(players, playerYears, 'Y2').length, 0, 'no rows -> empty');
  });

  test('Property 4 boundary: empty result for a currentYearId absent from playerYears', function () {
    var players = [{ Token: 'T1', Name: 'Alice' }];
    var playerYears = [{ YearID: 'Y1', PlayerToken: 'T1' }];
    assertEqual(importCandidatesFrom(players, playerYears, 'Y99').length, 0, 'absent id -> empty');
    // Empty inputs are treated as empty.
    assertEqual(importCandidatesFrom([], [], 'Y1').length, 0, 'empty players/playerYears -> empty');
  });

  // ---- TASK 1.5: unit / example tests ------------------------------------
  test('isCurrentYearRow accepts true, "TRUE", "true"', function () {
    assertEqual(isCurrentYearRow({ IsCurrent: true }), true, 'boolean true accepted');
    assertEqual(isCurrentYearRow({ IsCurrent: 'TRUE' }), true, '"TRUE" accepted');
    assertEqual(isCurrentYearRow({ IsCurrent: 'true' }), true, '"true" accepted');
  });

  test('isCurrentYearRow rejects false and undefined', function () {
    assertEqual(isCurrentYearRow({ IsCurrent: false }), false, 'false rejected');
    assertEqual(isCurrentYearRow({ IsCurrent: undefined }), false, 'undefined rejected');
    assertEqual(isCurrentYearRow({}), false, 'missing IsCurrent rejected');
    assertEqual(isCurrentYearRow(null), false, 'null row rejected');
    assertEqual(isCurrentYearRow(undefined), false, 'undefined row rejected');
  });

  // Trimmed-empty label detection (drives Req 4.4). This mirrors the create
  // handler's guard: a label with only whitespace is treated as empty after
  // trimming. Tested as the small trim-then-empty check the UI will apply.
  function isEmptyLabel(label) {
    return String(label == null ? '' : label).trim().length === 0;
  }

  test('trimmed-empty label detection treats whitespace-only labels as empty (Req 4.4)', function () {
    assertEqual(isEmptyLabel('   '), true, 'spaces-only is empty');
    assertEqual(isEmptyLabel(''), true, 'empty string is empty');
    assertEqual(isEmptyLabel('\t\n '), true, 'tabs/newlines-only is empty');
    assertEqual(isEmptyLabel(null), true, 'null is empty');
    assertEqual(isEmptyLabel(undefined), true, 'undefined is empty');
    assertEqual(isEmptyLabel('2027-2028'), false, 'a real label is not empty');
    assertEqual(isEmptyLabel('  x  '), false, 'a label with surrounding whitespace is not empty');
  });

  // =========================================================================
  // ---- TASK 3.3: roundCardFields (admin-player-fullscreen-view) -----------
  // The expected table-column order and labels, in one place.
  var ROUND_LABELS = ['Date', 'Course', 'Tees', 'Holes', 'Score', 'Diff', 'Putts'];

  // Reference mapper: the plain-language contract from the design doc.
  // Seven labeled pairs in table-column order; Score/Putts map null -> '—';
  // every other field passes through verbatim.
  function expectedRoundFields(row) {
    var r = row || {};
    var dash = '—';
    return [
      { label: 'Date', value: r.date },
      { label: 'Course', value: r.course },
      { label: 'Tees', value: r.tees },
      { label: 'Holes', value: r.holesPlayed },
      { label: 'Score', value: r.score == null ? dash : r.score },
      { label: 'Diff', value: r.diff },
      { label: 'Putts', value: r.putts == null ? dash : r.putts }
    ];
  }

  // ---- Example / unit tests ----------------------------------------------
  test('roundCardFields returns the 7 table-column labels in order with passthrough values', function () {
    var row = {
      date: '2024-05-01',
      course: 'Pebble Beach',
      tees: 'Blue',
      holesPlayed: 18,
      score: 82,
      diff: '+9.4',
      putts: 31
    };
    var fields = roundCardFields(row);
    assertEqual(fields.length, 7, 'must return exactly 7 pairs');
    for (var i = 0; i < ROUND_LABELS.length; i++) {
      assertEqual(fields[i].label, ROUND_LABELS[i], 'label at index ' + i + ' must be ' + ROUND_LABELS[i]);
    }
    assertEqual(fields[0].value, '2024-05-01', 'Date passes through');
    assertEqual(fields[1].value, 'Pebble Beach', 'Course passes through');
    assertEqual(fields[2].value, 'Blue', 'Tees passes through');
    assertEqual(fields[3].value, 18, 'Holes passes through');
    assertEqual(fields[4].value, 82, 'Score passes through');
    assertEqual(fields[5].value, '+9.4', 'Diff passes through');
    assertEqual(fields[6].value, 31, 'Putts passes through');
  });

  test('roundCardFields maps null Score and null Putts to the em-dash', function () {
    var fields = roundCardFields({
      date: 'Apr 3',
      course: 'Local',
      tees: 'White',
      holesPlayed: 9,
      score: null,
      diff: '—',
      putts: null
    });
    assertEqual(fields[4].value, '—', 'null Score -> em-dash');
    assertEqual(fields[6].value, '—', 'null Putts -> em-dash');
  });

  test('roundCardFields keeps a 0 Score and 0 Putts (only null becomes the em-dash)', function () {
    var fields = roundCardFields({
      date: 'Apr 3',
      course: 'Local',
      tees: 'White',
      holesPlayed: 9,
      score: 0,
      diff: '0.0',
      putts: 0
    });
    assertEqual(fields[4].value, 0, '0 Score is preserved, not turned into em-dash');
    assertEqual(fields[6].value, 0, '0 Putts is preserved, not turned into em-dash');
  });

  test('roundCardFields passes non-Score/Putts fields through verbatim, including badge HTML in date', function () {
    var badgeDate = 'May 1 <span class="badge badge-tournament">T</span>';
    var fields = roundCardFields({
      date: badgeDate,
      course: 'Augusta & <b>National</b>',
      tees: 'Championship',
      holesPlayed: 18,
      score: 74,
      diff: '−1.2',
      putts: 28
    });
    // The mapper does NOT strip or escape badge/HTML content in date.
    assertEqual(fields[0].value, badgeDate, 'date (with badge HTML) is passed through unaltered');
    assertEqual(fields[1].value, 'Augusta & <b>National</b>', 'course HTML entities/tags are untouched');
    assertEqual(fields[2].value, 'Championship', 'tees passes through');
    assertEqual(fields[3].value, 18, 'holes passes through');
    assertEqual(fields[5].value, '−1.2', 'diff (preformatted) passes through');
  });

  // ---- Round-row generator (Property 1) ----------------------------------
  // Generates rows across the input space: score/putts as null OR a number
  // (including 0), varied date strings (some with badge HTML), and free-form
  // course/tees/diff strings, so the layout-independence invariant is exercised
  // on the boundaries that matter (null vs 0 vs positive).
  var DATE_POOL = [
    'Apr 3', 'May 1', '2024-05-01',
    'May 1 <span class="badge badge-tournament">T</span>',
    'Jul 4 <span class="badge badge-summary">S</span>',
    ''
  ];
  var COURSE_POOL = ['Pebble Beach', 'Local', 'Augusta & <b>National</b>', '', 'St. Andrews'];
  var TEES_POOL = ['Blue', 'White', 'Red', 'Championship', ''];
  var DIFF_POOL = ['+9.4', '0.0', '−1.2', '—', ''];

  // A score/putts value: null ~1/3 of the time, else a number that can be 0.
  function genScoreLike() {
    if (rand() < 0.34) return null;
    return randInt(0, 120);
  }

  function genRoundRow() {
    return {
      date: pick(DATE_POOL),
      course: pick(COURSE_POOL),
      tees: pick(TEES_POOL),
      holesPlayed: pick([9, 18, 0]),
      score: genScoreLike(),
      diff: pick(DIFF_POOL),
      putts: genScoreLike()
    };
  }

  function fieldsEqual(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i].label !== b[i].label) return false;
      if (a[i].value !== b[i].value) return false;
    }
    return true;
  }

  // Feature: admin-player-fullscreen-view, Property 1: Round display values are layout-independent
  // Validates: Requirements 5.4
  test('Property 1: round display values are layout-independent (card source equals table values)', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var row = genRoundRow();
      var actual = roundCardFields(row);
      var expected = expectedRoundFields(row);

      // Same seven labeled values the desktop table shows, in column order.
      assert(
        fieldsEqual(actual, expected),
        'card fields differ from the expected table values for row=' + JSON.stringify(row) +
          ' -> got ' + JSON.stringify(actual)
      );

      // Spell out the invariant's key pieces for extra safety.
      assertEqual(actual.length, 7, 'must always return exactly 7 pairs');
      for (var j = 0; j < ROUND_LABELS.length; j++) {
        assertEqual(actual[j].label, ROUND_LABELS[j], 'label order must be stable at index ' + j);
      }
      // Score/Putts -> '—' iff null; otherwise the raw value passes through.
      assertEqual(
        actual[4].value,
        row.score == null ? '—' : row.score,
        'Score cell must be em-dash iff null, else passthrough'
      );
      assertEqual(
        actual[6].value,
        row.putts == null ? '—' : row.putts,
        'Putts cell must be em-dash iff null, else passthrough'
      );
      // Non-Score/Putts fields are verbatim passthrough (layout-independent).
      assertEqual(actual[0].value, row.date, 'Date passthrough');
      assertEqual(actual[1].value, row.course, 'Course passthrough');
      assertEqual(actual[2].value, row.tees, 'Tees passthrough');
      assertEqual(actual[3].value, row.holesPlayed, 'Holes passthrough');
      assertEqual(actual[5].value, row.diff, 'Diff passthrough');
    }
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
