/**
 * Which players are rostered for which season -- a many-to-many mapping
 * between Players and Years. A player not in this list for a given year
 * simply doesn't show up in that year's roster/stats at all (e.g. a
 * graduated senior shouldn't appear the following season), even though
 * their player record and history are never deleted.
 */

function listPlayerYears_() {
  return sheetToObjects_(SHEET_PLAYER_YEARS);
}

function isPlayerInYear_(token, yearId) {
  return listPlayerYears_().some(function (py) {
    return py.PlayerToken === token && py.YearID === yearId;
  });
}

/** Idempotent -- does nothing if the player is already rostered for that year. */
function addPlayerToYear_(token, yearId) {
  if (!token) throw new Error('token is required.');
  if (!yearId) throw new Error('yearId is required.');
  if (isPlayerInYear_(token, yearId)) return;
  appendObject_(SHEET_PLAYER_YEARS, {
    PlayerToken: token,
    YearID: yearId,
    AddedAt: new Date()
  });
}

/** Removes a player from one season's roster without touching their data. */
function removePlayerFromYear_(token, yearId) {
  if (!token) throw new Error('token is required.');
  removePlayersFromYear_([token], yearId);
}

/**
 * Removes several players from one season's roster in a single pass (the
 * Edit Season panel's "Remove Selected"). Their player records and rounds
 * are untouched.
 */
function removePlayersFromYear_(tokens, yearId) {
  if (!tokens || !tokens.length) throw new Error('Pick at least one player.');
  if (!yearId) throw new Error('yearId is required.');
  var remove = {};
  tokens.forEach(function (t) { remove[t] = true; });
  var sheet = getSheet_(SHEET_PLAYER_YEARS);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  var headers = values[0];
  var tokenCol = headers.indexOf('PlayerToken');
  var yearCol = headers.indexOf('YearID');
  for (var i = values.length - 1; i >= 1; i--) {
    if (remove[values[i][tokenCol]] && values[i][yearCol] === yearId) {
      sheet.deleteRow(i + 1);
    }
  }
}
