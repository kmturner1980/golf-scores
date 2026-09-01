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
- Each player has a short, random secret **code** (6 characters, e.g.
  `RK7MPQ`) baked into their link (`player.html?token=RK7MPQ`). Anyone with
  the link can enter scores as that player — there's no password for
  players, so treat the link like a shared secret and don't post it
  publicly.
- The coach dashboard is behind a single shared **admin password**.

## Troubleshooting: "Unknown or missing action"

If the admin dashboard shows this error (editing a player, editing a round,
deleting a player, etc.), your live Apps Script deployment is running an
older copy of the code that doesn't recognize that action yet. This repo
gets updated over time — every time it does, **you must copy the changed
`.gs` files into your Apps Script project and push a new deployment
version** (see step 3 below); the frontend and backend are only in sync
when you've done that. This is almost always the fix for this exact error.

## One-time setup

### 1. Create the Google Sheet + Apps Script project

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like "Golf Scores Data".
2. In the sheet, go to **Extensions → Apps Script**. This opens a script
   project already bound to your sheet.
3. Delete the default `Code.gs` content, then re-create the files from this
   repo's `apps-script/` folder inside the Apps Script editor, one at a
   time: for each of `Code.gs`, `Sheets.gs`, `Setup.gs`, `Players.gs`,
   `Rounds.gs`, `Years.gs`, `Admin.gs`, create a matching script file (⊕ next
   to "Files") and paste in the contents.
4. Open **Project Settings** (gear icon) → check "Show `appsscript.json`
   manifest file in editor", then open that file in the editor and replace
   its contents with `apps-script/appsscript.json` from this repo.

### 2. Initialize the sheet and set the admin password

1. Back in the Apps Script editor, open `Setup.gs`.
2. In the function dropdown at the top, select `initializeSheets`, then
   click **Run**. The first run will prompt you to authorize the script —
   accept it. This creates the `Players`, `Rounds`, `HoleScores`, and
   `Years` tabs (with one starter season already created and marked
   current).
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
URL stays the same. **This is a manual step you have to repeat every time
you pull a newer version of this repo** — pasting updated `.gs` file
contents into the Apps Script editor does nothing for players/coaches until
you also create a new deployment version. If you're not sure whether
you're on the latest code, just redo it: copy every file under
`apps-script/` into the Apps Script editor and create a new version.

Five one-time migrations, run from the Apps Script editor's function
dropdown (same way you ran `initializeSheets`) if your sheet predates them
— all are safe to run more than once:
- `migrateAddSexColumn` — adds the `Sex` column to Players.
- `migrateAddTournamentColumn` — adds the `IsTournament` column to Rounds.
- `migrateAddSummaryColumns` — adds the columns "just the totals" round
  entry needs to Rounds (this one gained more columns after it first
  shipped — safe to re-run, it only adds what's still missing).
- `migrateAddRatingColumns` — adds the `CourseRating`/`SlopeRating` columns
  to Rounds (used for score differential; applies to both entry modes).
- `migrateAddYears` — creates the `Years` tab with one starter season
  (marked current) if it doesn't exist, adds the `Year` column to Rounds,
  and backfills any of your existing rounds onto that starter season so
  they don't disappear from view once year filtering is live.

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

## Branding

The site uses the Ambrose Athletics color scheme (navy `#1b325e`, columbia
blue `#6d87a8`, gold `#e0aa0f`, blue-gray `#d7e1e7`, warm gray `#eaeaea`),
defined as CSS variables at the top of `assets/css/styles.css` — change
those to re-theme the whole site.

Buttons, inputs, and type also follow [theambroseschool.org](https://www.theambroseschool.org)'s
own style: "Open Sans" for body/UI text (loaded from Google Fonts) with a
plain serif ("Times New Roman", matching their own declared heading font)
for headings, sharp 3-4px corners rather than heavily rounded ones, and
uppercase, letter-spaced text on buttons and field labels.

The header on every page references a logo file at
`assets/img/ambrose-golf-logo.png` (also used as the favicon). If that file
is ever missing, the header just shows text — no broken-image icon.

## Customizing the course list

The "Course" dropdown on the entry form is populated from
`assets/js/courses.js`. Each entry is `{ name, city }`, optionally with a
`pars` array of 18 numbers (one par per hole) and a `tees` array (one
`{ name, rating, slope }` per tee box), both sourced from a real scorecard
— see each entry's `source`/`teeSource`. When a course has `pars`, selecting
it on the entry form fills in every hole's par automatically and locks the
Par field so it can't be fat-fingered; courses without verified `pars` (and
the "Other / not listed" option) leave Par editable, defaulting to 4. Edit
this file to add, remove, correct, or reorder courses — and to add `pars`/
`tees` for any course you've confirmed the data for.

The admin dashboard's round editor never locks Par, but picking a course
there still fills in that course's real pars for you (leaving them
editable) — it just updates the Par column in place, so anything already
typed in Score/Putts/etc. is left alone.

Similarly, the Tees dropdown lists a course's verified tee boxes (showing
each one's rating/slope); picking one fills in Course Rating and Slope
Rating for that round automatically. Picking "Other / not listed" (or a
course with no verified tees) reveals manual Tee Name / Course Rating /
Slope Rating fields instead — rating and slope are optional everywhere, but
a round without them can't get a score differential (see below).

Par 3s never have a fairway to hit: the Fairway Hit/Miss control is hidden
entirely (not just grayed out) for any hole marked par 3, on both the entry
form and the admin editor, and those holes are excluded from the Fairway %
calculation.

## Score differential

When a round has a Course Rating and Slope Rating (from picking a verified
tee, or typed in manually), the app computes the standard USGA-style score
differential: `(113 / Slope Rating) × (score − Course Rating)`. This
normalizes a round for how hard the tee actually played, so it's more
comparable across different courses than raw score — a 90 at a tough course
can be a better round than an 85 at an easy one. It's shown as its own
field ("Differential" / "Avg Differential") everywhere scoring average
shows up, never in place of it. Rounds without a rating/slope on file just
show "—" for differential and are excluded from the average (not treated
as 0). Tournament rounds count double toward average differential, the
same as they do for average score.

## Data tracked per round

For each hole: par, score, fairway hit (skipped for par 3s), green in
regulation, putts, and penalty strokes.

From that, the app computes (per player and for the whole team): scoring
average, fairway %, GIR %, putting average, and counts of eagles, birdies,
pars, bogeys, double bogeys, and worse-than-double.

### Entering just the totals instead of hole-by-hole

Both the player entry form and the admin round editor have a toggle: "Hole
by hole" (the default) or "Just the totals." Totals mode asks for the round
total score and par (required) plus optional fairways hit/attempted, GIR,
putts, and penalty strokes — no 18-row table. It's meant for a round played
without detailed tracking, or entered well after the fact.

Since there's no hole-by-hole detail to classify, totals mode also has its
own optional Eagles/Birdies/Pars/Bogeys/Doubles/Worse-than-Double count
fields — these can't be inferred from just the total score, so if you want
them to show up in the eagle/birdie/par/bogey/double/worse breakdown, enter
them directly. A running "Holes accounted for: X of N" line under those
fields is just a self-check (it doesn't block submission if the counts
don't add up to holes played — someone might genuinely not remember every
hole).

A totals-only round counts normally toward scoring average, score
differential, fairway %, GIR %, putting average, and penalties. These
rounds show a "Totals" badge alongside their date wherever rounds are
listed.

Each player also has a Sex (Boy or Girl), set when they're added and
editable afterward from their detail view in the admin dashboard.

## Roster sorting and grouping

The admin Roster (and Team Totals) is split into separate tables — Boys,
Girls, and (if any player doesn't have a Sex set yet) Sex Not Set — each
independently populated but sharing one sort setting. Click any Roster
column header (name, rounds, scoring average, fairway %, GIR %, putts,
birdies+, doubles, worse, status) to sort by it, click again to reverse
direction. Players with no data for that column (e.g. no rounds logged yet)
always sort to the bottom.

## Seasons ("Years")

The whole admin dashboard — Team Totals, Roster stats, and each player's
round history — is scoped to one season at a time via the **Season** card
at the top. The player roster itself (names, links/tokens) is shared across
every season; only rounds are tagged to one, so returning players never
need a new link.

- **Viewing Year** switches which season's rounds the rest of the dashboard
  reflects. It doesn't change where new rounds go — that's controlled by
  whichever season is marked "(Current)".
- **Create New Season** adds a new one and immediately makes it current, so
  players' own submissions (and admin's "Add Round") start going there.
  Players never see a season picker — their own dashboard always shows just
  the current season.
- **Make This the Current Season** lets you switch which season is current
  without creating a new one (e.g. to go back to backfilling last season).
- The admin round editor has its own **Season** field so you can add or
  move a specific round into a different season than whatever's currently
  selected — handy for correcting or backfilling historical data.
- Deleting a player removes their rounds from every season, not just the
  one you're viewing.

## Tournament rounds count double toward scoring average

The round entry form (and the admin round editor) has a "This was a
tournament round" checkbox. When checked, that round's strokes count twice
when computing scoring average — everywhere scoring average shows up
(player stats, roster, team totals, sorting) — while every other stat
(fairway %, GIR %, putting average, birdie/bogey counts, penalties) is
unaffected and uses the round normally. Tournament rounds are called out
with a "Tournament" badge next to the date wherever rounds are listed.

## Coaching Focus (automated advice)

Each player's detail view includes a "Coaching Focus" list — rule-of-thumb
callouts generated from their stats (putting average, fairway %, GIR %,
rate of double-bogeys-or-worse, penalty strokes per hole) meant for a coach
to relay in person, not shown to the player directly. The thresholds
(`Stats.generateAdvice` in `assets/js/stats.js`) are reasonable defaults for
high school golf, not a scientific standard — adjust them if they don't
match how your team coaches. It needs at least 9 holes logged before
offering advice, and says so explicitly if a player is below that.

## Admin capabilities

From the coach dashboard you can, per player: view their season stats, copy
their link, delete them entirely (this also permanently deletes every round
and hole score they've ever submitted — there's no undo), and Add Round —
enter a brand-new round on that player's behalf using the same hole-by-hole
editor as the player's own entry form. Per existing round, you can Edit
(same editor, prefilled with that round's data, with Par always editable)
or Delete.

Every action that talks to the backend (submitting a round, logging in,
adding/deleting a player, saving/deleting a round) shows a spinner on its
button and disables it until the request finishes — `UI.withBusy` in
`assets/js/ui.js` is the shared helper behind all of them.

## Local development

This is plain HTML/CSS/JS with no build step — just open the files in a
browser, or serve the repo root with any static file server. Point
`assets/js/config.js` at your deployed Apps Script URL either way (Apps
Script has no meaningful "local" mode).

`.claude/launch.json` runs `.claude/dev-server.py`, a static file server
with caching disabled (so edits show up on refresh instead of serving a
stale cached copy) — used by the Claude Code browser preview, not part of
the deployed site.
