/** Round + per-hole score submission and retrieval. */

function isSummaryPayload_(payload) {
  return payload && payload.entryMode === 'summary';
}

/** Builds the Rounds-sheet row object shared by submitRound_ and updateRound_. */
function roundRowFields_(payload) {
  var summary = isSummaryPayload_(payload);
  var num = function (v) { return v === '' || v == null ? '' : Number(v); };
  return {
    Year: payload.yearId || getCurrentYearId_(),
    Date: payload.date,
    Course: (payload.course || '').toString().trim(),
    Tees: (payload.tees || '').toString().trim(),
    CourseRating: num(payload.courseRating),
    SlopeRating: num(payload.slopeRating),
    HolesPlayed: payload.holesPlayed || (payload.holes ? payload.holes.length : payload.summaryHoles),
    IsTournament: !!payload.isTournament,
    EntryMode: summary ? 'summary' : 'holes',
    SummaryPar: summary ? num(payload.summaryPar) : '',
    SummaryScore: summary ? num(payload.summaryScore) : '',
    SummaryFairwaysHit: summary ? num(payload.summaryFairwaysHit) : '',
    SummaryFairwaysAttempted: summary ? num(payload.summaryFairwaysAttempted) : '',
    SummaryGIR: summary ? num(payload.summaryGIR) : '',
    SummaryPutts: summary ? num(payload.summaryPutts) : '',
    SummaryPenalties: summary ? num(payload.summaryPenalties) : '',
    SummaryEagles: summary ? num(payload.summaryEagles) : '',
    SummaryBirdies: summary ? num(payload.summaryBirdies) : '',
    SummaryPars: summary ? num(payload.summaryPars) : '',
    SummaryBogeys: summary ? num(payload.summaryBogeys) : '',
    SummaryDoubles: summary ? num(payload.summaryDoubles) : '',
    SummaryWorse: summary ? num(payload.summaryWorse) : '',
    Notes: (payload.notes || '').toString().trim()
  };
}

function validateRoundPayload_(payload) {
  if (!payload) throw new Error('Round data is required.');
  if (!payload.date) throw new Error('Date is required.');
  if (isSummaryPayload_(payload)) {
    if (!payload.summaryHoles) throw new Error('Holes played is required.');
    if (!payload.summaryPar) throw new Error('Total par is required.');
    if (!payload.summaryScore) throw new Error('Total score is required.');
  } else if (!payload.holes || !payload.holes.length) {
    throw new Error('At least one hole score is required.');
  }
}

/**
 * Submits a full round for the player identified by `token`. Either
 * hole-by-hole (payload.holes: [{hole, par, score, fairway, gir, putts, penalty}])
 * or, when payload.entryMode === 'summary', just round totals
 * (summaryPar, summaryScore, summaryHoles, and optionally
 * summaryFairwaysHit/summaryFairwaysAttempted/summaryGIR/summaryPutts/summaryPenalties).
 */
function submitRound_(token, payload) {
  var player = getPlayerByToken_(token);
  if (!player) throw new Error('Invalid player link.');
  validateRoundPayload_(payload);

  var roundId = Utilities.getUuid();
  var fields = roundRowFields_(payload);
  fields.RoundID = roundId;
  fields.PlayerToken = token;
  fields.SubmittedAt = new Date();
  appendObject_(SHEET_ROUNDS, fields);

  if (!isSummaryPayload_(payload)) {
    appendHoleScores_(roundId, payload.holes);
  }

  return { roundId: roundId };
}

/** Shared by submitRound_ and updateRound_: validates and appends hole rows for a round. */
function appendHoleScores_(roundId, holes) {
  holes.forEach(function (h) {
    var par = Number(h.par);
    var score = Number(h.score);
    if (!par || !score) {
      throw new Error('Each hole needs a par and a score (hole ' + h.hole + ').');
    }
    appendObject_(SHEET_HOLE_SCORES, {
      RoundID: roundId,
      Hole: Number(h.hole),
      Par: par,
      Score: score,
      FairwayHit: par === 3 ? 'NA' : (h.fairway || 'N'),
      GIR: h.gir || 'N',
      Putts: h.putts === '' || h.putts == null ? '' : Number(h.putts),
      Penalties: h.penalty === '' || h.penalty == null ? 0 : Number(h.penalty)
    });
  });
}

/**
 * Admin-only: overwrites an existing round's fields wholesale, and replaces
 * its hole scores (if any -- summary-mode rounds have none). The round
 * keeps its RoundID and original owner. Switching entry mode while editing
 * is supported: hole rows are always cleared first, then re-added only if
 * the (possibly new) payload is hole-by-hole.
 */
function updateRound_(roundId, payload) {
  if (!roundId) throw new Error('roundId is required.');
  validateRoundPayload_(payload);

  var sheet = getSheet_(SHEET_ROUNDS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIdx = findRowIndexByValue_(sheet, headers, 'RoundID', roundId);
  if (rowIdx === -1) throw new Error('Round not found.');

  var updates = roundRowFields_(payload);
  Object.keys(updates).forEach(function (key) {
    var col = headers.indexOf(key) + 1;
    if (col > 0) sheet.getRange(rowIdx, col).setValue(updates[key]);
  });

  deleteRowsWhere_(SHEET_HOLE_SCORES, 'RoundID', roundId);
  if (!isSummaryPayload_(payload)) {
    appendHoleScores_(roundId, payload.holes);
  }
}

/**
 * Everything needed to render one player's own history (used by player.html).
 * Scoped to the current year only -- players don't pick a season, so their
 * own dashboard always reflects whichever one the admin has marked current.
 */
function getPlayerHistory_(token) {
  var player = getPlayerByToken_(token);
  if (!player) throw new Error('Invalid player link.');

  var currentYearId = getCurrentYearId_();
  var rounds = sheetToObjects_(SHEET_ROUNDS).filter(function (r) {
    return r.PlayerToken === token && r.Year === currentYearId;
  });
  var roundIds = {};
  rounds.forEach(function (r) { roundIds[r.RoundID] = true; });

  var holeScores = sheetToObjects_(SHEET_HOLE_SCORES).filter(function (h) {
    return roundIds[h.RoundID];
  });

  return {
    player: { name: player.Name, active: player.Active },
    rounds: rounds,
    holeScores: holeScores
  };
}

/**
 * Admin-only: full dataset for the dashboard, across every year -- the
 * admin UI filters by year client-side (and lets you switch which year
 * you're looking at). Stats are computed client-side too.
 */
function getAllData_() {
  return {
    players: sheetToObjects_(SHEET_PLAYERS),
    rounds: sheetToObjects_(SHEET_ROUNDS),
    holeScores: sheetToObjects_(SHEET_HOLE_SCORES),
    years: listYears_()
  };
}

/** Admin-only: removes a round and its hole scores (e.g. to fix a bad entry). */
function deleteRound_(roundId) {
  if (!roundId) throw new Error('roundId is required.');
  deleteRowsWhere_(SHEET_HOLE_SCORES, 'RoundID', roundId);
  var deleted = deleteRowsWhere_(SHEET_ROUNDS, 'RoundID', roundId);
  if (!deleted) throw new Error('Round not found.');
}
