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
