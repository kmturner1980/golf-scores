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

/** Admin-only: adds a new player and returns their new row (including secret token). */
function addPlayer_(name) {
  name = (name || '').toString().trim();
  if (!name) throw new Error('Player name is required.');

  var token = Utilities.getUuid();
  var record = {
    Token: token,
    Name: name,
    Active: true,
    DateAdded: new Date()
  };
  appendObject_(SHEET_PLAYERS, record);
  return record;
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
