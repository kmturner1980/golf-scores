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

  // Pure rounds-row -> labeled display-fields mapper behind the player-view
  // rounds presentation. Given an already-computed round display row, return
  // the same labeled values the desktop table cells show, as ordered
  // { label, value } pairs, so the mobile card layout and the desktop table
  // stay in sync from a single source. This helper is intentionally PURE: it
  // does NO DOM work, NO HTML escaping (escaping happens at render time), and
  // NO Stats computation — it only relabels/normalizes values that were already
  // computed by the caller, applying the `null -> '—'` rule for Score and Putts.
  //
  //   row = {
  //     date:        string  // preformatted date (may already include badge HTML)
  //     course:      string
  //     tees:        string
  //     holesPlayed: number
  //     score:       number | null   // null -> '—'
  //     diff:        string          // preformatted differential (e.g. Stats.fmtDiff output)
  //     putts:       number | null   // null -> '—'
  //   }
  //
  // Returns exactly seven pairs, in table-column order:
  //   Date, Course, Tees, Holes, Score, Diff, Putts.
  function roundCardFields(row) {
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

  // Trim + non-empty guard for a season label, mirroring createYear_'s
  // server-side `(label || '').toString().trim()` + "required" check so the
  // walkthrough gates the same way the backend validates. Returns true iff the
  // label has at least one non-whitespace character; null/undefined/non-strings
  // and whitespace-only strings are all invalid. No DOM, no storage. (Req 6.3)
  function isValidYearLabel(label) {
    if (label == null) return false;
    return String(label).trim().length > 0;
  }

  // Step-completeness / navigation gating for the Add-Year walkthrough. Given
  // the walkthrough model, report which steps are complete and whether Confirm
  // is allowed. Steps 2 (returning players) and 3 (new players) are SKIPPABLE —
  // an empty season with a valid label is allowed — so confirmation is gated
  // ONLY by the label. `canConfirm === isValidYearLabel(walk.label)` regardless
  // of returning selections or new-player rows. Treats a missing model as an
  // empty (invalid-label) model. No DOM, no storage. (Reqs 6.3, 6.5, 6.7, 6.8)
  //   walk: { label, returningTokens:[], newPlayers:[{name,sex}] }
  //   -> { labelValid, step1Complete, canConfirm }
  function walkStepValidation(walk) {
    var model = walk || {};
    var labelValid = isValidYearLabel(model.label);
    return {
      labelValid: labelValid,
      step1Complete: labelValid,
      canConfirm: labelValid
    };
  }

  // Validate/normalize a single new-player row from walkthrough Step 3. A row is
  // valid iff its name is non-empty after trimming AND its sex is exactly 'Boy'
  // or 'Girl'. Returns the trimmed name and the normalized sex ('Boy'/'Girl' or
  // null when neither). Blank/invalid rows report `valid: false` but never
  // throw — callers drop them rather than error. No DOM, no storage. (Req 6.6)
  //   row: { name, sex }
  //   -> { valid: boolean, name: string /*trimmed*/, sex: 'Boy'|'Girl'|null }
  function validateNewPlayerRow(row) {
    var r = row || {};
    var name = r.name == null ? '' : String(r.name).trim();
    var sex = (r.sex === 'Boy' || r.sex === 'Girl') ? r.sex : null;
    return {
      valid: name.length > 0 && sex !== null,
      name: name,
      sex: sex
    };
  }

  // Keep only the valid new-player rows to actually create, dropping blank/
  // invalid rows (empty name after trim, or a sex that is not Boy/Girl) and
  // preserving the relative order of the surviving rows. Each returned row
  // carries the trimmed name and normalized Boy/Girl sex. A missing/non-array
  // input yields an empty array. No DOM, no storage. (Req 6.10)
  //   rows: [{ name, sex }]  ->  [{ name, sex }] (valid only, order preserved)
  function collectNewPlayers(rows) {
    var list = Array.isArray(rows) ? rows : [];
    var out = [];
    list.forEach(function (row) {
      var v = validateNewPlayerRow(row);
      if (v.valid) out.push({ name: v.name, sex: v.sex });
    });
    return out;
  }

  // Assemble the Step-4 Review & Confirm summary purely from the walkthrough
  // model plus the global player list. The label is trimmed; the returning list
  // corresponds exactly to `walk.returningTokens`, with each token's display
  // Name resolved from `players` (unknown tokens resolve to an empty name but
  // are still included, preserving token order); newPlayers is exactly
  // `collectNewPlayers(walk.newPlayers)`. No DOM, no storage. (Req 6.9)
  //   walk:    { label, returningTokens:[], newPlayers:[{name,sex}] }
  //   players: array of { Token, Name }
  //   -> { label, returning:[{token,name}], newPlayers:[{name,sex}] }
  function buildConfirmSummary(walk, players) {
    var model = walk || {};
    var list = Array.isArray(players) ? players : [];
    var byToken = {};
    list.forEach(function (p) {
      if (p && p.Token != null) byToken[p.Token] = p.Name;
    });
    var tokens = Array.isArray(model.returningTokens) ? model.returningTokens : [];
    var returning = tokens.map(function (token) {
      var name = byToken[token];
      return { token: token, name: name == null ? '' : name };
    });
    return {
      label: model.label == null ? '' : String(model.label).trim(),
      returning: returning,
      newPlayers: collectNewPlayers(model.newPlayers)
    };
  }

  // Order/annotate the season list for the Year Management view. Returns exactly
  // one row per input season (every YearID present once), ordered newest-first
  // by CreatedAt to mirror populateYearSelect's sort. Each row carries its
  // YearID, Label, whether it is the current season (via the supplied `isCurrent`
  // predicate, defaulting to isCurrentYearRow), and `canMakeCurrent === !isCurrent`
  // (Make-current is offered for exactly the non-current seasons). A missing/
  // non-array input yields an empty array. No DOM, no storage.
  //   years:     array of { YearID, Label, CreatedAt, IsCurrent }
  //   isCurrent: predicate (y) => boolean (reuses isCurrentYearRow)
  //   -> [{ yearId, label, isCurrent, canMakeCurrent }]  (newest-first)
  function yearListRows(years, isCurrent) {
    var list = Array.isArray(years) ? years : [];
    var predicate = typeof isCurrent === 'function' ? isCurrent : isCurrentYearRow;
    return list
      .slice()
      .sort(function (a, b) {
        return new Date(b.CreatedAt) - new Date(a.CreatedAt);        // Reqs 4.1, 4.2
      })
      .map(function (y) {
        var current = !!predicate(y);
        return {
          yearId: y.YearID,
          label: y.Label,
          isCurrent: current,                                        // Reqs 4.2, 4.5
          canMakeCurrent: !current                                   // Reqs 4.4, 5.3
        };
      });
  }

  return {
    isCurrentYearRow: isCurrentYearRow,
    resolveViewingYearId: resolveViewingYearId,
    existingPlayerCandidates: existingPlayerCandidates,
    importCandidatesFrom: importCandidatesFrom,
    roundCardFields: roundCardFields,
    isValidYearLabel: isValidYearLabel,
    walkStepValidation: walkStepValidation,
    validateNewPlayerRow: validateNewPlayerRow,
    collectNewPlayers: collectNewPlayers,
    buildConfirmSummary: buildConfirmSummary,
    yearListRows: yearListRows
  };
});
