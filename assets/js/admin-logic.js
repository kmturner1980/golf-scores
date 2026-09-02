// Pure logic helpers for the Coach Admin dashboard, extracted so they can be
// unit- and property-tested with no DOM, no localStorage, and no build step.
//
// The module attaches an `AdminLogic` namespace to `window` in the browser and
// also exports it via `module.exports` under Node, so a `<script>` test page or
// a `node` harness can load it with no bundler and no dependencies. `admin.js`
// calls into these helpers internally.
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;            // Node / `node assets/js/*.test.js`
  }
  if (root) {
    root.AdminLogic = api;           // Browser: window.AdminLogic
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  // Predicate for whether a season row is the current season. The backend may
  // encode IsCurrent as a boolean `true` or the strings "TRUE"/"true", so all
  // three are accepted; everything else (false, undefined, missing) is rejected.
  // Used as the `isCurrent` predicate passed into resolveViewingYearId.
  function isCurrentYearRow(row) {
    if (!row) return false;
    return row.IsCurrent === true || row.IsCurrent === 'TRUE' || row.IsCurrent === 'true';
  }

  // Pure precedence resolver for which season the dashboard should view on load.
  // Precedence: a stored id that matches a loaded season -> the current season
  // -> the most-recently-created season -> null (no seasons). No DOM, no
  // storage; all inputs are passed in, so this is directly testable.
  //   years:     array of season rows ({ YearID, CreatedAt, IsCurrent })
  //   storedId:  the id read from the store (may be null / stale / unknown)
  //   isCurrent: predicate (y) => boolean (reuses isCurrentYearRow)
  // Returns a YearID present in `years`, or null when `years` is empty. It never
  // returns an id absent from `years`.
  function resolveViewingYearId(years, storedId, isCurrent) {
    var list = Array.isArray(years) ? years : [];
    if (!list.length) return null;                                   // Req 3.6
    if (storedId && list.some(function (y) { return y.YearID === storedId; })) {
      return storedId;                                               // Req 3.2
    }
    var predicate = typeof isCurrent === 'function' ? isCurrent : isCurrentYearRow;
    var current = list.find(predicate);
    if (current) return current.YearID;                              // Req 3.3
    var newest = list.slice().sort(function (a, b) {
      return new Date(b.CreatedAt) - new Date(a.CreatedAt);
    })[0];
    return newest ? newest.YearID : null;                            // Req 3.4
  }

  // Pure set-difference + sort behind populateAddExistingSelect(): given the
  // globally-existing players and the set of tokens already rostered for the
  // viewing season, return exactly the players whose token is NOT rostered,
  // ordered ascending by Name. No rostered player is included; no non-rostered
  // player is omitted. `rosterTokens` may be a Set, an array, or null.
  //   players:      array of { Token, Name }
  //   rosterTokens: Set | array of tokens rostered for the viewing season
  function existingPlayerCandidates(players, rosterTokens) {
    var list = Array.isArray(players) ? players : [];
    var rostered = rosterTokens instanceof Set
      ? rosterTokens
      : new Set(Array.isArray(rosterTokens) ? rosterTokens : []);
    return list
      .filter(function (p) { return !rostered.has(p.Token); })
      .sort(function (a, b) { return String(a.Name).localeCompare(String(b.Name)); });
  }

  // Pure previous-current roster lookup + sort behind renderImportCandidates():
  // given the globally-existing players, the PlayerYears roster associations, and
  // the current season's YearID, return exactly the players rostered to that
  // season (i.e. those whose Token matches a PlayerYears row with that YearID),
  // ordered ascending by Name. No player outside that roster is included; no
  // player in it is omitted. Returns an empty array when currentYearId has no
  // matching PlayerYears rows or matches nothing; missing/empty players or
  // playerYears are treated as empty inputs. No DOM, no storage.
  //   players:       array of { Token, Name }
  //   playerYears:   array of { YearID, PlayerToken } roster associations
  //   currentYearId: the YearID of the previous current season
  function importCandidatesFrom(players, playerYears, currentYearId) {
    var list = Array.isArray(players) ? players : [];
    var years = Array.isArray(playerYears) ? playerYears : [];
    var rostered = new Set(
      years
        .filter(function (r) { return r && r.YearID === currentYearId; })
        .map(function (r) { return r.PlayerToken; })
    );
    return list
      .filter(function (p) { return rostered.has(p.Token); })         // Reqs 4.2, 4.3
      .sort(function (a, b) { return String(a.Name).localeCompare(String(b.Name)); }); // Req 4.8
  }

  return {
    isCurrentYearRow: isCurrentYearRow,
    resolveViewingYearId: resolveViewingYearId,
    existingPlayerCandidates: existingPlayerCandidates,
    importCandidatesFrom: importCandidatesFrom
  };
});
