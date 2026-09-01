/**
 * Seasons/years. The roster (Players) is shared across every year -- only
 * Rounds are tagged to one. Every round submission resolves to "the current
 * year" unless a specific yearId is passed (the admin round editor does
 * this so backfilling/correcting a past season's round doesn't silently
 * move it to whatever's current).
 */

function listYears_() {
  return sheetToObjects_(SHEET_YEARS);
}

function isCurrentYearRow_(y) {
  return y.IsCurrent === true || y.IsCurrent === 'TRUE' || y.IsCurrent === 'true';
}

function getCurrentYear_() {
  var current = listYears_().filter(isCurrentYearRow_)[0];
  if (!current) {
    throw new Error('No current year is set. Run migrateAddYears() from the Apps Script editor, or create one from the admin dashboard.');
  }
  return current;
}

function getCurrentYearId_() {
  return getCurrentYear_().YearID;
}

function setAllYearsNotCurrent_() {
  var sheet = getSheet_(SHEET_YEARS);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  var headers = values[0];
  var col = headers.indexOf('IsCurrent') + 1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][col - 1]) sheet.getRange(i + 1, col).setValue(false);
  }
}

/**
 * Admin-only: creates a new year, makes it the current one, and carries
 * forward the roster from whatever was current before (so returning
 * players don't have to be re-added every season -- the admin removes the
 * exceptions, e.g. a graduated senior, from the admin dashboard instead).
 */
function createYear_(label) {
  label = (label || '').toString().trim();
  if (!label) throw new Error('Year label is required.');
  var existing = listYears_();
  if (existing.some(function (y) { return y.Label === label; })) {
    throw new Error('A year called "' + label + '" already exists.');
  }

  var previousCurrent = existing.filter(isCurrentYearRow_)[0];

  setAllYearsNotCurrent_();
  var yearId = Utilities.getUuid();
  appendObject_(SHEET_YEARS, {
    YearID: yearId,
    Label: label,
    IsCurrent: true,
    CreatedAt: new Date()
  });

  if (previousCurrent) copyPlayerYearRoster_(previousCurrent.YearID, yearId);

  return { yearId: yearId, label: label };
}

/** Admin-only: switches which year new player-submitted rounds go into. */
function setCurrentYear_(yearId) {
  if (!yearId) throw new Error('yearId is required.');
  var sheet = getSheet_(SHEET_YEARS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIdx = findRowIndexByValue_(sheet, headers, 'YearID', yearId);
  if (rowIdx === -1) throw new Error('Year not found.');
  setAllYearsNotCurrent_();
  sheet.getRange(rowIdx, headers.indexOf('IsCurrent') + 1).setValue(true);
}
