# Golf Scores

A score and stats tracker for a high school golf team. Each golfer gets a
private link to enter their own round scores; the coach gets an admin
dashboard showing the whole roster's rounds and stats.

**Stack:** Google Sheets as the database, Google Apps Script as the free
JSON API, and a static site (this repo, deployable on GitHub Pages) as the
frontend. No servers to pay for or maintain.

## How it works

- `apps-script/` — an Apps Script project bound to a Google Sheet. It exposes
  a small JSON API (deployed as a Web App) for reading/writing player,
  round, and hole-score data.
- `index.html`, `player.html`, `admin.html`, `assets/` — the static frontend.
  Host these anywhere that serves static files (GitHub Pages is free and
  easiest).
- Each player has a random secret **token** baked into their link
  (`player.html?token=...`). Anyone with the link can enter scores as that
  player — there's no password for players, so treat the link like a shared
  secret and don't post it publicly.
- The coach dashboard is behind a single shared **admin password**.

## One-time setup

### 1. Create the Google Sheet + Apps Script project

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like "Golf Scores Data".
2. In the sheet, go to **Extensions → Apps Script**. This opens a script
   project already bound to your sheet.
3. Delete the default `Code.gs` content, then re-create the files from this
   repo's `apps-script/` folder inside the Apps Script editor, one at a
   time: for each of `Code.gs`, `Sheets.gs`, `Setup.gs`, `Players.gs`,
   `Rounds.gs`, `Admin.gs`, create a matching script file (⊕ next to
   "Files") and paste in the contents.
4. Open **Project Settings** (gear icon) → check "Show `appsscript.json`
   manifest file in editor", then open that file in the editor and replace
   its contents with `apps-script/appsscript.json` from this repo.

### 2. Initialize the sheet and set the admin password

1. Back in the Apps Script editor, open `Setup.gs`.
2. In the function dropdown at the top, select `initializeSheets`, then
   click **Run**. The first run will prompt you to authorize the script —
   accept it. This creates the `Players`, `Rounds`, and `HoleScores` tabs.
3. Temporarily edit the last line of `Setup.gs` area to call
   `setAdminPassword('YourPasswordHere')` — easiest way: select
   `setAdminPassword` in the function dropdown, and since Apps Script can't
   prompt for arguments, briefly add a line like
   `function runSetup() { setAdminPassword('YourPasswordHere'); }` at the
   bottom of the file, select `runSetup` in the dropdown, and click **Run**.
4. Delete that temporary `runSetup` function afterward so the plaintext
   password isn't sitting in the file (it's already saved server-side in
   Script Properties, so this is just cleanup).

### 3. Deploy the API

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set **Execute as: Me**, **Who has access: Anyone**.
4. Click **Deploy**, authorize if prompted, and copy the **Web app URL**
   (looks like `https://script.google.com/macros/s/AKfycb.../exec`).

Whenever you change the `.gs` files later, use **Deploy → Manage
deployments → edit (pencil) → New version** to push the update live — the
URL stays the same.

### 4. Point the frontend at your API

1. Open `assets/js/config.js` in this repo.
2. Replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the Web app URL
   from step 3.
3. Commit and push.

### 5. Host the static site with GitHub Pages

1. In this repo on GitHub: **Settings → Pages**.
2. Under "Build and deployment", set **Source: Deploy from a branch**,
   branch **main**, folder **/(root)**. Save.
3. GitHub gives you a URL like `https://kmturner1980.github.io/golf-scores/`.
   That's the site.

### 6. Add players and distribute links

1. Visit `https://<your-pages-url>/admin.html`, log in with the admin
   password from step 2.
2. Use **Add Player** for each golfer — it generates their personal link.
   Copy it and send it to them (text, email, whatever's easiest).
3. Players open their link, bookmark it, and use it all season to enter
   rounds. The same link always works — no login needed.

## Data tracked per round

For each hole: par, score, fairway hit (skipped for par 3s), green in
regulation, putts, and penalty strokes.

From that, the app computes (per player and for the whole team): scoring
average, fairway %, GIR %, putting average, and counts of eagles, birdies,
pars, bogeys, double bogeys, and worse-than-double.

## Local development

This is plain HTML/CSS/JS with no build step — just open the files in a
browser, or serve the repo root with any static file server. Point
`assets/js/config.js` at your deployed Apps Script URL either way (Apps
Script has no meaningful "local" mode).
