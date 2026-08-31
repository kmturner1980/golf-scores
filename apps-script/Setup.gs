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
    players.appendRow(['Token', 'Name', 'Sex', 'Active', 'DateAdded']);
  }

  var rounds = ss.getSheetByName(SHEET_ROUNDS) || ss.insertSheet(SHEET_ROUNDS);
  if (rounds.getLastRow() === 0) {
    rounds.appendRow(['RoundID', 'PlayerToken', 'Date', 'Course', 'Tees', 'CourseRating', 'SlopeRating',
      'HolesPlayed', 'IsTournament',
      'EntryMode', 'SummaryPar', 'SummaryScore', 'SummaryFairwaysHit', 'SummaryFairwaysAttempted',
      'SummaryGIR', 'SummaryPutts', 'SummaryPenalties', 'SummaryEagles', 'SummaryBirdies', 'SummaryPars',
      'SummaryBogeys', 'SummaryDoubles', 'SummaryWorse', 'Notes', 'SubmittedAt']);
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
 * Run this once if your Players sheet was created before the Sex column
 * existed. Safe to run multiple times -- it's a no-op if the column is
 * already there. Existing players will have a blank Sex until you set it
 * from the admin dashboard.
 */
function migrateAddSexColumn() {
  var sheet = getSheet_(SHEET_PLAYERS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('Sex') !== -1) {
    Logger.log('Sex column already exists -- nothing to do.');
    return;
  }
  var nameCol = headers.indexOf('Name') + 1;
  sheet.insertColumnAfter(nameCol);
  sheet.getRange(1, nameCol + 1).setValue('Sex');
  Logger.log('Added Sex column to Players sheet.');
}

/**
 * Run this once if your Rounds sheet was created before tournament-round
 * tracking existed. Safe to run multiple times. Existing rounds count as
 * non-tournament until you edit them to mark otherwise.
 */
function migrateAddTournamentColumn() {
  var sheet = getSheet_(SHEET_ROUNDS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('IsTournament') !== -1) {
    Logger.log('IsTournament column already exists -- nothing to do.');
    return;
  }
  var holesCol = headers.indexOf('HolesPlayed') + 1;
  sheet.insertColumnAfter(holesCol);
  sheet.getRange(1, holesCol + 1).setValue('IsTournament');
  Logger.log('Added IsTournament column to Rounds sheet.');
}

/**
 * Run this once if your Rounds sheet was created before "summary-only"
 * round entry existed (totals instead of hole-by-hole). Safe to run more
 * than once (including after this function later gained more columns --
 * it only adds whatever's still missing). Existing rounds are unaffected --
 * they stay hole-by-hole.
 */
function migrateAddSummaryColumns() {
  var sheet = getSheet_(SHEET_ROUNDS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newCols = ['EntryMode', 'SummaryPar', 'SummaryScore', 'SummaryFairwaysHit',
    'SummaryFairwaysAttempted', 'SummaryGIR', 'SummaryPutts', 'SummaryPenalties',
    'SummaryEagles', 'SummaryBirdies', 'SummaryPars', 'SummaryBogeys', 'SummaryDoubles', 'SummaryWorse'];
  var missing = newCols.filter(function (c) { return headers.indexOf(c) === -1; });
  if (!missing.length) {
    Logger.log('Summary columns already exist -- nothing to do.');
    return;
  }
  var afterCol = headers.indexOf('IsTournament') + 1 || headers.indexOf('HolesPlayed') + 1;
  missing.forEach(function (name, i) {
    sheet.insertColumnAfter(afterCol + i);
    sheet.getRange(1, afterCol + i + 1).setValue(name);
  });
  Logger.log('Added summary columns to Rounds sheet: ' + missing.join(', '));
}

/**
 * Run this once if your Rounds sheet was created before Course Rating /
 * Slope Rating tracking existed. Safe to run more than once. Applies to
 * both hole-by-hole and summary-only rounds -- it's tied to which tee was
 * played, not how the round was scored.
 */
function migrateAddRatingColumns() {
  var sheet = getSheet_(SHEET_ROUNDS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newCols = ['CourseRating', 'SlopeRating'];
  var missing = newCols.filter(function (c) { return headers.indexOf(c) === -1; });
  if (!missing.length) {
    Logger.log('Rating columns already exist -- nothing to do.');
    return;
  }
  var afterCol = headers.indexOf('Tees') + 1;
  missing.forEach(function (name, i) {
    sheet.insertColumnAfter(afterCol + i);
    sheet.getRange(1, afterCol + i + 1).setValue(name);
  });
  Logger.log('Added rating columns to Rounds sheet: ' + missing.join(', '));
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
