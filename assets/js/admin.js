(function () {
  // Pure logic helpers live in assets/js/admin-logic.js (loaded before this
  // file) so they can be unit- and property-tested with no DOM. Destructure
  // them here for use by the season-selection wiring below.
  const { isCurrentYearRow, resolveViewingYearId, existingPlayerCandidates, importCandidatesFrom, roundCardFields, yearListRows, walkStepValidation, collectNewPlayers, buildConfirmSummary } = window.AdminLogic;

  const els = {
    loginCard: document.getElementById('loginCard'),
    loginForm: document.getElementById('loginForm'),
    loginMessage: document.getElementById('loginMessage'),
    loginBtn: document.getElementById('loginBtn'),
    password: document.getElementById('password'),
    dashboard: document.getElementById('dashboard'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    menuToggle: document.getElementById('menuToggle'),
    menuPanel: document.getElementById('menuPanel'),
    menuDashboard: document.getElementById('menuDashboard'),
    menuYearMgmt: document.getElementById('menuYearMgmt'),
    // Year Management full-screen view (Tasks 5.x). #editYear / #yearWalk are
    // hidden sub-panels reset on close so a fresh open starts on the list;
    // their inner controls are wired by Tasks 6.x / 8.x.
    yearMgmt: document.getElementById('yearMgmt'),
    yearMgmtBack: document.getElementById('yearMgmtBack'),
    yearMgmtMessage: document.getElementById('yearMgmtMessage'),
    addYearBtn: document.getElementById('addYearBtn'),
    yearList: document.getElementById('yearList'),
    editYear: document.getElementById('editYear'),
    // Edit-Year panel controls (Tasks 6.x). Every one of these targets
    // editingYearId, never selectedYearId -- the panel administers a season
    // chosen from the season list, which may differ from the dashboard's
    // viewing season.
    editYearHeading: document.getElementById('editYearHeading'),
    editYearBack: document.getElementById('editYearBack'),
    editYearMessage: document.getElementById('editYearMessage'),
    editYearMakeCurrentBtn: document.getElementById('editYearMakeCurrentBtn'),
    editYearRoster: document.getElementById('editYearRoster'),
    editYearAddExistingMessage: document.getElementById('editYearAddExistingMessage'),
    editYearAddExistingSelect: document.getElementById('editYearAddExistingSelect'),
    editYearAddExistingBtn: document.getElementById('editYearAddExistingBtn'),
    editYearAddPlayerForm: document.getElementById('editYearAddPlayerForm'),
    editYearNewPlayerName: document.getElementById('editYearNewPlayerName'),
    editYearNewPlayerSex: document.getElementById('editYearNewPlayerSex'),
    editYearAddPlayerBtn: document.getElementById('editYearAddPlayerBtn'),
    editYearAddPlayerMessage: document.getElementById('editYearAddPlayerMessage'),
    editYearNewLinkBox: document.getElementById('editYearNewLinkBox'),
    editYearNewLinkInput: document.getElementById('editYearNewLinkInput'),
    editYearCopyLinkBtn: document.getElementById('editYearCopyLinkBtn'),
    yearWalk: document.getElementById('yearWalk'),
    // Add-Year walkthrough controls (Tasks 8.x). All live inside #yearWalk, the
    // hidden sub-view of #yearMgmt. Step content is rendered by JS; navigation
    // (Back/Next/Confirm) is gated by AdminLogic.walkStepValidation.
    yearWalkHeading: document.getElementById('yearWalkHeading'),
    walkProgress: document.getElementById('walkProgress'),
    walkMessage: document.getElementById('walkMessage'),
    walkStep1: document.getElementById('walkStep1'),
    walkStep2: document.getElementById('walkStep2'),
    walkStep3: document.getElementById('walkStep3'),
    walkStep4: document.getElementById('walkStep4'),
    walkLabel: document.getElementById('walkLabel'),
    walkReturningList: document.getElementById('walkReturningList'),
    walkNewPlayers: document.getElementById('walkNewPlayers'),
    walkAddPlayerRow: document.getElementById('walkAddPlayerRow'),
    walkReview: document.getElementById('walkReview'),
    walkBackBtn: document.getElementById('walkBackBtn'),
    walkNextBtn: document.getElementById('walkNextBtn'),
    walkConfirmBtn: document.getElementById('walkConfirmBtn'),
    yearMessage: document.getElementById('yearMessage'),
    yearSelect: document.getElementById('yearSelect'),
    teamTiles: document.getElementById('teamTiles'),
    rosterTable: document.getElementById('rosterTable'),
    playerDetail: document.getElementById('playerDetail'),
    backToRosterTop: document.getElementById('backToRosterTop'),
    backToRosterBottom: document.getElementById('backToRosterBottom'),
    playerDetailName: document.getElementById('playerDetailName'),
    playerDetailLink: document.getElementById('playerDetailLink'),
    copyDetailLinkBtn: document.getElementById('copyDetailLinkBtn'),
    playerDetailTiles: document.getElementById('playerDetailTiles'),
    playerDetailRounds: document.getElementById('playerDetailRounds'),
    removeFromYearBtn: document.getElementById('removeFromYearBtn'),
    deletePlayerBtn: document.getElementById('deletePlayerBtn'),
    playerDetailSexPill: document.getElementById('playerDetailSexPill'),
    playerDetailSexSelect: document.getElementById('playerDetailSexSelect'),
    editSexBtn: document.getElementById('editSexBtn'),
    saveSexBtn: document.getElementById('saveSexBtn'),
    cancelSexBtn: document.getElementById('cancelSexBtn'),
    coachingAdvice: document.getElementById('coachingAdvice'),
    addRoundBtn: document.getElementById('addRoundBtn'),

    editRoundCard: document.getElementById('editRoundCard'),
    editRoundHeading: document.getElementById('editRoundHeading'),
    editRoundForm: document.getElementById('editRoundForm'),
    editRoundMessage: document.getElementById('editRoundMessage'),
    editDate: document.getElementById('editDate'),
    editHolesPlayed: document.getElementById('editHolesPlayed'),
    editCourseSelect: document.getElementById('editCourseSelect'),
    editCourseOtherRow: document.getElementById('editCourseOtherRow'),
    editCourseOther: document.getElementById('editCourseOther'),
    editCourseOtherCity: document.getElementById('editCourseOtherCity'),
    editYearSelect: document.getElementById('editYearSelect'),
    editTeeSelect: document.getElementById('editTeeSelect'),
    editTeeOtherRow: document.getElementById('editTeeOtherRow'),
    editTeeOther: document.getElementById('editTeeOther'),
    editCourseRating: document.getElementById('editCourseRating'),
    editSlopeRating: document.getElementById('editSlopeRating'),
    editIsTournament: document.getElementById('editIsTournament'),
    editNotes: document.getElementById('editNotes'),
    editHoleRows: document.getElementById('editHoleRows'),
    editRunningTotal: document.getElementById('editRunningTotal'),
    editSaveBtn: document.getElementById('editSaveBtn'),
    editCancelBtn: document.getElementById('editCancelBtn'),
    editEntryModeHoles: document.getElementById('editEntryModeHoles'),
    editEntryModeSummary: document.getElementById('editEntryModeSummary'),
    editHoleByHoleSection: document.getElementById('editHoleByHoleSection'),
    editSummarySection: document.getElementById('editSummarySection'),
    editSummaryScore: document.getElementById('editSummaryScore'),
    editSummaryPar: document.getElementById('editSummaryPar'),
    editSummaryPutts: document.getElementById('editSummaryPutts'),
    editSummaryGIR: document.getElementById('editSummaryGIR'),
    editSummaryFairwaysHit: document.getElementById('editSummaryFairwaysHit'),
    editSummaryFairwaysAttempted: document.getElementById('editSummaryFairwaysAttempted'),
    editSummaryPenalties: document.getElementById('editSummaryPenalties'),
    editSummaryEagles: document.getElementById('editSummaryEagles'),
    editSummaryBirdies: document.getElementById('editSummaryBirdies'),
    editSummaryPars: document.getElementById('editSummaryPars'),
    editSummaryBogeys: document.getElementById('editSummaryBogeys'),
    editSummaryDoubles: document.getElementById('editSummaryDoubles'),
    editSummaryWorse: document.getElementById('editSummaryWorse'),
    editSummaryHoleCheck: document.getElementById('editSummaryHoleCheck'),
    editSummaryHoleCheckTotal: document.getElementById('editSummaryHoleCheckTotal')
  };

  const EDIT_SUMMARY_OUTCOME_FIELDS = [
    els.editSummaryEagles, els.editSummaryBirdies, els.editSummaryPars,
    els.editSummaryBogeys, els.editSummaryDoubles, els.editSummaryWorse
  ];

  let currentPlayerToken = null;
  let rosterScrollY = 0;              // window scrollY captured when the player view opens
  let playerViewOpen = false;         // whether the full-screen player view is showing
  let dashScrollY = 0;                // window scrollY captured when the Year Management view opens
  let yearMgmtOpen = false;           // whether the full-screen Year Management view is showing
  let editingRoundId = null;
  let sortKey = 'avg';
  let sortDir = 'asc';
  let selectedYearId = null;
  // The season currently being administered in the Edit-Year panel (Tasks 6.x).
  // DISTINCT from selectedYearId (which drives the main dashboard): the coach
  // can edit a season other than the one they're viewing, so every Edit-Year
  // action targets editingYearId, not selectedYearId.
  let editingYearId = null;
  // The Add-Year walkthrough model (Tasks 8.x). null when the walkthrough is
  // not active; reset to a fresh object by startYearWalk(). Shape mirrors the
  // design's walkthrough State model:
  //   { step:1, label:'', returningTokens:[], newPlayers:[{name,sex}], result:null }
  // Steps 2 and 3 are skippable; confirmation is gated only by a valid label
  // (via AdminLogic.walkStepValidation). Lives entirely inside #yearWalk, an
  // in-view sub-panel of Year Management -- no history entry is pushed for step
  // navigation (mirrors how Edit-Year is internal to the view).
  let walk = null;

  // Persist the last-viewed season across sessions. All access is guarded so a
  // disabled/unavailable localStorage (private mode, blocked storage, quota)
  // degrades to the in-memory fallback instead of breaking dashboard load.
  const VIEWING_SEASON_STORE_KEY = 'golf.admin.viewingYearId';
  let storageOk = true;               // flips false on first failure; drives Req 3.7 notice

  const Store = {
    readViewingYearId() {
      try {
        return localStorage.getItem(VIEWING_SEASON_STORE_KEY);
      } catch (_) {
        storageOk = false;
        return null;
      }
    },
    writeViewingYearId(yearId) {
      try {
        if (yearId) localStorage.setItem(VIEWING_SEASON_STORE_KEY, yearId);
      } catch (_) {
        storageOk = false;
      }
    }
  };

  let session = sessionStorage.getItem('adminSession') || null;
  let data = { players: [], rounds: [], holeScores: [], years: [], playerYears: [] };

  // Rounds belonging to whichever year is currently selected in the Season
  // picker -- everything the dashboard shows (Team Totals, Roster, player
  // detail) is scoped to this, not the full all-years dataset in `data`.
  function yearRounds() {
    return data.rounds.filter((r) => r.Year === selectedYearId);
  }

  // Which players are actually rostered for a given year -- a player who
  // exists globally (e.g. a graduated senior, or someone who sat out a
  // season) doesn't show up at all for a year they're not rostered for.
  function rosterTokensForYear(yearId) {
    return new Set(data.playerYears.filter((py) => py.YearID === yearId).map((py) => py.PlayerToken));
  }

  function rosterPlayersForYear(yearId) {
    const tokens = rosterTokensForYear(yearId);
    return data.players.filter((p) => tokens.has(p.Token));
  }

  // `isCurrentYearRow` is now provided by AdminLogic (destructured at the top
  // of this IIFE); the previous local copy was removed to avoid duplication.

  // Repopulates the Season selector from data.years. Resolves the initial
  // selection from persisted state via resolveViewingYearId, following the
  // stored -> current -> newest -> null precedence chain (Reqs 3.2-3.4, 3.6).
  function populateYearSelect() {
    // A stale Apps Script deployment (one that predates season support)
    // returns no `years` key at all, and a freshly-migrated-but-empty sheet
    // returns []. Either way, mapping over it silently yields a blank
    // dropdown with no explanation -- surface an actionable message instead.
    const years = Array.isArray(data.years) ? data.years : [];
    if (!years.length) {
      els.yearSelect.innerHTML = '';
      els.yearSelect.value = '';
      selectedYearId = null;
      els.yearMessage.innerHTML = '<div class="error">No seasons loaded. If you have a season in your sheet, your Apps Script Web App is likely running an older version - redeploy the latest backend (Deploy &rarr; Manage deployments &rarr; New version), and if needed run migrateAddYears() and migrateAddPlayerYears() from the Apps Script editor.</div>';
      return;
    }
    const sorted = [...years].sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    els.yearSelect.innerHTML = sorted.map((y) =>
      `<option value="${escapeHtml(y.YearID)}">${escapeHtml(y.Label)}${isCurrentYearRow(y) ? ' (Current)' : ''}</option>`
    ).join('');
    // Read the last-viewed season once and resolve the initial selection via the
    // pure precedence resolver: stored -> current -> newest -> null (Reqs 3.2-3.4,
    // 3.6). The resolver never returns an id absent from `years`.
    const storedId = Store.readViewingYearId();
    selectedYearId = resolveViewingYearId(data.years, storedId, isCurrentYearRow);
    els.yearSelect.value = selectedYearId || '';
    // If the persisted read failed, `storageOk` flipped false during the
    // readViewingYearId() call above and the resolver already fell back to
    // current/newest -- load is never blocked. Surface a non-blocking notice
    // so the user understands why their last-viewed season wasn't restored
    // (Req 3.7). Only shown when seasons exist (the empty-state message owns
    // #yearMessage otherwise, and that path returns before reaching here).
    if (!storageOk && (data.years || []).length) {
      els.yearMessage.innerHTML =
        '<div class="muted">Couldn\u2019t restore your last-viewed season; showing the current season.</div>';
    }
  }

  // Populates the round editor's own Year field (separate from the page-level
  // Season selector above) -- defaults to `yearId` if given, else whatever
  // year is currently selected in the picker.
  function populateEditYearSelect(yearId) {
    const sorted = [...(data.years || [])].sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    els.editYearSelect.innerHTML = sorted.map((y) =>
      `<option value="${escapeHtml(y.YearID)}">${escapeHtml(y.Label)}${isCurrentYearRow(y) ? ' (Current)' : ''}</option>`
    ).join('');
    els.editYearSelect.value = yearId || selectedYearId || '';
  }

  function playerLink(token) {
    return new URL('player.html?token=' + encodeURIComponent(token), window.location.href).toString();
  }

  // Populates a <select> with the Idaho course list plus an "Other" option,
  // and preselects `selected` if it matches a listed course (falls back to
  // "Other" otherwise, e.g. for a free-typed course name).
  function populateCourseSelect(selectEl, selected) {
    const sorted = [...IDAHO_COURSES].sort((a, b) => a.name.localeCompare(b.name));
    const options = sorted.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${escapeHtml(c.city)})</option>`);
    selectEl.innerHTML = options.join('') +
      `<option value="${OTHER_COURSE_VALUE}">Other / not listed (enter manually)</option>`;
    // Omit `selected` (e.g. adding a brand-new round) to leave the browser's
    // natural first-option default in place, same as the player entry form.
    if (selected !== undefined) {
      const match = sorted.find((c) => c.name === selected);
      selectEl.value = match ? selected : OTHER_COURSE_VALUE;
    }
  }

  // The matching IDAHO_COURSES entry for the current edit-form selection, or
  // null if "Other" is selected or the course has no verified par data.
  function editSelectedCourseData() {
    if (els.editCourseSelect.value === OTHER_COURSE_VALUE) return null;
    return IDAHO_COURSES.find((c) => c.name === els.editCourseSelect.value) || null;
  }

  // Repopulates the Tees dropdown from the currently selected course's
  // verified tee list. `selectTeeName`, if given, preselects the tee that
  // matches by name (used when opening an existing round for editing);
  // otherwise leaves the browser's natural first-option default.
  function populateEditTeeSelect(selectTeeName) {
    const courseData = editSelectedCourseData();
    const tees = (courseData && courseData.tees) || [];
    const options = tees.map((t, i) =>
      `<option value="${i}">${escapeHtml(t.name)} (Rating ${t.rating} / Slope ${t.slope})</option>`);
    els.editTeeSelect.innerHTML = options.join('') +
      `<option value="${OTHER_TEE_VALUE}">Other / not listed (enter manually)</option>`;
    if (selectTeeName != null) {
      const idx = tees.findIndex((t) => t.name === selectTeeName);
      els.editTeeSelect.value = idx === -1 ? OTHER_TEE_VALUE : String(idx);
    }
    syncEditTeeOtherVisibility();
  }

  function syncEditTeeOtherVisibility() {
    els.editTeeOtherRow.classList.toggle('hidden', els.editTeeSelect.value !== OTHER_TEE_VALUE);
  }

  function editSelectedTee() {
    const courseData = editSelectedCourseData();
    if (els.editTeeSelect.value !== OTHER_TEE_VALUE) {
      const tee = courseData && courseData.tees && courseData.tees[Number(els.editTeeSelect.value)];
      if (tee) return { name: tee.name, rating: tee.rating, slope: tee.slope };
    }
    return { name: els.editTeeOther.value.trim(), rating: els.editCourseRating.value, slope: els.editSlopeRating.value };
  }

  function escapeHtml(s) {
    return (s || '').toString().replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatDate(d) {
    // Parse "YYYY-MM-DD" as local calendar date, not UTC -- new Date("YYYY-MM-DD")
    // parses as UTC midnight, which renders as the previous day in timezones
    // west of UTC.
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
    if (!m) return d;
    const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Google Sheets often round-trips a "Date" column as a real Date object,
  // which comes back from the API as a full ISO datetime string
  // ("2026-08-20T06:00:00.000Z") rather than the plain "YYYY-MM-DD" a
  // native <input type="date"> requires -- assigning the full string just
  // silently empties the field. Always go through this before setting one.
  function toDateInputValue(d) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
    return m ? m[0] : '';
  }

  async function login(password) {
    const res = await Api.post({ action: 'adminLogin', password });
    session = res.session;
    sessionStorage.setItem('adminSession', session);
  }

  async function loadData() {
    data = await Api.get({ action: 'adminData', session });
  }

  function statTiles(container, tiles) {
    container.innerHTML = tiles.map(([label, value]) => `
      <div class="stat-tile"><div class="value">${value}</div><div class="label">${label}</div></div>
    `).join('');
  }

  function renderTeamTiles() {
    const holesByRound = Stats.groupBy(data.holeScores, 'RoundID');
    const roundsByPlayer = Stats.groupBy(yearRounds(), 'PlayerToken');
    const rosterPlayers = rosterPlayersForYear(selectedYearId);

    const groups = [
      { title: 'Boys', players: rosterPlayers.filter((p) => p.Sex === 'Boy') },
      { title: 'Girls', players: rosterPlayers.filter((p) => p.Sex === 'Girl') },
      { title: 'Sex Not Set', players: rosterPlayers.filter((p) => p.Sex !== 'Boy' && p.Sex !== 'Girl') }
    ].filter((g) => g.players.length);

    if (!groups.length) {
      els.teamTiles.innerHTML = '<p class="muted">No players rostered for this season yet.</p>';
      return;
    }

    els.teamTiles.innerHTML = groups.map((g) => {
      const rounds = g.players.flatMap((p) => roundsByPlayer[p.Token] || []);
      let agg = Stats.withRates(Stats.aggregateRounds(rounds, holesByRound));
      agg = Stats.applyTournamentWeighting(agg, rounds, holesByRound);
      const avgDiff = Stats.averageDifferential(rounds, holesByRound);
      const tilesHtml = [
        ['Players', g.players.length],
        ['Rounds Logged', rounds.length],
        ['Scoring Avg /18', Stats.fmtAvg(agg.scoringAvgPer18)],
        ['Avg Differential', Stats.fmtDiff(avgDiff)],
        ['Fairways %', Stats.fmtPct(agg.fairwayPct)],
        ['GIR %', Stats.fmtPct(agg.girPct)],
        ['Putts /18', Stats.fmtAvg(agg.puttingAvgPer18)]
      ].map(([label, value]) => `<div class="stat-tile"><div class="value">${value}</div><div class="label">${label}</div></div>`).join('');
      return `<h3>${escapeHtml(g.title)} Team Totals</h3><div class="stat-grid" style="margin-bottom:1rem">${tilesHtml}</div>`;
    }).join('');
  }

  // Column definitions for the sortable roster table: label shown in the
  // header, and how to pull a comparable value out of a computed row.
  // No Sex column here -- the roster is already split into Boys/Girls
  // tables, so it'd be redundant.
  const ROSTER_COLUMNS = [
    { key: 'name', label: 'Name', value: (row) => row.player.Name.toLowerCase() },
    { key: 'rounds', label: 'Rounds', value: (row) => row.rounds.length },
    { key: 'avg', label: 'Avg /18', value: (row) => row.agg.scoringAvgPer18 },
    { key: 'diff', label: 'Avg Diff', value: (row) => row.avgDiff },
    { key: 'fairway', label: 'Fairway %', value: (row) => row.agg.fairwayPct },
    { key: 'gir', label: 'GIR %', value: (row) => row.agg.girPct },
    { key: 'putts', label: 'Putts /18', value: (row) => row.agg.puttingAvgPer18 },
    { key: 'birdies', label: 'Birdies+', value: (row) => row.agg.birdies + row.agg.eagles },
    { key: 'doubles', label: 'Doubles', value: (row) => row.agg.doubles },
    { key: 'worse', label: 'Worse', value: (row) => row.agg.worse }
  ];

  function sortRows(rows) {
    const col = ROSTER_COLUMNS.find((c) => c.key === sortKey) || ROSTER_COLUMNS[0];
    const sorted = [...rows].sort((a, b) => {
      const va = col.value(a);
      const vb = col.value(b);
      const aMissing = va == null || va === '';
      const bMissing = vb == null || vb === '';
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1; // rows with no data always sort last
      if (bMissing) return -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }

  function rosterTableHtml(rows) {
    const sorted = sortRows(rows);
    const headerHtml = ROSTER_COLUMNS.map((c) => {
      const arrow = sortKey === c.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
      return `<th class="clickable" data-sort-key="${c.key}">${c.label}${arrow}</th>`;
    }).join('');
    return `<table>
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${sorted.map(({ player, rounds, agg, avgDiff }) => `
        <tr class="clickable" data-token="${escapeHtml(player.Token)}">
          <td>${escapeHtml(player.Name)}</td>
          <td>${rounds.length}</td>
          <td>${Stats.fmtAvg(agg.scoringAvgPer18)}</td>
          <td>${Stats.fmtDiff(avgDiff)}</td>
          <td>${Stats.fmtPct(agg.fairwayPct)}</td>
          <td>${Stats.fmtPct(agg.girPct)}</td>
          <td>${Stats.fmtAvg(agg.puttingAvgPer18)}</td>
          <td>${agg.birdies + agg.eagles}</td>
          <td>${agg.doubles}</td>
          <td>${agg.worse}</td>
        </tr>
      `).join('')}</tbody>
    </table>`;
  }

  // Mobile-only presentation of the same roster rows: one collapsible card per
  // player, emitted alongside the table (visibility is controlled entirely by a
  // CSS media query, no viewport-detection JS). Uses the SAME `rows` data and the
  // SAME Stats.fmt* / escapeHtml helpers as rosterTableHtml() so formatted card
  // values equal the table-cell values.
  function rosterCardsHtml(rows) {
    const sorted = sortRows(rows);
    return sorted.map(({ player, rounds, agg, avgDiff }) => {
      return `
        <details class="roster-card">
          <summary class="roster-card-summary">
            <span class="roster-card-name">${escapeHtml(player.Name)}</span>
            <span class="roster-card-meta">
              <span class="roster-card-stat"><span class="roster-card-label">Avg /18</span> ${Stats.fmtAvg(agg.scoringAvgPer18)}</span>
              <span class="roster-card-stat"><span class="roster-card-label">Rounds</span> ${rounds.length}</span>
            </span>
          </summary>
          <div class="roster-card-body">
            <div class="roster-card-row"><span class="roster-card-label">Avg Diff</span><span class="roster-card-value">${Stats.fmtDiff(avgDiff)}</span></div>
            <div class="roster-card-row"><span class="roster-card-label">Fairway %</span><span class="roster-card-value">${Stats.fmtPct(agg.fairwayPct)}</span></div>
            <div class="roster-card-row"><span class="roster-card-label">GIR %</span><span class="roster-card-value">${Stats.fmtPct(agg.girPct)}</span></div>
            <div class="roster-card-row"><span class="roster-card-label">Putts /18</span><span class="roster-card-value">${Stats.fmtAvg(agg.puttingAvgPer18)}</span></div>
            <div class="roster-card-row"><span class="roster-card-label">Birdies+</span><span class="roster-card-value">${agg.birdies + agg.eagles}</span></div>
            <div class="roster-card-row"><span class="roster-card-label">Doubles</span><span class="roster-card-value">${agg.doubles}</span></div>
            <div class="roster-card-row"><span class="roster-card-label">Worse</span><span class="roster-card-value">${agg.worse}</span></div>
            <button type="button" class="roster-card-detail secondary" data-token="${escapeHtml(player.Token)}">View full details</button>
          </div>
        </details>
      `;
    }).join('');
  }

  function renderRoster() {
    const holesByRound = Stats.groupBy(data.holeScores, 'RoundID');
    const roundsByPlayer = Stats.groupBy(yearRounds(), 'PlayerToken');
    const rosterPlayers = rosterPlayersForYear(selectedYearId);

    if (!rosterPlayers.length) {
      els.rosterTable.innerHTML = '<p class="muted">No players rostered for this season yet — add one above, or add an existing player to this season.</p>';
      return;
    }

    const rows = rosterPlayers.map((p) => {
      const rounds = roundsByPlayer[p.Token] || [];
      let agg = Stats.withRates(Stats.aggregateRounds(rounds, holesByRound));
      agg = Stats.applyTournamentWeighting(agg, rounds, holesByRound);
      const avgDiff = Stats.averageDifferential(rounds, holesByRound);
      return { player: p, rounds, agg, avgDiff };
    });

    const groups = [
      { title: 'Boys', rows: rows.filter((r) => r.player.Sex === 'Boy') },
      { title: 'Girls', rows: rows.filter((r) => r.player.Sex === 'Girl') },
      { title: 'Sex Not Set', rows: rows.filter((r) => r.player.Sex !== 'Boy' && r.player.Sex !== 'Girl') }
    ].filter((g) => g.rows.length);

    els.rosterTable.innerHTML = groups.map((g) => `
      <h3>${escapeHtml(g.title)} (${g.rows.length})</h3>
      <div class="table-scroll" style="margin-bottom:1rem">${rosterTableHtml(g.rows)}</div>
      <div class="roster-cards" style="margin-bottom:1rem">${rosterCardsHtml(g.rows)}</div>
    `).join('');

    els.rosterTable.querySelectorAll('th[data-sort-key]').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.sortKey;
        if (sortKey === key) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = key;
          sortDir = 'asc';
        }
        renderRoster();
      });
    });
    els.rosterTable.querySelectorAll('tr[data-token]').forEach((tr) => {
      tr.addEventListener('click', () => showPlayerDetail(tr.dataset.token));
    });
    // Mobile card "View full details" control: opens the same player detail view
    // desktop opens on row click. The native <summary> toggle handles expand/
    // collapse on its own and must NOT navigate, so it gets no listener here.
    els.rosterTable.querySelectorAll('.roster-card-detail').forEach((btn) => {
      btn.addEventListener('click', () => showPlayerDetail(btn.dataset.token));
    });
  }

  function showPlayerDetail(token) {
    const player = data.players.find((p) => p.Token === token);
    if (!player) return;
    currentPlayerToken = token;
    const rounds = (Stats.groupBy(yearRounds(), 'PlayerToken')[token] || [])
      .sort((a, b) => new Date(b.Date) - new Date(a.Date));
    const holesByRound = Stats.groupBy(data.holeScores, 'RoundID');
    let agg = Stats.withRates(Stats.aggregateRounds(rounds, holesByRound));
    agg = Stats.applyTournamentWeighting(agg, rounds, holesByRound);
    const avgDiff = Stats.averageDifferential(rounds, holesByRound);

    els.playerDetailName.textContent = player.Name;
    els.playerDetailLink.value = playerLink(player.Token);
    els.playerDetailSexPill.textContent = player.Sex || 'Sex not set';
    els.playerDetailSexPill.classList.remove('hidden');
    els.playerDetailSexSelect.classList.add('hidden');
    els.editSexBtn.classList.remove('hidden');
    els.saveSexBtn.classList.add('hidden');
    els.cancelSexBtn.classList.add('hidden');

    const advice = Stats.generateAdvice(agg);
    els.coachingAdvice.innerHTML = advice.map((a) => `<li><strong>${escapeHtml(a.area)}:</strong> ${escapeHtml(a.tip)}</li>`).join('');

    statTiles(els.playerDetailTiles, [
      ['Rounds', rounds.length],
      ['Avg /18', Stats.fmtAvg(agg.scoringAvgPer18)],
      ['Avg Differential', Stats.fmtDiff(avgDiff)],
      ['Fairway %', Stats.fmtPct(agg.fairwayPct)],
      ['GIR %', Stats.fmtPct(agg.girPct)],
      ['Putts /18', Stats.fmtAvg(agg.puttingAvgPer18)],
      ['Eagles', agg.eagles],
      ['Birdies', agg.birdies],
      ['Pars', agg.pars],
      ['Bogeys', agg.bogeys],
      ['Doubles', agg.doubles],
      ['Worse than Dbl', agg.worse],
      ['Penalty Strokes', agg.totalPenalties]
    ]);

    if (!rounds.length) {
      els.playerDetailRounds.innerHTML = '<p class="muted">No rounds entered yet.</p>';
    } else {
      // Compute each round's display values once, then render them into BOTH the
      // desktop table (unchanged) and a mobile `.round-cards` block. The CSS in
      // styles.css (scoped to #playerDetailRounds) hides the table and shows the
      // cards at/below the 640px breakpoint, and the inverse above it, so only one
      // layout is visible at a time (Reqs 5.1, 5.2, 9.1).
      const roundViews = rounds.map((r) => {
        const holes = holesByRound[r.RoundID] || [];
        const { score } = Stats.roundScoreAndPar(r, holes);
        const putts = Stats.roundPutts(r, holes);
        const diff = Stats.scoreDifferential(r, holes);
        const badges = [
          Stats.isTournamentRound(r) ? '<span class="pill">Tournament</span>' : '',
          Stats.isSummaryRound(r) ? '<span class="pill">Totals</span>' : ''
        ].filter(Boolean).join(' ');
        // RAW values passed to the pure (non-escaping) mapper; every value is
        // escaped at render time below, exactly like the table cells (design →
        // Security Considerations). Score/Putts may be null → mapper yields '—'.
        return {
          r: r,
          badges: badges,
          date: formatDate(r.Date),
          fields: roundCardFields({
            date: formatDate(r.Date),
            course: r.Course,
            tees: r.Tees,
            holesPlayed: r.HolesPlayed,
            score: score,
            diff: Stats.fmtDiff(diff),
            putts: putts
          }),
          score: score,
          diff: diff,
          putts: putts
        };
      });

      const tableHtml = `<table>
        <thead><tr><th>Date</th><th>Course</th><th>Tees</th><th>Holes</th><th>Score</th><th>Diff</th><th>Putts</th><th colspan="2"></th></tr></thead>
        <tbody>${roundViews.map((v) => {
          const r = v.r;
          return `<tr>
            <td>${v.date} ${v.badges}</td>
            <td>${escapeHtml(r.Course)}</td>
            <td>${escapeHtml(r.Tees)}</td>
            <td>${r.HolesPlayed}</td>
            <td>${v.score == null ? '—' : v.score}</td>
            <td>${Stats.fmtDiff(v.diff)}</td>
            <td>${v.putts == null ? '—' : v.putts}</td>
            <td><button type="button" class="secondary edit-round" data-round="${escapeHtml(r.RoundID)}">Edit</button></td>
            <td><button type="button" class="danger delete-round" data-round="${escapeHtml(r.RoundID)}">Delete</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;

      const cardsHtml = `<div class="round-cards">${roundViews.map((v) => {
        const r = v.r;
        // Date is shown once in the card head (plain date + trusted badge pills);
        // the mapper's Date row is skipped below to avoid duplicating it.
        const rows = v.fields
          .filter((f) => f.label !== 'Date')
          .map((f) => `<div class="round-card-row"><span class="round-card-label">${escapeHtml(f.label)}</span><span class="round-card-value">${escapeHtml(f.value)}</span></div>`)
          .join('');
        return `<div class="round-card">
          <div class="round-card-head">${v.date} ${v.badges}</div>
          ${rows}
          <div class="round-card-actions">
            <button type="button" class="secondary edit-round" data-round="${escapeHtml(r.RoundID)}">Edit</button>
            <button type="button" class="danger delete-round" data-round="${escapeHtml(r.RoundID)}">Delete</button>
          </div>
        </div>`;
      }).join('')}</div>`;

      els.playerDetailRounds.innerHTML = tableHtml + cardsHtml;
      // querySelectorAll matches BOTH the table and card buttons (shared classes),
      // so each round's Edit/Delete works in whichever layout is visible. Each
      // button gets exactly one listener (no double-binding).
      els.playerDetailRounds.querySelectorAll('.delete-round').forEach((btn) => {
        btn.addEventListener('click', () => deleteRound(btn.dataset.round, btn));
      });
      els.playerDetailRounds.querySelectorAll('.edit-round').forEach((btn) => {
        btn.addEventListener('click', () => openEditRound(btn.dataset.round));
      });
    }

    els.playerDetail.classList.remove('hidden');
    els.editRoundCard.classList.add('hidden');
    enterPlayerView();
  }

  // Enter the full-screen player-view visual + history state. Idempotent: if the
  // view is already open, it returns without pushing another history entry so
  // re-showing the detail after a mutation adds no duplicate Back entry.
  function enterPlayerView() {
    if (playerViewOpen) return;
    rosterScrollY = window.scrollY;                 // capture exact roster position
    els.dashboard.classList.add('player-view-open');
    playerViewOpen = true;
    window.scrollTo(0, 0);                           // player view opens at the top
    history.pushState({ adminPlayerView: true }, '', location.href);
  }

  // Close the player view and return to the roster at the captured scroll position.
  // `fromPopstate` is true when invoked by the popstate handler, in which case we
  // must NOT call history.back() again. The playerViewOpen guard makes the on-page
  // Back link's history.back() -> popstate a no-op, so close runs exactly once.
  function closePlayerDetail(fromPopstate) {
    if (!playerViewOpen) return;                     // guards double-trigger
    els.dashboard.classList.remove('player-view-open');
    els.editRoundCard.classList.add('hidden');       // ensure edit card never lingers
    playerViewOpen = false;
    if (!fromPopstate) {
      // On-page Back link: pop our pushed entry. The resulting popstate is ignored
      // because playerViewOpen is already false.
      history.back();
    }
    // Restore roster scroll AFTER the cards are visible again so the target offset
    // exists in the layout.
    window.scrollTo(0, rosterScrollY);
  }

  // Browser/gesture Back handler. Only closes when the player view is open; the
  // playerViewOpen guard means our own consumed entry (from an on-page Back link's
  // history.back()) and normal roster navigation are left untouched.
  function onPopState(event) {
    // Shared dispatch for both full-screen views. At most one is ever open (the
    // single-open invariant), so only one branch fires. fromPopstate = true so
    // the close path does NOT call history.back() again.
    if (playerViewOpen) {
      closePlayerDetail(true);
    } else if (yearMgmtOpen) {
      closeYearMgmt(true);
    }
  }

  // --- Year Management full-screen view (Reqs 3.1-3.8) -----------------------
  // Mirrors the player-view controller above: a separate `yearMgmtOpen` guard,
  // its own scroll capture (`dashScrollY`, kept distinct from `rosterScrollY`
  // so the two views never clobber each other's restore point), a single
  // pushState on open, and history.back() on close only when not driven by
  // popstate. Enters at the top and renders the season list.
  function openYearMgmt() {
    if (yearMgmtOpen) return;                        // idempotent: no duplicate history entry
    // Single-open invariant: never leave both `player-view-open` and
    // `year-mgmt-open` set. If the player view is open, close it first
    // (fromPopstate=false) so it consumes its own pushed entry and restores its
    // scroll BEFORE we push ours and capture the (now-restored) dashboard scroll.
    if (playerViewOpen) closePlayerDetail(false);
    dashScrollY = window.scrollY;                    // capture exact dashboard position
    els.yearMgmt.classList.remove('hidden');
    els.dashboard.classList.add('year-mgmt-open');
    yearMgmtOpen = true;
    window.scrollTo(0, 0);                           // year mgmt opens at the top
    history.pushState({ adminYearMgmt: true }, '', location.href);
    renderYearList();
  }

  // Close the Year Management view and return to the Main_Dashboard at the
  // captured scroll position. `fromPopstate` is true when invoked by the
  // popstate handler, in which case we must NOT call history.back() again. The
  // yearMgmtOpen guard makes the on-page Back control's history.back() ->
  // popstate a no-op, so close runs exactly once.
  function closeYearMgmt(fromPopstate) {
    if (!yearMgmtOpen) return;                        // guards double-trigger
    els.dashboard.classList.remove('year-mgmt-open');
    els.yearMgmt.classList.add('hidden');
    // Reset the in-view sub-panels so the next open starts clean on the season
    // list (their inner state is wired by Tasks 6.x / 8.x).
    if (els.editYear) els.editYear.classList.add('hidden');
    if (els.yearWalk) els.yearWalk.classList.add('hidden');
    yearMgmtOpen = false;
    if (!fromPopstate) {
      // On-page Back: pop our pushed entry. The resulting popstate is ignored
      // because yearMgmtOpen is already false.
      history.back();
    }
    // Restore dashboard scroll AFTER the cards are visible again so the target
    // offset exists in the layout.
    window.scrollTo(0, dashScrollY);
  }

  // Render the season list into #yearList from the pure yearListRows view model
  // (newest-first, canMakeCurrent === !isCurrent). Each row shows the label, a
  // "(Current)" marker, an Edit control, and a Make-current control only for
  // non-current seasons (Reqs 4.1-4.7).
  function renderYearList() {
    const rows = yearListRows(data.years, isCurrentYearRow);
    if (!rows.length) {
      els.yearList.innerHTML = '<p class="muted">No seasons yet.</p>';
      return;
    }
    els.yearList.innerHTML = rows.map((row) => `
      <div class="field-row" data-year-row="${escapeHtml(row.yearId)}" style="align-items:center; margin-bottom:0.5rem">
        <div class="field" style="margin-bottom:0; flex:1">
          ${escapeHtml(row.label)}${row.isCurrent ? ' <span class="pill">Current</span>' : ''}
        </div>
        <div class="field" style="margin-bottom:0">
          <button type="button" class="secondary edit-year" data-year-id="${escapeHtml(row.yearId)}">Edit</button>
        </div>
        ${row.canMakeCurrent ? `
        <div class="field" style="margin-bottom:0">
          <button type="button" class="make-current-year" data-year-id="${escapeHtml(row.yearId)}">Make current</button>
        </div>` : ''}
      </div>
    `).join('');

    // Make-current: target this row's YearID, then refresh and re-render the
    // list (Req 4.6).
    els.yearList.querySelectorAll('.make-current-year').forEach((btn) => {
      btn.addEventListener('click', async () => {
        els.yearMgmtMessage.innerHTML = '';
        const yearId = btn.dataset.yearId;
        try {
          await UI.withBusy(btn, 'Saving…', () =>
            Api.post({ action: 'setCurrentYear', session, yearId }));
          await refresh();
          renderYearList();
          els.yearMgmtMessage.innerHTML = '<div class="success">Updated the current season.</div>';
        } catch (err) {
          els.yearMgmtMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
        }
      });
    });

    // Edit: opens the Edit-Year panel scoped to this row's YearID. openEditYear
    // is provided by Task 6.1; guard so this list-level rendering lands
    // independently (matches the Task 4.1 menu-wiring pattern).
    els.yearList.querySelectorAll('.edit-year').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (typeof openEditYear === 'function') openEditYear(btn.dataset.yearId);
        // else: Edit-Year controller (Task 6.1) not present yet -- no-op.
      });
    });
  }

  // --- Edit-Year panel (Reqs 5.1-5.11) ---------------------------------------
  // An in-view sub-panel of the Year Management view. It administers ONE
  // explicitly-selected season, tracked in `editingYearId` -- kept separate
  // from `selectedYearId` so the coach can edit a season other than the one
  // the dashboard is viewing. Every action below targets editingYearId. This
  // panel is internal to the Year Management view: opening/closing it pushes NO
  // history entry (one browser-Back returns straight to the main dashboard),
  // matching how the round editor is internal to the player view.

  // Open the Edit-Year panel for `yearId`: record it as editingYearId, focus
  // the panel within the Year Management view (hide the season list + Add-Year
  // button so the edit panel is the sole focus), and render its sub-regions
  // (Reqs 5.1, 5.2). No-ops if `yearId` isn't a known season.
  function openEditYear(yearId) {
    const year = (data.years || []).find((y) => y.YearID === yearId);
    if (!year) return;                               // unknown season: no-op
    editingYearId = yearId;
    // Focus the panel: hide the list + Add-New-Year control while editing so
    // the edit panel reads as the sole content of the Year Management view.
    // closeEditYear reverses this.
    els.yearList.classList.add('hidden');
    els.addYearBtn.classList.add('hidden');
    els.editYear.classList.remove('hidden');
    els.editYearHeading.textContent = year.Label;
    // Clear any stale per-section messages and hide the new-player link box
    // left over from a previous edit session.
    els.editYearMessage.innerHTML = '';
    els.editYearAddExistingMessage.innerHTML = '';
    els.editYearAddPlayerMessage.innerHTML = '';
    els.editYearNewLinkBox.classList.add('hidden');
    // Make-current is offered only when the edited season isn't already current
    // (Req 5.3). isCurrentYearRow reads the same flag the season list uses.
    els.editYearMakeCurrentBtn.classList.toggle('hidden', isCurrentYearRow(year));
    renderEditYearRoster();
    populateEditYearAddExisting();
  }

  // Return from the Edit-Year panel to the season list, in-view (no history
  // change, Req 5.1/5.2). Re-render the list so any changes made while editing
  // (e.g. a made-current season) are reflected.
  function closeEditYear() {
    els.editYear.classList.add('hidden');
    els.yearList.classList.remove('hidden');
    els.addYearBtn.classList.remove('hidden');
    editingYearId = null;
    renderYearList();
  }

  // Render the roster of the EDITED season (editingYearId) with a per-player
  // Remove control (Reqs 5.4, 5.5). Mirrors the player-view removeFromYearBtn
  // confirm/shape but scoped to editingYearId, not selectedYearId.
  function renderEditYearRoster() {
    const players = rosterPlayersForYear(editingYearId);
    if (!players.length) {
      els.editYearRoster.innerHTML = '<p class="muted">No players rostered for this season yet.</p>';
      return;
    }
    els.editYearRoster.innerHTML = players.map((p) => `
      <div class="field-row" style="align-items:center; margin-bottom:0.5rem">
        <div class="field" style="margin-bottom:0; flex:1">${escapeHtml(p.Name)}</div>
        <div class="field" style="margin-bottom:0">
          <button type="button" class="secondary edit-year-remove" data-token="${escapeHtml(p.Token)}">Remove</button>
        </div>
      </div>
    `).join('');

    els.editYearRoster.querySelectorAll('.edit-year-remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        els.editYearMessage.innerHTML = '';
        const token = btn.dataset.token;
        const player = data.players.find((p) => p.Token === token);
        const year = (data.years || []).find((y) => y.YearID === editingYearId);
        const name = player ? player.Name : 'this player';
        const yearLabel = (year && year.Label) || 'this season';
        if (!confirm(`Remove ${name} from ${yearLabel}? Their rounds and history are kept -- they just won't show up for this season anymore. You can re-add them later.`)) return;
        try {
          await UI.withBusy(btn, 'Removing…', () =>
            Api.post({ action: 'removePlayerFromYear', session, token, yearId: editingYearId }));
          await refresh();
          // The removed player is now an add-existing candidate again, so
          // re-render both the roster and the add-existing dropdown.
          renderEditYearRoster();
          populateEditYearAddExisting();
        } catch (err) {
          els.editYearMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
        }
      });
    });
  }

  // Populate the Edit-Year "Add Existing Player" dropdown with the global
  // players NOT rostered to the EDITED season (Req 5.6). Scoped to
  // editingYearId and targeting the editYear controls.
  function populateEditYearAddExisting() {
    const notInYear = existingPlayerCandidates(data.players, rosterTokensForYear(editingYearId));
    els.editYearAddExistingBtn.disabled = !notInYear.length;
    els.editYearAddExistingSelect.innerHTML = notInYear.length
      ? notInYear.map((p) => `<option value="${escapeHtml(p.Token)}">${escapeHtml(p.Name)}</option>`).join('')
      : '<option value="">All players are already rostered for this season</option>';
  }

  // --- Add-Year walkthrough (Reqs 6.1-6.10, 7.1-7.8) -------------------------
  // A 4-step guided create flow living in #yearWalk, an in-view sub-panel of
  // Year Management. Like Edit-Year, it is internal to the view: entering/
  // stepping it pushes NO history entry, so one browser-Back returns straight
  // to the main dashboard. All step state lives in the module-level `walk`
  // model; navigation is gated by AdminLogic.walkStepValidation (label required
  // to leave Step 1 / to Confirm; Steps 2 & 3 skippable). Named startYearWalk
  // to match the existing guarded #addYearBtn hook (design calls it
  // startWalkthrough; this is the same entrypoint).
  function startYearWalk() {
    // Fresh model on every launch so a previous run's label/selections never
    // leak into a new season (Req 6.1).
    walk = { step: 1, label: '', returningTokens: [], newPlayers: [], result: null };
    // Focus the walkthrough within the Year Management view: hide the season
    // list + Add-New-Year control (and any open edit panel) so the walkthrough
    // reads as the sole content. closeWalkAndShowList() reverses this.
    els.yearList.classList.add('hidden');
    els.addYearBtn.classList.add('hidden');
    if (els.editYear) els.editYear.classList.add('hidden');
    els.walkMessage.innerHTML = '';
    els.yearWalk.classList.remove('hidden');
    renderWalkStep();
  }

  // Leave the walkthrough and return to the season list, in-view (no history
  // change -- mirrors closeEditYear). Re-render the list so a newly created
  // current season is reflected.
  function closeWalkAndShowList() {
    els.yearWalk.classList.add('hidden');
    els.yearList.classList.remove('hidden');
    els.addYearBtn.classList.remove('hidden');
    walk = null;
    renderYearList();
  }

  // Sync the DOM inputs of the CURRENT step back into the `walk` model before
  // navigating away from it, so nothing typed is lost on step change or when
  // building the Step-4 summary. Step 2 (checkboxes) and Step 3 (row inputs)
  // are already synced live via their change/input listeners, so only Step 1's
  // label needs reading here; we read it defensively regardless of step.
  function syncWalkCurrentStep() {
    if (!walk) return;
    walk.label = els.walkLabel.value;
  }

  // Show only the current step, update the progress indicator, gate the
  // Back/Next/Confirm buttons, and render the current step's content (Reqs 6.2,
  // 6.3). Back is hidden on Step 1; Next shows on Steps 1-3; Confirm shows only
  // on Step 4. Next off Step 1 and Confirm are gated by walkStepValidation.
  function renderWalkStep() {
    if (!walk) return;
    const step = walk.step;
    [els.walkStep1, els.walkStep2, els.walkStep3, els.walkStep4].forEach((el, i) => {
      el.classList.toggle('hidden', (i + 1) !== step);
    });
    els.walkProgress.textContent = `Step ${step} of 4`;

    const gate = walkStepValidation(walk);
    // Back is always available except on Step 1 (where it would leave the
    // walkthrough -- that path is the season-list return instead).
    els.walkBackBtn.classList.toggle('hidden', false);
    els.walkBackBtn.textContent = step === 1 ? '\u2190 Back to seasons' : '\u2190 Back';
    // Next on Steps 1-3, Confirm on Step 4.
    els.walkNextBtn.classList.toggle('hidden', step === 4);
    els.walkConfirmBtn.classList.toggle('hidden', step !== 4);
    // Gate: can't leave Step 1 without a valid label; can't Confirm without one.
    els.walkNextBtn.disabled = (step === 1 && !gate.labelValid);
    els.walkConfirmBtn.disabled = !gate.canConfirm;

    if (step === 1) renderWalkStep1();
    else if (step === 2) renderWalkStep2();
    else if (step === 3) renderWalkStep3();
    else if (step === 4) renderWalkStep4();
  }

  // Step 1: the season label input, reflecting the model. Keep walk.label in
  // sync live so the Next gate updates as the coach types (Reqs 6.1, 6.3).
  function renderWalkStep1() {
    els.walkLabel.value = walk.label || '';
    els.walkLabel.oninput = () => {
      walk.label = els.walkLabel.value;
      const gate = walkStepValidation(walk);
      els.walkNextBtn.disabled = !gate.labelValid;
    };
  }

  // Navigate to `step` (clamped 1..4): sync the current step's inputs first,
  // then switch. Steps 2 & 3 are skippable, so advancing never requires a
  // selection (Reqs 6.5, 6.7).
  function walkGoTo(step) {
    if (!walk) return;
    syncWalkCurrentStep();
    walk.step = Math.max(1, Math.min(4, step));
    renderWalkStep();
  }

  // Step 2 (returning players, skippable): render an all-optional checklist of
  // the CURRENT season's roster as import candidates, reflecting any tokens
  // already chosen. Checkbox changes update walk.returningTokens live. When
  // there's no current season or it has no roster, show a muted empty message
  // (Reqs 6.4, 6.5).
  function renderWalkStep2() {
    const currentYear = (data.years || []).find(isCurrentYearRow);
    const candidates = currentYear
      ? importCandidatesFrom(data.players, data.playerYears, currentYear.YearID)
      : [];
    if (!candidates.length) {
      els.walkReturningList.innerHTML = '<p class="muted">No previous players to import.</p>';
      return;
    }
    const chosen = new Set(walk.returningTokens);
    els.walkReturningList.innerHTML = candidates.map((p) =>
      `<label class="import-row"><input type="checkbox" class="walk-returning" ` +
      `value="${escapeHtml(p.Token)}"${chosen.has(p.Token) ? ' checked' : ''}> ${escapeHtml(p.Name)}</label>`
    ).join('');
    els.walkReturningList.querySelectorAll('.walk-returning').forEach((cb) => {
      cb.addEventListener('change', () => {
        walk.returningTokens = Array.from(
          els.walkReturningList.querySelectorAll('.walk-returning:checked')
        ).map((el) => el.value);
      });
    });
  }

  // Step 3 (new players, skippable): render walk.newPlayers as editable rows
  // (name + Boy/Girl + remove). To avoid losing in-progress typing on
  // re-render, the model is updated on every input/change event and the DOM is
  // only fully re-rendered on add/remove row. Blank rows are allowed here and
  // dropped later by AdminLogic.collectNewPlayers (Reqs 6.6, 6.7, 6.10).
  function renderWalkStep3() {
    if (!walk.newPlayers.length) {
      els.walkNewPlayers.innerHTML = '<p class="muted">No new players yet. Use “Add Another Player” below, or skip this step.</p>';
      return;
    }
    els.walkNewPlayers.innerHTML = walk.newPlayers.map((row, i) => `
      <div class="field-row walk-new-row" data-index="${i}" style="align-items:flex-end; margin-bottom:0.5rem">
        <div class="field" style="margin-bottom:0; flex:1">
          <label>Name</label>
          <input type="text" class="walk-new-name" value="${escapeHtml(row.name)}" placeholder="Player name">
        </div>
        <div class="field" style="margin-bottom:0">
          <label>Sex</label>
          <select class="walk-new-sex">
            <option value="Boy"${row.sex === 'Boy' ? ' selected' : ''}>Boy</option>
            <option value="Girl"${row.sex === 'Girl' ? ' selected' : ''}>Girl</option>
          </select>
        </div>
        <div class="field" style="margin-bottom:0">
          <button type="button" class="secondary walk-new-remove">Remove</button>
        </div>
      </div>
    `).join('');

    els.walkNewPlayers.querySelectorAll('.walk-new-row').forEach((rowEl) => {
      const idx = Number(rowEl.dataset.index);
      const nameEl = rowEl.querySelector('.walk-new-name');
      const sexEl = rowEl.querySelector('.walk-new-sex');
      // Update the model on each event so re-renders (and the Step-4 summary)
      // always see the latest values without needing a read-all pass.
      nameEl.addEventListener('input', () => { walk.newPlayers[idx].name = nameEl.value; });
      sexEl.addEventListener('change', () => { walk.newPlayers[idx].sex = sexEl.value; });
      rowEl.querySelector('.walk-new-remove').addEventListener('click', () => {
        walk.newPlayers.splice(idx, 1);
        renderWalkStep3();
      });
    });
  }

  // Append a blank new-player row (default sex Boy) and re-render Step 3
  // (Req 6.6). Live model updates mean no explicit read-back is needed here.
  function walkAddNewPlayerRow() {
    if (!walk) return;
    walk.newPlayers.push({ name: '', sex: 'Boy' });
    renderWalkStep3();
  }

  // Step 4 (Review & Confirm): summarize the trimmed label, the selected
  // returning players, and the valid new players from the pure buildConfirmSummary
  // (blank rows already dropped). Sync inputs first so the summary is current.
  // If the label is invalid, say so; Confirm stays disabled via the gate in
  // renderWalkStep (Reqs 6.9, 6.10, 6.3).
  function renderWalkStep4() {
    syncWalkCurrentStep();
    const summary = buildConfirmSummary(walk, data.players);
    const labelHtml = summary.label
      ? `<div class="field" style="margin-bottom:0.5rem"><strong>New season:</strong> ${escapeHtml(summary.label)}</div>`
      : '<div class="error">A season label is required. Go back to Step 1 to enter one.</div>';

    const returningHtml = summary.returning.length
      ? `<ul>${summary.returning.map((r) => `<li>${escapeHtml(r.name)}</li>`).join('')}</ul>`
      : '<p class="muted">None selected.</p>';

    const newHtml = summary.newPlayers.length
      ? `<ul>${summary.newPlayers.map((p) => `<li>${escapeHtml(p.name)} <span class="muted">(${escapeHtml(p.sex)})</span></li>`).join('')}</ul>`
      : '<p class="muted">None.</p>';

    els.walkReview.innerHTML = `
      ${labelHtml}
      <h4 style="margin-bottom:0.25rem">Returning players (${summary.returning.length})</h4>
      ${returningHtml}
      <h4 style="margin-bottom:0.25rem">New players to create (${summary.newPlayers.length})</h4>
      ${newHtml}
    `;
  }

  // Confirm sequence -- best-effort partial-failure creation, implementing the
  // design pseudocode EXACTLY (Reqs 7.1-7.8). Guarded by walkStepValidation:
  //   1. createYear(label, returningTokens) exactly once. On reject: surface the
  //      error, create nothing, STAY on Step 4.
  //   2. On success, addPlayer(name, sex, yearId) per collected new row,
  //      partitioning into created (with playerLink) / failed -- NO rollback, the
  //      year and successes are kept regardless of failures.
  //   3. selectedYearId = yearId; Store.writeViewingYearId(yearId); await refresh().
  //   4. Show a success screen listing created players + copyable links and any
  //      failures with retry-in-edit-year guidance, plus a Done control back to
  //      the season list.
  async function walkConfirm() {
    if (!walk) return;
    syncWalkCurrentStep();
    if (!walkStepValidation(walk).canConfirm) return;   // gate (label required)
    els.walkMessage.innerHTML = '';

    const label = walk.label.trim();
    const returningTokens = walk.returningTokens.slice();

    let yearRes;
    try {
      yearRes = await UI.withBusy(els.walkConfirmBtn, 'Creating…', () =>
        Api.post({ action: 'createYear', session, label, playerTokens: returningTokens }));
    } catch (err) {
      // createYear failed: nothing created, stay in the walkthrough (Req 7.5).
      els.walkMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
      return;
    }

    const yearId = yearRes.yearId;
    const created = [];
    const failed = [];
    // Drop blank rows; create the rest best-effort (Reqs 7.2, 7.3, 7.6).
    const newRows = collectNewPlayers(walk.newPlayers);
    for (const row of newRows) {
      try {
        const rec = await Api.post({ action: 'addPlayer', session, name: row.name, sex: row.sex, yearId });
        created.push({ name: row.name, sex: row.sex, token: rec.Token, link: playerLink(rec.Token) });
      } catch (err) {
        // Keep going -- no rollback of the year or already-created players.
        failed.push({ name: row.name, sex: row.sex, message: err.message });
      }
    }

    walk.result = { yearId, created, failed };

    // Select + persist the new season and refresh so both the Year Management
    // view and the Main_Dashboard reflect it (Req 7.8).
    selectedYearId = yearId;
    Store.writeViewingYearId(yearId);
    await refresh();

    renderWalkSuccess(label, created, failed);
  }

  // Success screen after confirm (Reqs 7.4, 7.7). Lists created players with a
  // copyable secret link each, any failures with guidance to retry via the
  // season's Edit panel, and a Done control that returns to the season list.
  // Rendered into #walkReview with the stepper buttons hidden.
  function renderWalkSuccess(label, created, failed) {
    els.walkProgress.textContent = '';
    els.walkBackBtn.classList.add('hidden');
    els.walkNextBtn.classList.add('hidden');
    els.walkConfirmBtn.classList.add('hidden');
    // Show the review pane as the success surface; hide the other steps.
    [els.walkStep1, els.walkStep2, els.walkStep3].forEach((el) => el.classList.add('hidden'));
    els.walkStep4.classList.remove('hidden');

    els.walkMessage.innerHTML = `<div class="success">Created season “${escapeHtml(label)}”.</div>`;

    const createdHtml = created.length
      ? created.map((c) => `
        <div class="link-box" style="margin-bottom:0.5rem">
          <div class="field" style="margin-bottom:0.25rem; flex:1">${escapeHtml(c.name)} <span class="muted">(${escapeHtml(c.sex)})</span></div>
          <input type="text" class="walk-created-link" readonly value="${escapeHtml(c.link)}">
          <button type="button" class="secondary walk-copy-link">Copy</button>
        </div>
      `).join('')
      : '<p class="muted">No new players were created.</p>';

    const failedHtml = failed.length
      ? `<div class="error" style="margin-top:0.75rem">
          <p>These players could not be created. The season and the players above were kept — open <strong>Edit</strong> for this season and use “Add brand-new player” to retry:</p>
          <ul>${failed.map((f) => `<li>${escapeHtml(f.name)} <span class="muted">(${escapeHtml(f.sex)})</span> — ${escapeHtml(f.message)}</li>`).join('')}</ul>
        </div>`
      : '';

    els.walkReview.innerHTML = `
      <h4 style="margin-bottom:0.25rem">New players created (${created.length})</h4>
      ${createdHtml}
      ${failedHtml}
      <div style="margin-top:1rem"><button type="button" id="walkDoneBtn">Done</button></div>
    `;

    // Copy buttons for each created player's link (reuse the shared helper).
    els.walkReview.querySelectorAll('.link-box').forEach((box) => {
      const input = box.querySelector('.walk-created-link');
      const btn = box.querySelector('.walk-copy-link');
      if (input && btn) btn.addEventListener('click', () => copyToClipboard(input));
    });
    // Done returns to the season list (which now reflects the new season).
    const doneBtn = document.getElementById('walkDoneBtn');
    if (doneBtn) doneBtn.addEventListener('click', () => closeWalkAndShowList());
  }

  // --- Hamburger menu (Reqs 1.1-1.9) -----------------------------------------
  // The menu panel is a dropdown shown/hidden via the `.hidden` class on
  // #menuPanel (styled in styles.css). Open/closed state is mirrored onto
  // #menuToggle's aria-expanded and #menuPanel's aria-hidden for accessibility.
  function openMenu() {
    els.menuPanel.classList.remove('hidden');
    els.menuToggle.setAttribute('aria-expanded', 'true');
    els.menuPanel.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    els.menuPanel.classList.add('hidden');
    els.menuToggle.setAttribute('aria-expanded', 'false');
    els.menuPanel.setAttribute('aria-hidden', 'true');
  }

  // Open when closed, close when open -- state is derived from whether the
  // panel currently carries `.hidden` so it always tracks the real DOM.
  function toggleMenu() {
    if (els.menuPanel.classList.contains('hidden')) {
      openMenu();
    } else {
      closeMenu();
    }
  }

  async function deleteRound(roundId, btn) {
    if (!confirm('Delete this round? This cannot be undone.')) return;
    try {
      await UI.withBusy(btn, 'Deleting…', () => Api.post({ action: 'deleteRound', session, roundId }));
      await refresh();
      if (currentPlayerToken) showPlayerDetail(currentPlayerToken);
    } catch (err) {
      alert(err.message);
    }
  }

  function holeRangeFor(mode) {
    if (mode === '9F') return range(1, 9);
    if (mode === '9B') return range(10, 18);
    return range(1, 18);
  }
  function range(a, b) {
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }

  function isEditSummaryMode() {
    return els.editEntryModeSummary.checked;
  }

  function syncEditEntryModeVisibility() {
    const summary = isEditSummaryMode();
    els.editHoleByHoleSection.classList.toggle('hidden', summary);
    els.editSummarySection.classList.toggle('hidden', !summary);
    // A required field inside a hidden section still blocks native form
    // submission, so the Score inputs must stop being required while
    // they're hidden.
    els.editHoleRows.querySelectorAll('.score').forEach((input) => { input.required = !summary; });
    if (summary) {
      suggestEditSummaryPar();
      updateEditSummaryHoleCheck();
    }
  }

  // Convenience default (still editable): if the selected course has
  // verified pars, sum the par for the selected holes range.
  function suggestEditSummaryPar() {
    const courseData = editSelectedCourseData();
    if (!courseData || !courseData.pars || els.editSummaryPar.value) return;
    const holes = holeRangeFor(els.editHolesPlayed.value);
    const total = holes.reduce((sum, h) => sum + (courseData.pars[h - 1] || 0), 0);
    if (total) els.editSummaryPar.value = total;
  }

  function updateEditSummaryHoleCheck() {
    const total = holeRangeFor(els.editHolesPlayed.value).length;
    const accounted = EDIT_SUMMARY_OUTCOME_FIELDS.reduce((sum, el) => sum + (Number(el.value) || 0), 0);
    els.editSummaryHoleCheck.textContent = accounted;
    els.editSummaryHoleCheckTotal.textContent = total;
  }

  function clearEditSummaryFields() {
    [els.editSummaryScore, els.editSummaryPar, els.editSummaryPutts, els.editSummaryGIR,
      els.editSummaryFairwaysHit, els.editSummaryFairwaysAttempted, els.editSummaryPenalties,
      ...EDIT_SUMMARY_OUTCOME_FIELDS]
      .forEach((el) => { el.value = ''; });
  }

  function openEditRound(roundId) {
    const round = data.rounds.find((r) => r.RoundID === roundId);
    if (!round) return;
    editingRoundId = roundId;
    els.editRoundHeading.textContent = 'Edit Round';
    els.editSaveBtn.textContent = 'Save Changes';

    els.editRoundMessage.innerHTML = '';
    els.editDate.value = toDateInputValue(round.Date);
    els.editHolesPlayed.value = round.HolesPlayed;
    els.editIsTournament.checked = Stats.isTournamentRound(round);
    els.editNotes.value = round.Notes || '';
    populateEditYearSelect(round.Year);

    populateCourseSelect(els.editCourseSelect, round.Course);
    const isOther = els.editCourseSelect.value === OTHER_COURSE_VALUE;
    els.editCourseOtherRow.classList.toggle('hidden', !isOther);
    els.editCourseOther.value = isOther ? round.Course : '';
    els.editCourseOtherCity.value = '';

    populateEditTeeSelect(round.Tees);
    if (els.editTeeSelect.value === OTHER_TEE_VALUE) {
      els.editTeeOther.value = round.Tees || '';
      els.editCourseRating.value = round.CourseRating != null ? round.CourseRating : '';
      els.editSlopeRating.value = round.SlopeRating != null ? round.SlopeRating : '';
    } else {
      els.editTeeOther.value = '';
      els.editCourseRating.value = '';
      els.editSlopeRating.value = '';
    }

    const summary = Stats.isSummaryRound(round);
    els.editEntryModeHoles.checked = !summary;
    els.editEntryModeSummary.checked = summary;
    clearEditSummaryFields();
    if (summary) {
      els.editSummaryScore.value = round.SummaryScore;
      els.editSummaryPar.value = round.SummaryPar;
      els.editSummaryPutts.value = round.SummaryPutts;
      els.editSummaryGIR.value = round.SummaryGIR;
      els.editSummaryFairwaysHit.value = round.SummaryFairwaysHit;
      els.editSummaryFairwaysAttempted.value = round.SummaryFairwaysAttempted;
      els.editSummaryPenalties.value = round.SummaryPenalties;
      els.editSummaryEagles.value = round.SummaryEagles;
      els.editSummaryBirdies.value = round.SummaryBirdies;
      els.editSummaryPars.value = round.SummaryPars;
      els.editSummaryBogeys.value = round.SummaryBogeys;
      els.editSummaryDoubles.value = round.SummaryDoubles;
      els.editSummaryWorse.value = round.SummaryWorse;
    }

    const existing = {};
    (Stats.groupBy(data.holeScores, 'RoundID')[roundId] || []).forEach((h) => {
      existing[Number(h.Hole)] = {
        par: h.Par,
        score: h.Score,
        fairway: h.FairwayHit,
        gir: h.GIR,
        putts: h.Putts,
        penalty: h.Penalties
      };
    });
    // Admin edits are never par-locked -- courseData is always null here so a
    // coach can fix a wrong par even on a "known" course.
    HoleTable.render(els.editHoleRows, holeRangeFor(round.HolesPlayed), null, existing);
    HoleTable.updateRunningTotal(els.editHoleRows, els.editRunningTotal);
    // Must run after the render above -- it toggles `required` on the Score
    // inputs the render just (re)created.
    syncEditEntryModeVisibility();

    els.playerDetail.classList.add('hidden');
    els.editRoundCard.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  function openAddRound() {
    if (!currentPlayerToken) return;
    editingRoundId = null;
    els.editRoundHeading.textContent = 'Add Round';
    els.editSaveBtn.textContent = 'Add Round';

    els.editRoundMessage.innerHTML = '';
    els.editDate.value = new Date().toISOString().slice(0, 10);
    els.editHolesPlayed.value = '18';
    els.editIsTournament.checked = false;
    els.editNotes.value = '';
    populateEditYearSelect();
    els.editEntryModeHoles.checked = true;
    els.editEntryModeSummary.checked = false;
    clearEditSummaryFields();

    populateCourseSelect(els.editCourseSelect);
    els.editCourseOtherRow.classList.toggle('hidden', els.editCourseSelect.value !== OTHER_COURSE_VALUE);
    els.editCourseOther.value = '';
    els.editCourseOtherCity.value = '';
    populateEditTeeSelect();
    els.editTeeOther.value = '';
    els.editCourseRating.value = '';
    els.editSlopeRating.value = '';

    HoleTable.render(els.editHoleRows, holeRangeFor('18'), null, {});
    HoleTable.updateRunningTotal(els.editHoleRows, els.editRunningTotal);
    // Must run after the render above -- it toggles `required` on the Score
    // inputs the render just (re)created.
    syncEditEntryModeVisibility();

    els.playerDetail.classList.add('hidden');
    els.editRoundCard.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  function editedCourseName() {
    if (els.editCourseSelect.value === OTHER_COURSE_VALUE) {
      const name = els.editCourseOther.value.trim();
      const city = els.editCourseOtherCity.value.trim();
      return city ? `${name} (${city})` : name;
    }
    return els.editCourseSelect.value;
  }

  async function deletePlayer() {
    if (!currentPlayerToken) return;
    const player = data.players.find((p) => p.Token === currentPlayerToken);
    const name = player ? player.Name : 'this player';
    if (!confirm(`Delete ${name}? This permanently deletes every round and score they've entered, across every season. This cannot be undone.`)) return;
    try {
      await UI.withBusy(els.deletePlayerBtn, 'Deleting…', () =>
        Api.post({ action: 'deletePlayer', session, token: currentPlayerToken }));
      currentPlayerToken = null;
      await refresh();
      // Player no longer exists -> return to the Roster_View. Called after
      // refresh() so the roster is rebuilt before scroll is restored, and
      // closePlayerDetail(false) consumes the pushed history entry. (Reqs 8.5)
      closePlayerDetail(false);
    } catch (err) {
      alert(err.message);
    }
  }

  async function refresh() {
    await loadData();
    populateYearSelect();
    renderTeamTiles();
    renderRoster();
    // If the Year Management view is open during a refresh (e.g. after a
    // make-current or edit-year mutation), re-render the season list so it
    // stays coherent with the freshly-loaded data. The Edit-Year and
    // walkthrough handlers re-render their own sub-regions.
    if (yearMgmtOpen) renderYearList();
    els.playerDetail.classList.add('hidden');
    els.editRoundCard.classList.add('hidden');
  }

  async function showDashboard() {
    els.loginCard.classList.add('hidden');
    els.dashboard.classList.remove('hidden');
    // adminData reads five sheets and is cold-start-prone (often several
    // seconds), so show a loading state instead of a frozen-looking blank
    // dashboard. Everything below goes through refresh() -> loadData().
    els.loadingOverlay.classList.remove('hidden');
    els.dashboard.classList.add('dashboard-loading');
    try {
      await refresh();
    } finally {
      els.loadingOverlay.classList.add('hidden');
      els.dashboard.classList.remove('dashboard-loading');
    }
  }

  els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.loginMessage.innerHTML = '';
    try {
      await UI.withBusy(els.loginBtn, 'Logging in…', () => login(els.password.value));
      await showDashboard();
    } catch (err) {
      els.loginMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  els.removeFromYearBtn.addEventListener('click', async () => {
    if (!currentPlayerToken) return;
    const player = data.players.find((p) => p.Token === currentPlayerToken);
    const yearLabel = (data.years.find((y) => y.YearID === selectedYearId) || {}).Label || 'this season';
    const name = player ? player.Name : 'this player';
    if (!confirm(`Remove ${name} from ${yearLabel}? Their rounds and history are kept -- they just won't show up for this season anymore. You can re-add them later.`)) return;
    try {
      await UI.withBusy(els.removeFromYearBtn, 'Removing…', () =>
        Api.post({ action: 'removePlayerFromYear', session, token: currentPlayerToken, yearId: selectedYearId }));
      currentPlayerToken = null;
      await refresh();
      // Player is gone from this season -> return to the Roster_View. Called
      // after refresh() so the roster is rebuilt before scroll is restored,
      // and closePlayerDetail(false) consumes the pushed history entry. (Reqs 8.4)
      closePlayerDetail(false);
    } catch (err) {
      alert(err.message);
    }
  });

  els.yearSelect.addEventListener('change', () => {
    selectedYearId = els.yearSelect.value;
    // Persist the newly-chosen season before any re-render so the next load
    // can restore it (Reqs 2.2, 3.1). The guarded Store no-ops on failure.
    Store.writeViewingYearId(selectedYearId);
    renderTeamTiles();
    renderRoster();
    els.playerDetail.classList.add('hidden');
    els.editRoundCard.classList.add('hidden');
  });

  els.deletePlayerBtn.addEventListener('click', deletePlayer);

  // On-page "Back to roster" links (top and bottom of the player view). Both
  // invoke the close path with fromPopstate=false so history.back() consumes
  // the pushed player-view entry and the roster scroll position is restored.
  els.backToRosterTop.addEventListener('click', () => closePlayerDetail(false));
  els.backToRosterBottom.addEventListener('click', () => closePlayerDetail(false));

  els.editSexBtn.addEventListener('click', () => {
    const player = data.players.find((p) => p.Token === currentPlayerToken);
    els.playerDetailSexSelect.innerHTML = ['Boy', 'Girl'].map((s) =>
      `<option value="${s}" ${player && player.Sex === s ? 'selected' : ''}>${s}</option>`
    ).join('');
    els.playerDetailSexPill.classList.add('hidden');
    els.editSexBtn.classList.add('hidden');
    els.playerDetailSexSelect.classList.remove('hidden');
    els.saveSexBtn.classList.remove('hidden');
    els.cancelSexBtn.classList.remove('hidden');
  });

  els.cancelSexBtn.addEventListener('click', () => {
    if (currentPlayerToken) showPlayerDetail(currentPlayerToken);
  });

  els.saveSexBtn.addEventListener('click', async () => {
    try {
      await UI.withBusy(els.saveSexBtn, 'Saving…', () =>
        Api.post({ action: 'updatePlayer', session, token: currentPlayerToken, sex: els.playerDetailSexSelect.value }));
      await refresh();
      if (currentPlayerToken) showPlayerDetail(currentPlayerToken);
    } catch (err) {
      alert(err.message);
    }
  });

  els.editCourseSelect.addEventListener('change', () => {
    els.editCourseOtherRow.classList.toggle('hidden', els.editCourseSelect.value !== OTHER_COURSE_VALUE);
    // Par stays editable here (unlike the player form) -- this only fills
    // in the values, it never locks the inputs.
    HoleTable.applyCoursePars(els.editHoleRows, editSelectedCourseData());
    populateEditTeeSelect();
    if (isEditSummaryMode()) suggestEditSummaryPar();
  });

  els.editTeeSelect.addEventListener('change', syncEditTeeOtherVisibility);

  els.editHolesPlayed.addEventListener('change', () => {
    HoleTable.render(els.editHoleRows, holeRangeFor(els.editHolesPlayed.value), null, {});
    HoleTable.applyCoursePars(els.editHoleRows, editSelectedCourseData());
    HoleTable.updateRunningTotal(els.editHoleRows, els.editRunningTotal);
    syncEditEntryModeVisibility();
  });

  els.editHoleRows.addEventListener('input', (e) => {
    if (e.target.classList.contains('score')) HoleTable.updateRunningTotal(els.editHoleRows, els.editRunningTotal);
  });

  els.editEntryModeHoles.addEventListener('change', syncEditEntryModeVisibility);
  els.editEntryModeSummary.addEventListener('change', syncEditEntryModeVisibility);
  EDIT_SUMMARY_OUTCOME_FIELDS.forEach((el) => el.addEventListener('input', updateEditSummaryHoleCheck));

  els.editCancelBtn.addEventListener('click', () => {
    editingRoundId = null;
    els.editRoundCard.classList.add('hidden');
    // Re-show the player detail so cancelling the editor doesn't leave an
    // empty full-screen player-view. showPlayerDetail is idempotent w.r.t.
    // history (enterPlayerView adds no entry when already open).
    if (currentPlayerToken) showPlayerDetail(currentPlayerToken);
  });

  els.addRoundBtn.addEventListener('click', openAddRound);

  els.editRoundForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.editRoundMessage.innerHTML = '';
    const isAdding = editingRoundId == null;
    try {
      await UI.withBusy(els.editSaveBtn, isAdding ? 'Adding…' : 'Saving…', async () => {
        const course = editedCourseName();
        if (!course) throw new Error('Course is required.');
        const tee = editSelectedTee();

        const payload = {
          date: els.editDate.value,
          course,
          tees: tee.name,
          courseRating: tee.rating,
          slopeRating: tee.slope,
          holesPlayed: els.editHolesPlayed.value,
          isTournament: els.editIsTournament.checked,
          yearId: els.editYearSelect.value,
          notes: els.editNotes.value
        };

        if (isEditSummaryMode()) {
          if (!els.editSummaryScore.value) throw new Error('Total score is required.');
          if (!els.editSummaryPar.value) throw new Error('Total par is required.');
          Object.assign(payload, {
            entryMode: 'summary',
            summaryHoles: holeRangeFor(els.editHolesPlayed.value).length,
            summaryScore: els.editSummaryScore.value,
            summaryPar: els.editSummaryPar.value,
            summaryPutts: els.editSummaryPutts.value,
            summaryGIR: els.editSummaryGIR.value,
            summaryFairwaysHit: els.editSummaryFairwaysHit.value,
            summaryFairwaysAttempted: els.editSummaryFairwaysAttempted.value,
            summaryPenalties: els.editSummaryPenalties.value,
            summaryEagles: els.editSummaryEagles.value,
            summaryBirdies: els.editSummaryBirdies.value,
            summaryPars: els.editSummaryPars.value,
            summaryBogeys: els.editSummaryBogeys.value,
            summaryDoubles: els.editSummaryDoubles.value,
            summaryWorse: els.editSummaryWorse.value
          });
        } else {
          const holes = HoleTable.collect(els.editHoleRows);
          for (const h of holes) {
            if (!h.par || !h.score) throw new Error(`Hole ${h.hole} needs a par and a score.`);
          }
          payload.holes = holes;
        }

        if (isAdding) {
          await Api.post(Object.assign({ action: 'submitRound', token: currentPlayerToken }, payload));
        } else {
          await Api.post(Object.assign({ action: 'updateRound', session, roundId: editingRoundId }, payload));
        }
      });

      editingRoundId = null;
      els.editRoundCard.classList.add('hidden');
      await refresh();
      if (currentPlayerToken) showPlayerDetail(currentPlayerToken);
    } catch (err) {
      els.editRoundMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  function copyToClipboard(input) {
    input.select();
    navigator.clipboard?.writeText(input.value).catch(() => document.execCommand('copy'));
  }
  els.copyDetailLinkBtn.addEventListener('click', () => copyToClipboard(els.playerDetailLink));

  window.addEventListener('popstate', onPopState);

  // Year Management in-view Back control -> close via the on-page path
  // (fromPopstate=false) so history.back() consumes the pushed entry (Req 3.3).
  els.yearMgmtBack.addEventListener('click', () => closeYearMgmt(false));

  // --- Edit-Year panel wiring (Reqs 5.3, 5.7, 5.9, 5.10) ---------------------
  // All handlers target editingYearId, never selectedYearId. After each
  // mutation they call refresh() (which re-renders the main dashboard for
  // selectedYearId -- desired) then re-render the Edit-Year sub-regions for
  // editingYearId. The Year Management view stays open throughout (refresh()
  // never touches #yearMgmt or #editYear).

  // Back to the season list (in-view, no history change, Req 5.1).
  els.editYearBack.addEventListener('click', () => closeEditYear());

  // Make the edited season current (Req 5.3): setCurrentYear{editingYearId},
  // then refresh and re-open the panel so the now-current season hides its
  // Make-current button.
  els.editYearMakeCurrentBtn.addEventListener('click', async () => {
    els.editYearMessage.innerHTML = '';
    if (!editingYearId) return;
    const yearId = editingYearId;
    try {
      await UI.withBusy(els.editYearMakeCurrentBtn, 'Saving…', () =>
        Api.post({ action: 'setCurrentYear', session, yearId }));
      await refresh();
      // Re-open the panel for the same season so the make-current button hides
      // and the roster/candidates reflect the refreshed data.
      openEditYear(yearId);
      els.editYearMessage.innerHTML = '<div class="success">Updated the current season.</div>';
    } catch (err) {
      els.editYearMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  // Add an existing (unrostered) player to the edited season (Req 5.7):
  // addPlayerToYear{token, editingYearId}, then re-render roster + candidates.
  els.editYearAddExistingBtn.addEventListener('click', async () => {
    els.editYearAddExistingMessage.innerHTML = '';
    const token = els.editYearAddExistingSelect.value;
    if (!token || !editingYearId) return;
    try {
      await UI.withBusy(els.editYearAddExistingBtn, 'Adding…', () =>
        Api.post({ action: 'addPlayerToYear', session, token, yearId: editingYearId }));
      await refresh();
      renderEditYearRoster();
      populateEditYearAddExisting();
    } catch (err) {
      els.editYearAddExistingMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  // Add a brand-new player to the edited season (Reqs 5.9, 5.10):
  // addPlayer{name, sex, editingYearId}, show the generated link, re-render.
  els.editYearAddPlayerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.editYearAddPlayerMessage.innerHTML = '';
    els.editYearNewLinkBox.classList.add('hidden');
    if (!editingYearId) return;
    const name = els.editYearNewPlayerName.value;
    try {
      const result = await UI.withBusy(els.editYearAddPlayerBtn, 'Adding…', () =>
        Api.post({ action: 'addPlayer', session, name, sex: els.editYearNewPlayerSex.value, yearId: editingYearId }));
      els.editYearAddPlayerMessage.innerHTML = `<div class="success">Added ${escapeHtml(name)}.</div>`;
      els.editYearNewLinkInput.value = playerLink(result.Token);
      els.editYearNewLinkBox.classList.remove('hidden');
      els.editYearAddPlayerForm.reset();
      await refresh();
      renderEditYearRoster();
      populateEditYearAddExisting();
    } catch (err) {
      els.editYearAddPlayerMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  // Copy the generated new-player link (reuses the shared copyToClipboard).
  els.editYearCopyLinkBtn.addEventListener('click', () => copyToClipboard(els.editYearNewLinkInput));

  // Add New Year launches the 4-step walkthrough (Req 4.7). startYearWalk is
  // provided by Task 8.1; guard so this lands independently (matches the Task
  // 4.1 menu-wiring pattern).
  els.addYearBtn.addEventListener('click', () => {
    if (typeof startYearWalk === 'function') startYearWalk();
    // else: walkthrough controller (Task 8.1) not present yet -- no-op.
  });

  // Walkthrough navigation (Tasks 8.1-8.4). Back on Step 1 leaves the
  // walkthrough and returns to the season list (in-view, no history); Back on
  // Steps 2-4 steps back; Next advances (clamped); Confirm runs the best-effort
  // creation sequence. Add-Another-Player appends a Step-3 row.
  els.walkBackBtn.addEventListener('click', () => {
    if (!walk) return;
    if (walk.step === 1) {
      closeWalkAndShowList();
    } else {
      walkGoTo(walk.step - 1);
    }
  });
  els.walkNextBtn.addEventListener('click', () => {
    if (walk) walkGoTo(walk.step + 1);
  });
  els.walkAddPlayerRow.addEventListener('click', () => walkAddNewPlayerRow());
  els.walkConfirmBtn.addEventListener('click', () => walkConfirm());

  // Hamburger menu wiring (Reqs 1.2-1.9). #menuToggle is a real <button>, so
  // Enter/Space activate it natively; aria-expanded is kept in sync by
  // open/close (Reqs 1.8, 1.9).
  els.menuToggle.addEventListener('click', (e) => {
    // Stop propagation so the document outside-click handler below doesn't see
    // this same click and immediately re-close a menu we just opened (Req 1.7).
    e.stopPropagation();
    toggleMenu();
  });

  // Outside-click closes the menu when open and the click landed outside both
  // the panel and the toggle (Req 1.7).
  document.addEventListener('click', (e) => {
    if (els.menuPanel.classList.contains('hidden')) return;
    if (els.menuPanel.contains(e.target) || els.menuToggle.contains(e.target)) return;
    closeMenu();
  });

  // Escape closes the menu and returns focus to the toggle (Req 1.6).
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.menuPanel.classList.contains('hidden')) {
      closeMenu();
      els.menuToggle.focus();
    }
  });

  // Menu items close the panel first (Req 1.5), then navigate.
  // "Dashboard" closes any open full-screen view and shows the Main_Dashboard
  // (Req 1.3); "Year Management" opens the Year_Management_View (Req 1.4).
  // NOTE: openYearMgmt()/closeYearMgmt() are provided by Task 5.1 (the Year
  // Management view-state controller) and may not be present yet. The typeof
  // guards let this menu wiring land independently: once 5.1 is merged the
  // hoisted declarations resolve and the calls take effect.
  els.menuDashboard.addEventListener('click', () => {
    closeMenu();
    // Close whichever full-screen view is open and return to the Main_Dashboard
    // (Req 1.3). Only one is ever open (single-open invariant) and each close is
    // guarded to no-op when its view isn't open, so calling both defensively is
    // safe -- at most one does anything, and neither touches history when closed.
    closeYearMgmt(false);
    closePlayerDetail(false);
  });
  els.menuYearMgmt.addEventListener('click', () => {
    closeMenu();
    if (typeof openYearMgmt === 'function') openYearMgmt();
    // else: Year Management controller (Task 5.1) not present yet -- no-op.
  });

  // Try to resume an existing session.
  (async function init() {
    if (!session) return;
    try {
      await showDashboard();
    } catch (err) {
      sessionStorage.removeItem('adminSession');
      session = null;
    }
  })();
})();
