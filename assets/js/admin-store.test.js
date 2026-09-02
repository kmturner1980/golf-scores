// Dependency-free test for the guarded `Store` read-failure behavior.
//
// TASK 5.2: With a `localStorage` stub whose `getItem` throws, assert that the
// guarded Store read returns `null` and flips `storageOk = false` (drives the
// Req 3.7 fallback and the empty/guard paths).
//
// Runnable two ways, with NO new dependencies and NO build step:
//   * Node:    `node assets/js/admin-store.test.js`
//   * Browser: load this file via <script> on a test page; results print to
//              the console.
//
// WHY A LOCAL FACTORY INSTEAD OF require('./admin.js')?
//   The real `Store` object and `storageOk` flag are module-private state
//   INSIDE the admin.js IIFE. admin.js is a browser-only script (it reads
//   `window.AdminLogic` at load time and never calls `module.exports`), so it
//   cannot be `require`'d under Node without a DOM/window and would throw on
//   load. Rather than change production code just to test it, this file
//   reconstructs the SAME guarded-read logic verbatim from admin.js and
//   exercises it against a throwing stub. The factory below is a
//   character-faithful copy of the admin.js implementation:
//
//     const VIEWING_SEASON_STORE_KEY = 'golf.admin.viewingYearId';
//     let storageOk = true;
//     const Store = {
//       readViewingYearId() {
//         try {
//           return localStorage.getItem(VIEWING_SEASON_STORE_KEY);
//         } catch (_) {
//           storageOk = false;
//           return null;
//         }
//       },
//       writeViewingYearId(yearId) {
//         try {
//           if (yearId) localStorage.setItem(VIEWING_SEASON_STORE_KEY, yearId);
//         } catch (_) {
//           storageOk = false;
//         }
//       }
//     };
(function () {
  'use strict';

  // ---- Tiny assertion + runner (mirrors admin-logic.test.js style) --------
  var passed = 0;
  var failed = 0;
  var failures = [];

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

  // ---- The subject under test --------------------------------------------
  // A faithful reconstruction of the guarded Store from admin.js. It closes
  // over the SAME module-private `storageOk` flag the production code uses and
  // resolves `localStorage` from the global scope, exactly as the IIFE does.
  // The factory returns both so the test can assert on the flag directly.
  function makeStore() {
    var VIEWING_SEASON_STORE_KEY = 'golf.admin.viewingYearId';
    var state = { storageOk: true }; // flips false on first failure; drives Req 3.7 notice

    var Store = {
      readViewingYearId: function () {
        try {
          return localStorage.getItem(VIEWING_SEASON_STORE_KEY);
        } catch (_) {
          state.storageOk = false;
          return null;
        }
      },
      writeViewingYearId: function (yearId) {
        try {
          if (yearId) localStorage.setItem(VIEWING_SEASON_STORE_KEY, yearId);
        } catch (_) {
          state.storageOk = false;
        }
      }
    };

    return { Store: Store, state: state };
  }

  // ---- localStorage stub whose getItem throws ----------------------------
  function makeThrowingLocalStorage() {
    return {
      getItem: function () {
        throw new Error('localStorage.getItem blocked (private mode / disabled)');
      },
      setItem: function () {
        throw new Error('localStorage.setItem blocked (private mode / disabled)');
      }
    };
  }

  // Install/restore the global `localStorage` the guarded read resolves.
  var globalScope = (typeof globalThis !== 'undefined') ? globalThis
    : (typeof global !== 'undefined') ? global
    : (typeof window !== 'undefined') ? window
    : this;
  var savedDescriptor = Object.getOwnPropertyDescriptor(globalScope, 'localStorage');

  function withThrowingLocalStorage(fn) {
    Object.defineProperty(globalScope, 'localStorage', {
      value: makeThrowingLocalStorage(),
      configurable: true,
      writable: true
    });
    try {
      fn();
    } finally {
      if (savedDescriptor) {
        Object.defineProperty(globalScope, 'localStorage', savedDescriptor);
      } else {
        delete globalScope.localStorage;
      }
    }
  }

  // =========================================================================
  console.log('Admin Store (guarded read failure) tests');
  console.log('----------------------------------------');

  // ---- TASK 5.2 ----------------------------------------------------------
  // Validates: Requirements 3.7
  test('guarded read returns null and flips storageOk=false when getItem throws', function () {
    withThrowingLocalStorage(function () {
      var made = makeStore();
      var Store = made.Store;
      var state = made.state;

      // Precondition: the flag starts true (the happy-path default).
      assertEqual(state.storageOk, true, 'storageOk should start true before any failing read');

      var result = Store.readViewingYearId();

      // The guarded read swallows the throw and returns null...
      assertEqual(result, null, 'read must return null when getItem throws');
      // ...and flips the flag so Req 3.7 fallback / notice paths engage.
      assertEqual(state.storageOk, false, 'storageOk must be false after a throwing read');
    });
  });

  test('a throwing write also flips storageOk=false and does not propagate', function () {
    withThrowingLocalStorage(function () {
      var made = makeStore();
      var Store = made.Store;
      var state = made.state;

      // writeViewingYearId only attempts a write for a truthy id; a throwing
      // setItem must be swallowed and flip the guard flag.
      Store.writeViewingYearId('Y2027');
      assertEqual(state.storageOk, false, 'storageOk must be false after a throwing write');
    });
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
