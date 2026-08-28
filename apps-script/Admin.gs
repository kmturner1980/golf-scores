/**
 * Coach admin authentication. A correct password buys a session token that's
 * cached server-side for a few hours — good enough for a small team's shared
 * admin link without building real accounts.
 */

var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 hours

function adminLogin_(password) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected) {
    throw new Error('Admin password has not been set up yet. Run setAdminPassword() in the Apps Script editor.');
  }
  if (password !== expected) {
    throw new Error('Incorrect password.');
  }
  var session = Utilities.getUuid();
  CacheService.getScriptCache().put('session_' + session, 'valid', SESSION_TTL_SECONDS);
  return session;
}

function requireSession_(session) {
  if (!session) throw new Error('Not authorized. Please log in.');
  var cached = CacheService.getScriptCache().get('session_' + session);
  if (cached !== 'valid') {
    throw new Error('Session expired. Please log in again.');
  }
}
