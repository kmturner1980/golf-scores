/**
 * Web API entry points. Deploy this project as a Web App (Execute as: Me,
 * Who has access: Anyone) and the resulting URL is the API this site's
 * frontend talks to.
 *
 * GET requests use ?action=... query params.
 * POST requests send a JSON body as Content-Type: text/plain (this avoids a
 * CORS preflight, which Apps Script web apps can't answer) with an "action"
 * field inside the JSON.
 */

function doGet(e) {
  var action = e.parameter.action;
  try {
    switch (action) {
      case 'getPlayer':
        return jsonOut_(getPlayerHistory_(e.parameter.token));
      case 'adminData':
        requireSession_(e.parameter.session);
        return jsonOut_(getAllData_());
      default:
        throw new Error('Unknown or missing action.');
    }
  } catch (err) {
    return jsonOut_({ error: err.message }, 400);
  }
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ error: 'Invalid request body.' }, 400);
  }

  try {
    switch (body.action) {
      case 'submitRound':
        return jsonOut_(submitRound_(body.token, body));

      case 'adminLogin':
        return jsonOut_({ session: adminLogin_(body.password) });

      case 'addPlayer':
        requireSession_(body.session);
        return jsonOut_(addPlayer_(body.name, body.sex));

      case 'updatePlayer':
        requireSession_(body.session);
        updatePlayer_(body.token, { name: body.name, sex: body.sex });
        return jsonOut_({ ok: true });

      case 'setPlayerActive':
        requireSession_(body.session);
        setPlayerActive_(body.token, body.active);
        return jsonOut_({ ok: true });

      case 'deleteRound':
        requireSession_(body.session);
        deleteRound_(body.roundId);
        return jsonOut_({ ok: true });

      case 'updateRound':
        requireSession_(body.session);
        updateRound_(body.roundId, body);
        return jsonOut_({ ok: true });

      case 'deletePlayer':
        requireSession_(body.session);
        deletePlayer_(body.token);
        return jsonOut_({ ok: true });

      default:
        throw new Error('Unknown or missing action.');
    }
  } catch (err) {
    return jsonOut_({ error: err.message }, 400);
  }
}

/**
 * Apps Script's ContentService doesn't let us set a real HTTP status code,
 * so `status` is informational only — callers should check body.error.
 */
function jsonOut_(obj, status) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
