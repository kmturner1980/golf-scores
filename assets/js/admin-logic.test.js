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
  var isValidYearLabel = AdminLogic.isValidYearLabel;
  var walkStepValidation = AdminLogic.walkStepValidation;
  var validateNewPlayerRow = AdminLogic.validateNewPlayerRow;
  var collectNewPlayers = AdminLogic.collectNewPlayers;
  var buildConfirmSummary = AdminLogic.buildConfirmSummary;
  var yearListRows = AdminLogic.yearListRows;

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

  // =========================================================================
  // ==== admin-year-management-nav ==========================================
  // =========================================================================

  // ---- Generators for label / walkthrough / new-player rows --------------
  // A pool of label-ish strings spanning the input space: blank, whitespace-
  // only (spaces/tabs/newlines), real labels, and real labels surrounded by
  // whitespace, so the trim-then-nonempty rule is exercised on the boundaries.
  var BLANK_LABELS = ['', ' ', '   ', '\t', '\n', '\t\n ', '  \r\n  '];
  var REAL_LABELS = ['2027-2028', 'x', 'Season A', '  2027-2028  ', '\t Spring \n', 'a', '0'];

  // Non-string / nullish label values that must all be treated as invalid.
  var NONSTRING_LABELS = [null, undefined];

  function genLabelValue() {
    var choice = randInt(0, 3);
    if (choice === 0) return pick(BLANK_LABELS);       // blank / whitespace-only -> invalid
    if (choice === 1) return pick(REAL_LABELS);        // has a non-whitespace char -> valid
    if (choice === 2) return pick(NONSTRING_LABELS);   // null/undefined -> invalid
    // A random string that MAY be blank or real (mix), built from spaces + chars.
    var chars = ' \t\nabcXYZ019';
    var len = randInt(0, 6);
    var s = '';
    for (var i = 0; i < len; i++) s += chars.charAt(randInt(0, chars.length - 1));
    return s;
  }

  // Reference: valid iff there is at least one non-whitespace character.
  function labelHasNonWhitespace(label) {
    if (label == null) return false;
    return /\S/.test(String(label));
  }

  var SEX_POOL = ['Boy', 'Girl', 'boy', 'girl', 'BOY', 'Other', '', null, undefined];
  var NEW_NAME_POOL = ['Alice', 'Bob', '  Charlie  ', '', '   ', '\tZoe\n', 'x', null, undefined, 42];

  function genNewPlayerRow() {
    // Occasionally emit a non-object row to exercise defensive handling.
    if (rand() < 0.08) return pick([null, undefined, 'nope', 7]);
    return { name: pick(NEW_NAME_POOL), sex: pick(SEX_POOL) };
  }

  function genNewPlayerRows() {
    var len = randInt(0, 7); // includes the empty-list boundary
    var rows = [];
    for (var i = 0; i < len; i++) rows.push(genNewPlayerRow());
    return rows;
  }

  // Reference validity for a single row, mirroring the plain-language contract.
  function refRowValid(row) {
    var r = row || {};
    var name = r.name == null ? '' : String(r.name).trim();
    var sex = (r.sex === 'Boy' || r.sex === 'Girl') ? r.sex : null;
    return name.length > 0 && sex !== null;
  }

  // A walkthrough model with a mix of label validity, arbitrary returning
  // tokens, and arbitrary new-player rows (steps 2 & 3 must be irrelevant to
  // canConfirm). Sometimes returningTokens/newPlayers are non-arrays.
  var TOKEN_POOL = ['T1', 'T2', 'T3', 'Tx', 'stale', 'T1'];

  function genReturningTokens() {
    var shape = randInt(0, 3);
    if (shape === 0) return [];
    if (shape === 1) return null;          // non-array -> treated as empty
    var len = randInt(0, 5);
    var arr = [];
    for (var i = 0; i < len; i++) arr.push(pick(TOKEN_POOL));
    return arr;
  }

  function genWalk() {
    return {
      step: randInt(1, 4),
      label: genLabelValue(),
      returningTokens: genReturningTokens(),
      newPlayers: rand() < 0.15 ? pick([null, undefined, 'x']) : genNewPlayerRows()
    };
  }

  // Player list whose Tokens overlap the TOKEN_POOL so some returning tokens
  // resolve to a Name and some are unknown; includes duplicate/edge names.
  function genPlayerLookup() {
    var candidates = ['T1', 'T2', 'T3', 'Tx'];
    var len = randInt(0, candidates.length);
    var players = [];
    var used = {};
    for (var i = 0; i < len; i++) {
      var tok;
      do { tok = pick(candidates); } while (used[tok]);
      used[tok] = true;
      players.push({ Token: tok, Name: pick(NAME_POOL) });
    }
    return players;
  }

  // ---- TASK 1.2 ----------------------------------------------------------
  // Feature: admin-year-management-nav, Property 3: Label validity ignores surrounding whitespace
  // Validates: Requirements 6.3
  test('Property 3: isValidYearLabel is true iff the trimmed label is non-empty', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var label = genLabelValue();
      var actual = isValidYearLabel(label);
      var expected = labelHasNonWhitespace(label);
      assertEqual(
        actual,
        expected,
        'label validity mismatch for label=' + JSON.stringify(label)
      );
    }
  });

  test('Property 3 boundary: blank / whitespace-only / nullish labels are invalid', function () {
    assertEqual(isValidYearLabel(''), false, 'empty string invalid');
    assertEqual(isValidYearLabel('   '), false, 'spaces-only invalid');
    assertEqual(isValidYearLabel('\t\n '), false, 'tabs/newlines-only invalid');
    assertEqual(isValidYearLabel(null), false, 'null invalid');
    assertEqual(isValidYearLabel(undefined), false, 'undefined invalid');
  });

  test('Property 3 boundary: any non-whitespace char (even surrounded by whitespace) is valid', function () {
    assertEqual(isValidYearLabel('x'), true, 'single char valid');
    assertEqual(isValidYearLabel('2027-2028'), true, 'a real label valid');
    assertEqual(isValidYearLabel('  x  '), true, 'char surrounded by whitespace valid');
    assertEqual(isValidYearLabel('\t Spring \n'), true, 'word surrounded by whitespace valid');
    assertEqual(isValidYearLabel('0'), true, 'the string "0" valid (non-whitespace)');
  });

  // ---- TASK 1.3 ----------------------------------------------------------
  // Feature: admin-year-management-nav, Property 4: Confirm is gated only by the label (steps 2 and 3 are skippable)
  // Validates: Requirements 6.3, 6.5, 6.7, 6.8
  test('Property 4: canConfirm === isValidYearLabel(label) regardless of returning/new-player contents', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var walk = genWalk();
      var v = walkStepValidation(walk);
      var labelValid = isValidYearLabel(walk.label);

      // Confirm is gated ONLY by the label; steps 2 & 3 contents are irrelevant.
      assertEqual(
        v.canConfirm,
        labelValid,
        'canConfirm must equal label validity for walk=' + JSON.stringify(walk)
      );
      // labelValid / step1Complete are consistent with the design's shape.
      assertEqual(v.labelValid, labelValid, 'labelValid must equal isValidYearLabel(label)');
      assertEqual(v.step1Complete, labelValid, 'step1Complete === labelValid');
    }
  });

  test('Property 4 boundary: valid label with no players -> canConfirm true (empty season allowed)', function () {
    var walk = { step: 4, label: '2027-2028', returningTokens: [], newPlayers: [] };
    assertEqual(walkStepValidation(walk).canConfirm, true, 'empty season with valid label confirms');
  });

  test('Property 4 boundary: invalid label with many players -> canConfirm false', function () {
    var walk = {
      step: 4,
      label: '   ',
      returningTokens: ['T1', 'T2'],
      newPlayers: [{ name: 'Alice', sex: 'Girl' }, { name: 'Bob', sex: 'Boy' }]
    };
    assertEqual(walkStepValidation(walk).canConfirm, false, 'blank label blocks confirm despite players');
  });

  // ---- TASK 1.4 ----------------------------------------------------------
  // Feature: admin-year-management-nav, Property 5: New-player collection drops blank rows and preserves order
  // Validates: Requirements 6.10
  test('Property 5: collectNewPlayers keeps exactly the valid rows, trimmed and in order', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var rows = genNewPlayerRows();
      var result = collectNewPlayers(rows);

      // Reference: filter to rows valid per validateNewPlayerRow, trimming names.
      var expected = rows
        .filter(function (r) { return validateNewPlayerRow(r).valid; })
        .map(function (r) {
          var v = validateNewPlayerRow(r);
          return { name: v.name, sex: v.sex };
        });

      // 1. Output equals filtering by validateNewPlayerRow(...).valid.
      assertEqual(
        JSON.stringify(result),
        JSON.stringify(expected),
        'collectNewPlayers must equal the valid-row filter for rows=' + JSON.stringify(rows)
      );

      // 2. Length equals the count of valid inputs.
      var validCount = rows.filter(refRowValid).length;
      assertEqual(result.length, validCount, 'output length must equal valid input count');

      // 3. Every output row has a non-empty trimmed name and a Boy/Girl sex.
      result.forEach(function (r) {
        assert(typeof r.name === 'string' && r.name.length > 0, 'output name must be non-empty: ' + JSON.stringify(r));
        assertEqual(r.name, r.name.trim(), 'output name must already be trimmed');
        assert(r.sex === 'Boy' || r.sex === 'Girl', 'output sex must be Boy/Girl: ' + JSON.stringify(r));
      });

      // 4. Order preserved relative to input: the sequence of valid trimmed
      //    names in the input matches the output name sequence.
      var expectedNames = rows
        .filter(refRowValid)
        .map(function (r) { return String(r.name).trim(); });
      var actualNames = result.map(function (r) { return r.name; });
      assertEqual(
        JSON.stringify(actualNames),
        JSON.stringify(expectedNames),
        'valid rows must preserve their relative order'
      );
    }
  });

  test('Property 5 boundary: non-array input yields an empty array', function () {
    assertEqual(JSON.stringify(collectNewPlayers(null)), '[]', 'null -> []');
    assertEqual(JSON.stringify(collectNewPlayers(undefined)), '[]', 'undefined -> []');
    assertEqual(JSON.stringify(collectNewPlayers('nope')), '[]', 'string -> []');
    assertEqual(JSON.stringify(collectNewPlayers([])), '[]', 'empty array -> []');
  });

  test('validateNewPlayerRow on boundary rows (trim, bad/missing sex, blank name)', function () {
    // Valid: trims the name, keeps Boy/Girl.
    var okBoy = validateNewPlayerRow({ name: '  Bob  ', sex: 'Boy' });
    assertEqual(okBoy.valid, true, 'trimmed name + Boy is valid');
    assertEqual(okBoy.name, 'Bob', 'name is trimmed');
    assertEqual(okBoy.sex, 'Boy', 'Boy preserved');
    var okGirl = validateNewPlayerRow({ name: 'Alice', sex: 'Girl' });
    assertEqual(okGirl.valid, true, 'name + Girl is valid');
    assertEqual(okGirl.sex, 'Girl', 'Girl preserved');

    // Invalid: blank / whitespace-only name.
    assertEqual(validateNewPlayerRow({ name: '', sex: 'Boy' }).valid, false, 'empty name invalid');
    assertEqual(validateNewPlayerRow({ name: '   ', sex: 'Girl' }).valid, false, 'whitespace name invalid');

    // Invalid: bad / missing / miscased sex normalizes to null.
    var badSex = validateNewPlayerRow({ name: 'Zoe', sex: 'boy' });
    assertEqual(badSex.valid, false, 'lowercase sex invalid');
    assertEqual(badSex.sex, null, 'bad sex normalizes to null');
    assertEqual(validateNewPlayerRow({ name: 'Zoe', sex: 'Other' }).valid, false, 'unknown sex invalid');
    assertEqual(validateNewPlayerRow({ name: 'Zoe' }).valid, false, 'missing sex invalid');
    assertEqual(validateNewPlayerRow({ name: 'Zoe' }).sex, null, 'missing sex -> null');

    // Defensive: a non-object row does not throw and is invalid.
    assertEqual(validateNewPlayerRow(null).valid, false, 'null row invalid');
    assertEqual(validateNewPlayerRow(undefined).valid, false, 'undefined row invalid');
  });

  // ---- TASK 1.5 ----------------------------------------------------------
  // Feature: admin-year-management-nav, Property 6: Confirm summary reflects the model faithfully
  // Validates: Requirements 6.9
  test('Property 6: buildConfirmSummary reflects label (trimmed), returning (in order, names resolved), and new players', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var walk = genWalk();
      var players = genPlayerLookup();
      var summary = buildConfirmSummary(walk, players);

      // Name lookup by token for the reference.
      var byToken = {};
      players.forEach(function (p) { if (p && p.Token != null) byToken[p.Token] = p.Name; });
      var tokens = Array.isArray(walk.returningTokens) ? walk.returningTokens : [];

      // 1. label is the trimmed label.
      var expectedLabel = walk.label == null ? '' : String(walk.label).trim();
      assertEqual(summary.label, expectedLabel, 'summary label must be the trimmed label');

      // 2. returning length === returningTokens length and order preserved.
      assertEqual(
        summary.returning.length,
        tokens.length,
        'returning length must equal the returningTokens length'
      );
      for (var j = 0; j < tokens.length; j++) {
        var tok = tokens[j];
        assertEqual(summary.returning[j].token, tok, 'returning token order must be preserved at index ' + j);
        // 3. Known tokens resolve to the right Name; unknown tokens give ''.
        var expectedName = byToken[tok] == null ? '' : byToken[tok];
        assertEqual(
          summary.returning[j].name,
          expectedName,
          'returning name must resolve from players (unknown -> "") for token=' + JSON.stringify(tok)
        );
      }

      // 4. newPlayers matches collectNewPlayers(walk.newPlayers).
      assertEqual(
        JSON.stringify(summary.newPlayers),
        JSON.stringify(collectNewPlayers(walk.newPlayers)),
        'summary.newPlayers must equal collectNewPlayers(walk.newPlayers)'
      );
    }
  });

  test('Property 6 boundary: empty returningTokens -> empty returning list', function () {
    var summary = buildConfirmSummary(
      { label: '2027', returningTokens: [], newPlayers: [] },
      [{ Token: 'T1', Name: 'Alice' }]
    );
    assertEqual(summary.returning.length, 0, 'no tokens -> empty returning');
    assertEqual(summary.label, '2027', 'label passes through trimmed');
  });

  test('Property 6 boundary: unknown token resolves to an empty name but is still included', function () {
    var summary = buildConfirmSummary(
      { label: '  2027  ', returningTokens: ['T1', 'ghost'], newPlayers: [] },
      [{ Token: 'T1', Name: 'Alice' }]
    );
    assertEqual(summary.label, '2027', 'label is trimmed');
    assertEqual(summary.returning.length, 2, 'both tokens included, order preserved');
    assertEqual(summary.returning[0].token, 'T1', 'first token preserved');
    assertEqual(summary.returning[0].name, 'Alice', 'known token resolves to its name');
    assertEqual(summary.returning[1].token, 'ghost', 'unknown token preserved');
    assertEqual(summary.returning[1].name, '', 'unknown token resolves to empty name');
  });

  test('Property 6 boundary: empty players list -> all returning names are empty', function () {
    var summary = buildConfirmSummary(
      { label: 'S', returningTokens: ['T1', 'T2'], newPlayers: [{ name: 'Bob', sex: 'Boy' }] },
      []
    );
    assertEqual(summary.returning.length, 2, 'tokens preserved with no player lookup');
    assertEqual(summary.returning[0].name, '', 'no players -> empty name');
    assertEqual(summary.returning[1].name, '', 'no players -> empty name');
    assertEqual(JSON.stringify(summary.newPlayers), JSON.stringify([{ name: 'Bob', sex: 'Boy' }]), 'new players collected');
  });

  // ---- TASK 1.6 ----------------------------------------------------------
  // Feature: admin-year-management-nav, Property 1: Season list is complete and newest-first
  // Validates: Requirements 4.1, 4.2
  test('Property 1: yearListRows preserves every YearID exactly once, newest-first by CreatedAt', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var years = genSeasonList(); // reused generator (varied CreatedAt incl. ties, IsCurrent encodings, empty)
      var rows = yearListRows(years, isCurrentYearRow);

      // 1. Output length === input length.
      assertEqual(rows.length, years.length, 'row count must equal season count');

      // 2. The multiset of YearIDs is preserved (no dupes, none dropped).
      var inputIds = years.map(function (y) { return y.YearID; }).slice().sort();
      var outputIds = rows.map(function (r) { return r.yearId; }).slice().sort();
      assertEqual(
        JSON.stringify(outputIds),
        JSON.stringify(inputIds),
        'YearID multiset must be preserved for years=' + JSON.stringify(years)
      );

      // 3. Sorted non-increasing by CreatedAt (newest-first).
      for (var j = 1; j < rows.length; j++) {
        var prev = years.find((function (id) { return function (y) { return y.YearID === id; }; })(rows[j - 1].yearId));
        var cur = years.find((function (id) { return function (y) { return y.YearID === id; }; })(rows[j].yearId));
        assert(
          new Date(prev.CreatedAt).getTime() >= new Date(cur.CreatedAt).getTime(),
          'rows must be ordered non-increasing by CreatedAt'
        );
      }

      // 4. Each row's label matches its season's Label.
      rows.forEach(function (r) {
        var y = years.find((function (id) { return function (yy) { return yy.YearID === id; }; })(r.yearId));
        assertEqual(r.label, y.Label, 'row label must match the season Label');
      });
    }
  });

  // Feature: admin-year-management-nav, Property 2: Make-current visibility is exactly the non-current seasons
  // Validates: Requirements 4.2, 4.4, 4.5, 5.3
  test('Property 2: each row isCurrent matches the predicate and canMakeCurrent === !isCurrent', function () {
    for (var i = 0; i < PROP_ITERATIONS; i++) {
      var years = genSeasonList();
      var rows = yearListRows(years, isCurrentYearRow);

      rows.forEach(function (r) {
        var y = years.find((function (id) { return function (yy) { return yy.YearID === id; }; })(r.yearId));
        assertEqual(
          r.isCurrent,
          isCurrentYearRow(y),
          'row.isCurrent must match isCurrentYearRow(matchingYear) for ' + JSON.stringify(y)
        );
        assertEqual(
          r.canMakeCurrent,
          !r.isCurrent,
          'canMakeCurrent must be exactly the negation of isCurrent'
        );
      });
    }
  });

  test('Property 1/2 boundary: empty season list yields an empty array', function () {
    assertEqual(JSON.stringify(yearListRows([], isCurrentYearRow)), '[]', 'empty list -> []');
    assertEqual(JSON.stringify(yearListRows(null, isCurrentYearRow)), '[]', 'null -> []');
    assertEqual(JSON.stringify(yearListRows(undefined, isCurrentYearRow)), '[]', 'undefined -> []');
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
