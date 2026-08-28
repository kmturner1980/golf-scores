/** Player roster: lookup by secret token, list, add. */

function getPlayerByToken_(token) {
  if (!token) return null;
  var players = sheetToObjects_(SHEET_PLAYERS);
  for (var i = 0; i < players.length; i++) {
    if (players[i].Token === token) return players[i];
  }
  return null;
}

function listPlayers_() {
  return sheetToObjects_(SHEET_PLAYERS);
}

function validateSex_(sex) {
  if (sex !== 'Boy' && sex !== 'Girl') {
    throw new Error('Sex must be "Boy" or "Girl".');
  }
  return sex;
}

/** Admin-only: adds a new player and returns their new row (including secret token). */
function addPlayer_(name, sex) {
  name = (name || '').toString().trim();
  if (!name) throw new Error('Player name is required.');
  sex = validateSex_(sex);

  var token = Utilities.getUuid();
  var record = {
    Token: token,
    Name: name,
    Sex: sex,
    Active: true,
    DateAdded: new Date()
  };
  appendObject_(SHEET_PLAYERS, record);
  return record;
}

/** Admin-only: corrects a player's name and/or sex after the fact. */
function updatePlayer_(token, updates) {
  var sheet = getSheet_(SHEET_PLAYERS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIdx = findRowIndexByValue_(sheet, headers, 'Token', token);
  if (rowIdx === -1) throw new Error('Player not found.');

  if (updates.name != null) {
    var name = updates.name.toString().trim();
    if (!name) throw new Error('Player name is required.');
    sheet.getRange(rowIdx, headers.indexOf('Name') + 1).setValue(name);
  }
  if (updates.sex != null) {
    sheet.getRange(rowIdx, headers.indexOf('Sex') + 1).setValue(validateSex_(updates.sex));
  }
}

/** Admin-only: activate/deactivate a player without deleting their history. */
function setPlayerActive_(token, active) {
  var sheet = getSheet_(SHEET_PLAYERS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIdx = findRowIndexByValue_(sheet, headers, 'Token', token);
  if (rowIdx === -1) throw new Error('Player not found.');
  var col = headers.indexOf('Active') + 1;
  sheet.getRange(rowIdx, col).setValue(!!active);
}

/**
 * Admin-only: permanently removes a player along with every round and hole
 * score they've ever submitted. There's no undo, so the admin UI confirms
 * before calling this.
 */
function deletePlayer_(token) {
  if (!token) throw new Error('token is required.');
  var player = getPlayerByToken_(token);
  if (!player) throw new Error('Player not found.');

  var rounds = sheetToObjects_(SHEET_ROUNDS).filter(function (r) {
    return r.PlayerToken === token;
  });
  rounds.forEach(function (r) {
    deleteRowsWhere_(SHEET_HOLE_SCORES, 'RoundID', r.RoundID);
  });
  deleteRowsWhere_(SHEET_ROUNDS, 'PlayerToken', token);
  deleteRowsWhere_(SHEET_PLAYERS, 'Token', token);
}
