/**
 * Low-level helpers for reading/writing the spreadsheet that backs this app.
 * Every other .gs file goes through these instead of touching SpreadsheetApp directly.
 */

var SHEET_PLAYERS = 'Players';
var SHEET_ROUNDS = 'Rounds';
var SHEET_HOLE_SCORES = 'HoleScores';

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet "' + name + '" not found. Run initializeSheets() from Setup.gs first.');
  }
  return sheet;
}

/**
 * Reads a sheet into an array of plain objects keyed by the header row.
 * Skips fully-blank rows.
 */
function sheetToObjects_(name) {
  var sheet = getSheet_(name);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var isBlank = row.every(function (c) { return c === '' || c === null; });
    if (isBlank) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    rows.push(obj);
  }
  return rows;
}

/** Appends one object as a row, mapping fields to columns by the header row. */
function appendObject_(name, obj) {
  var sheet = getSheet_(name);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function (h) {
    return Object.prototype.hasOwnProperty.call(obj, h) ? obj[h] : '';
  });
  sheet.appendRow(row);
}

/**
 * Deletes every row in `name` whose column `keyHeader` equals `keyValue`.
 * Used e.g. to delete a round and its hole scores together.
 */
function deleteRowsWhere_(name, keyHeader, keyValue) {
  var sheet = getSheet_(name);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return 0;
  var headers = values[0];
  var colIdx = headers.indexOf(keyHeader);
  if (colIdx === -1) throw new Error('Column "' + keyHeader + '" not found in ' + name);
  var deleted = 0;
  for (var i = values.length - 1; i >= 1; i--) {
    if (values[i][colIdx] === keyValue) {
      sheet.deleteRow(i + 1);
      deleted++;
    }
  }
  return deleted;
}

function findRowIndexByValue_(sheet, headers, header, value) {
  var colIdx = headers.indexOf(header);
  if (colIdx === -1) return -1;
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][colIdx] === value) return i + 1; // 1-based sheet row
  }
  return -1;
}
