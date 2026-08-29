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

// Short, easy-to-type/read player codes -- no 0/O/1/I/L, which get confused
// with each other in handwriting or over voice.
var TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
var TOKEN_LENGTH = 6;

function generateShortToken_() {
  var existing = {};
  sheetToObjects_(SHEET_PLAYERS).forEach(function (p) { existing[p.Token] = true; });
  for (var attempt = 0; attempt < 20; attempt++) {
    var token = '';
    for (var i = 0; i < TOKEN_LENGTH; i++) {
      token += TOKEN_ALPHABET.charAt(Math.floor(Math.random() * TOKEN_ALPHABET.length));
    }
    if (!existing[token]) return token;
  }
  throw new Error('Could not generate a unique player code -- please try again.');
}

/** Admin-only: adds a new player and returns their new row (including secret token). */
function addPlayer_(name, sex) {
  name = (name || '').toString().trim();
  if (!name) throw new Error('Player name is required.');
  sex = validateSex_(sex);

  var token = generateShortToken_();
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
    var sexCol = headers.indexOf('Sex');
    if (sexCol === -1) throw new Error('Players sheet has no "Sex" column yet -- run migrateAddSexColumn() from the Apps Script editor first.');
    sheet.getRange(rowIdx, sexCol + 1).setValue(validateSex_(updates.sex));
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
