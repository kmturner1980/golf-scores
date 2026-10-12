/**
 * Seasons/years. The roster (Players) is shared across every year -- only
 * Rounds are tagged to one. Any number of seasons can be open (unlocked) at
 * once; players pick which of their seasons a round goes into, and the admin
 * round editor picks one too. (Older sheets may still have an IsCurrent
 * column from before this -- it's ignored.)
 */

function listYears_() {
  return sheetToObjects_(SHEET_YEARS);
}

function isYearLockedRow_(y) {
  return y.IsLocked === true || y.IsLocked === 'TRUE' || y.IsLocked === 'true';
}

/** Whether the given year is locked -- unknown yearId is treated as unlocked. */
function isYearLocked_(yearId) {
  var year = listYears_().filter(function (y) { return y.YearID === yearId; })[0];
  return !!year && isYearLockedRow_(year);
}

/**
 * Admin-only: creates a new (unlocked) year and rosters only
 * the players the admin selected (via playerTokens) onto the new season. An
 * empty or omitted token list rosters nobody -> the season starts empty. This
 * replaces the old unconditional full carry-forward of the previous roster.
 */
function createYear_(label, playerTokens) {
  label = (label || '').toString().trim();
  if (!label) throw new Error('Year label is required.');
  var existing = listYears_();
  if (existing.some(function (y) { return y.Label === label; })) {
    throw new Error('A year called "' + label + '" already exists.');
  }

  var yearId = Utilities.getUuid();
  appendObject_(SHEET_YEARS, {
    YearID: yearId,
    Label: label,
    CreatedAt: new Date()
  });

  // Roster ONLY the selected players onto the new season (Req 4.8). An empty or
  // omitted list rosters nobody -> empty-roster season (Req 4.3). addPlayerToYear_
  // is idempotent, so duplicate tokens in the request are harmless.
  var tokens = Array.isArray(playerTokens) ? playerTokens : [];
  tokens.forEach(function (token) {
    if (token) addPlayerToYear_(token, yearId);
  });

  return { yearId: yearId, label: label };
}

/**
 * Admin-only: locks or unlocks a season. While locked, players can no longer
 * submit new rounds into it (submitRound_ enforces this) -- admins are
 * unaffected either way, since updateRound_/deleteRound_/submitRound_-with-a-
 * session all already require an admin session regardless of lock state.
 * Any number of years can be locked at once.
 */
function setYearLocked_(yearId, locked) {
  if (!yearId) throw new Error('yearId is required.');
  var sheet = getSheet_(SHEET_YEARS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIdx = findRowIndexByValue_(sheet, headers, 'YearID', yearId);
  if (rowIdx === -1) throw new Error('Year not found.');
  sheet.getRange(rowIdx, headers.indexOf('IsLocked') + 1).setValue(!!locked);
}
