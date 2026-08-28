/**
 * One-time setup helpers. Run these manually from the Apps Script editor
 * (select the function in the dropdown, click Run) — they are not exposed
 * over the web API.
 */

/** Creates the three sheets this app needs, with header rows, if missing. */
function initializeSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var players = ss.getSheetByName(SHEET_PLAYERS) || ss.insertSheet(SHEET_PLAYERS);
  if (players.getLastRow() === 0) {
    players.appendRow(['Token', 'Name', 'Active', 'DateAdded']);
  }

  var rounds = ss.getSheetByName(SHEET_ROUNDS) || ss.insertSheet(SHEET_ROUNDS);
  if (rounds.getLastRow() === 0) {
    rounds.appendRow(['RoundID', 'PlayerToken', 'Date', 'Course', 'Tees', 'HolesPlayed', 'Notes', 'SubmittedAt']);
  }

  var holeScores = ss.getSheetByName(SHEET_HOLE_SCORES) || ss.insertSheet(SHEET_HOLE_SCORES);
  if (holeScores.getLastRow() === 0) {
    holeScores.appendRow(['RoundID', 'Hole', 'Par', 'Score', 'FairwayHit', 'GIR', 'Putts', 'Penalties']);
  }

  // Remove the default "Sheet1" if it's still there and empty.
  var sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && sheet1.getLastRow() === 0) {
    ss.deleteSheet(sheet1);
  }

  Logger.log('Sheets initialized.');
}

/**
 * Sets (or changes) the coach admin password. Run this manually, e.g.:
 *   setAdminPassword('YourNewPassword123');
 * Do not commit real passwords into this file — call it from the editor
 * with the password typed directly into the Run dialog isn't possible for
 * Apps Script, so just edit the argument here temporarily, run once, then
 * remove the plaintext value from the file before committing/pushing.
 */
function setAdminPassword(password) {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', password);
  Logger.log('Admin password set.');
}
