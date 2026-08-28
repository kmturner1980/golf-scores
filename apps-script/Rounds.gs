/** Round + per-hole score submission and retrieval. */

/**
 * Submits a full round for the player identified by `token`.
 * payload: { date, course, tees, holesPlayed, notes, holes: [{hole, par, score, fairway, gir, putts, penalty}] }
 */
function submitRound_(token, payload) {
  var player = getPlayerByToken_(token);
  if (!player) throw new Error('Invalid player link.');

  if (!payload || !payload.holes || !payload.holes.length) {
    throw new Error('At least one hole score is required.');
  }
  if (!payload.date) throw new Error('Date is required.');

  var roundId = Utilities.getUuid();

  appendObject_(SHEET_ROUNDS, {
    RoundID: roundId,
    PlayerToken: token,
    Date: payload.date,
    Course: (payload.course || '').toString().trim(),
    Tees: (payload.tees || '').toString().trim(),
    HolesPlayed: payload.holesPlayed || payload.holes.length,
    Notes: (payload.notes || '').toString().trim(),
    SubmittedAt: new Date()
  });

  appendHoleScores_(roundId, payload.holes);

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
 * Admin-only: overwrites an existing round's fields and replaces all of its
 * hole scores wholesale (simpler and less error-prone than patching
 * individual cells). The round keeps its RoundID and original owner.
 */
function updateRound_(roundId, payload) {
  if (!roundId) throw new Error('roundId is required.');
  if (!payload || !payload.holes || !payload.holes.length) {
    throw new Error('At least one hole score is required.');
  }
  if (!payload.date) throw new Error('Date is required.');

  var sheet = getSheet_(SHEET_ROUNDS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIdx = findRowIndexByValue_(sheet, headers, 'RoundID', roundId);
  if (rowIdx === -1) throw new Error('Round not found.');

  var updates = {
    Date: payload.date,
    Course: (payload.course || '').toString().trim(),
    Tees: (payload.tees || '').toString().trim(),
    HolesPlayed: payload.holesPlayed || payload.holes.length,
    Notes: (payload.notes || '').toString().trim()
  };
  Object.keys(updates).forEach(function (key) {
    var col = headers.indexOf(key) + 1;
    if (col > 0) sheet.getRange(rowIdx, col).setValue(updates[key]);
  });

  deleteRowsWhere_(SHEET_HOLE_SCORES, 'RoundID', roundId);
  appendHoleScores_(roundId, payload.holes);
}

/** Everything needed to render one player's own history (used by player.html). */
function getPlayerHistory_(token) {
  var player = getPlayerByToken_(token);
  if (!player) throw new Error('Invalid player link.');

  var rounds = sheetToObjects_(SHEET_ROUNDS).filter(function (r) {
    return r.PlayerToken === token;
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

/** Admin-only: full dataset for the dashboard. Stats are computed client-side. */
function getAllData_() {
  return {
    players: sheetToObjects_(SHEET_PLAYERS),
    rounds: sheetToObjects_(SHEET_ROUNDS),
    holeScores: sheetToObjects_(SHEET_HOLE_SCORES)
  };
}

/** Admin-only: removes a round and its hole scores (e.g. to fix a bad entry). */
function deleteRound_(roundId) {
  if (!roundId) throw new Error('roundId is required.');
  deleteRowsWhere_(SHEET_HOLE_SCORES, 'RoundID', roundId);
  var deleted = deleteRowsWhere_(SHEET_ROUNDS, 'RoundID', roundId);
  if (!deleted) throw new Error('Round not found.');
}
