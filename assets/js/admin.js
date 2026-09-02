(function () {
  const els = {
    loginCard: document.getElementById('loginCard'),
    loginForm: document.getElementById('loginForm'),
    loginMessage: document.getElementById('loginMessage'),
    loginBtn: document.getElementById('loginBtn'),
    password: document.getElementById('password'),
    dashboard: document.getElementById('dashboard'),
    yearMessage: document.getElementById('yearMessage'),
    yearSelect: document.getElementById('yearSelect'),
    setCurrentYearBtn: document.getElementById('setCurrentYearBtn'),
    newYearLabel: document.getElementById('newYearLabel'),
    createYearBtn: document.getElementById('createYearBtn'),
    teamTiles: document.getElementById('teamTiles'),
    addPlayerForm: document.getElementById('addPlayerForm'),
    addPlayerMessage: document.getElementById('addPlayerMessage'),
    addPlayerBtn: document.querySelector('#addPlayerForm button[type="submit"]'),
    newPlayerName: document.getElementById('newPlayerName'),
    newPlayerSex: document.getElementById('newPlayerSex'),
    newLinkBox: document.getElementById('newLinkBox'),
    newLinkInput: document.getElementById('newLinkInput'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    addExistingMessage: document.getElementById('addExistingMessage'),
    addExistingSelect: document.getElementById('addExistingSelect'),
    addExistingBtn: document.getElementById('addExistingBtn'),
    rosterTable: document.getElementById('rosterTable'),
    playerDetail: document.getElementById('playerDetail'),
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
  let editingRoundId = null;
  let sortKey = 'avg';
  let sortDir = 'asc';
  let selectedYearId = null;

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
  // season) doesn't show up at all for a year they're not rostered for,
  // regardless of their Active/Inactive flag.
  function rosterTokensForYear(yearId) {
    return new Set(data.playerYears.filter((py) => py.YearID === yearId).map((py) => py.PlayerToken));
  }

  function rosterPlayersForYear(yearId) {
    const tokens = rosterTokensForYear(yearId);
    return data.players.filter((p) => tokens.has(p.Token));
  }

  // Populates the "Add Existing Player to This Season" dropdown with
  // players who exist globally but aren't rostered for the currently
  // selected year.
  function populateAddExistingSelect() {
    const tokens = rosterTokensForYear(selectedYearId);
    const notInYear = data.players.filter((p) => !tokens.has(p.Token))
      .sort((a, b) => a.Name.localeCompare(b.Name));
    els.addExistingBtn.disabled = !notInYear.length;
    els.addExistingSelect.innerHTML = notInYear.length
      ? notInYear.map((p) => `<option value="${escapeHtml(p.Token)}">${escapeHtml(p.Name)}</option>`).join('')
      : '<option value="">All players are already rostered for this season</option>';
  }

  function isCurrentYearRow(y) {
    return y.IsCurrent === true || y.IsCurrent === 'TRUE' || y.IsCurrent === 'true';
  }

  // Repopulates the Season selector from data.years. Keeps the previously
  // selected year if it still exists; otherwise falls back to whichever
  // year is marked current, or the first one.
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
      syncSetCurrentYearBtn();
      return;
    }
    const sorted = [...years].sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    els.yearSelect.innerHTML = sorted.map((y) =>
      `<option value="${escapeHtml(y.YearID)}">${escapeHtml(y.Label)}${isCurrentYearRow(y) ? ' (Current)' : ''}</option>`
    ).join('');
    const stillExists = sorted.some((y) => y.YearID === selectedYearId);
    if (!stillExists) {
      const current = sorted.find(isCurrentYearRow) || sorted[0];
      selectedYearId = current ? current.YearID : null;
    }
    els.yearSelect.value = selectedYearId || '';
    syncSetCurrentYearBtn();
  }

  function syncSetCurrentYearBtn() {
    const selected = (data.years || []).find((y) => y.YearID === selectedYearId);
    els.setCurrentYearBtn.classList.toggle('hidden', !selected || isCurrentYearRow(selected));
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
    { key: 'worse', label: 'Worse', value: (row) => row.agg.worse },
    { key: 'status', label: 'Status', value: (row) => (row.player.Active === false ? 0 : 1) }
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
          <td>${player.Active === false ? '<span class="muted">Inactive</span>' : '<span class="pill">Active</span>'}</td>
        </tr>
      `).join('')}</tbody>
    </table>`;
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
      els.playerDetailRounds.innerHTML = `<table>
        <thead><tr><th>Date</th><th>Course</th><th>Tees</th><th>Holes</th><th>Score</th><th>Diff</th><th>Putts</th><th colspan="2"></th></tr></thead>
        <tbody>${rounds.map((r) => {
          const holes = holesByRound[r.RoundID] || [];
          const { score } = Stats.roundScoreAndPar(r, holes);
          const putts = Stats.roundPutts(r, holes);
          const diff = Stats.scoreDifferential(r, holes);
          const badges = [
            Stats.isTournamentRound(r) ? '<span class="pill">Tournament</span>' : '',
            Stats.isSummaryRound(r) ? '<span class="pill">Totals</span>' : ''
          ].filter(Boolean).join(' ');
          return `<tr>
            <td>${formatDate(r.Date)} ${badges}</td>
            <td>${escapeHtml(r.Course)}</td>
            <td>${escapeHtml(r.Tees)}</td>
            <td>${r.HolesPlayed}</td>
            <td>${score == null ? '—' : score}</td>
            <td>${Stats.fmtDiff(diff)}</td>
            <td>${putts == null ? '—' : putts}</td>
            <td><button type="button" class="secondary edit-round" data-round="${escapeHtml(r.RoundID)}">Edit</button></td>
            <td><button type="button" class="danger delete-round" data-round="${escapeHtml(r.RoundID)}">Delete</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
      els.playerDetailRounds.querySelectorAll('.delete-round').forEach((btn) => {
        btn.addEventListener('click', () => deleteRound(btn.dataset.round, btn));
      });
      els.playerDetailRounds.querySelectorAll('.edit-round').forEach((btn) => {
        btn.addEventListener('click', () => openEditRound(btn.dataset.round));
      });
    }

    els.playerDetail.classList.remove('hidden');
    els.editRoundCard.classList.add('hidden');
    els.playerDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    els.editRoundCard.classList.remove('hidden');
    els.editRoundCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    els.editRoundCard.classList.remove('hidden');
    els.editRoundCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    } catch (err) {
      alert(err.message);
    }
  }

  async function refresh() {
    await loadData();
    populateYearSelect();
    renderTeamTiles();
    renderRoster();
    populateAddExistingSelect();
    els.playerDetail.classList.add('hidden');
    els.editRoundCard.classList.add('hidden');
  }

  async function showDashboard() {
    els.loginCard.classList.add('hidden');
    els.dashboard.classList.remove('hidden');
    await refresh();
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

  els.addPlayerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.addPlayerMessage.innerHTML = '';
    els.newLinkBox.classList.add('hidden');
    try {
      const result = await UI.withBusy(els.addPlayerBtn, 'Adding…', () =>
        Api.post({ action: 'addPlayer', session, name: els.newPlayerName.value, sex: els.newPlayerSex.value, yearId: selectedYearId }));
      els.addPlayerMessage.innerHTML = `<div class="success">Added ${escapeHtml(els.newPlayerName.value)}.</div>`;
      els.newLinkInput.value = playerLink(result.Token);
      els.newLinkBox.classList.remove('hidden');
      els.addPlayerForm.reset();
      await refresh();
    } catch (err) {
      els.addPlayerMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  els.addExistingBtn.addEventListener('click', async () => {
    els.addExistingMessage.innerHTML = '';
    const token = els.addExistingSelect.value;
    if (!token) return;
    try {
      await UI.withBusy(els.addExistingBtn, 'Adding…', () =>
        Api.post({ action: 'addPlayerToYear', session, token, yearId: selectedYearId }));
      await refresh();
    } catch (err) {
      els.addExistingMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
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
    } catch (err) {
      alert(err.message);
    }
  });

  els.yearSelect.addEventListener('change', () => {
    selectedYearId = els.yearSelect.value;
    syncSetCurrentYearBtn();
    renderTeamTiles();
    renderRoster();
    populateAddExistingSelect();
    els.playerDetail.classList.add('hidden');
    els.editRoundCard.classList.add('hidden');
  });

  els.setCurrentYearBtn.addEventListener('click', async () => {
    els.yearMessage.innerHTML = '';
    try {
      await UI.withBusy(els.setCurrentYearBtn, 'Saving…', () =>
        Api.post({ action: 'setCurrentYear', session, yearId: selectedYearId }));
      await refresh();
    } catch (err) {
      els.yearMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  els.createYearBtn.addEventListener('click', async () => {
    els.yearMessage.innerHTML = '';
    const label = els.newYearLabel.value.trim();
    if (!label) {
      els.yearMessage.innerHTML = '<div class="error">Enter a label for the new season first.</div>';
      return;
    }
    try {
      const result = await UI.withBusy(els.createYearBtn, 'Creating…', () =>
        Api.post({ action: 'createYear', session, label }));
      els.newYearLabel.value = '';
      selectedYearId = result.yearId;
      await refresh();
      els.yearMessage.innerHTML = `<div class="success">Created "${escapeHtml(label)}" and made it the current season.</div>`;
    } catch (err) {
      els.yearMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  els.deletePlayerBtn.addEventListener('click', deletePlayer);

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
  els.copyLinkBtn.addEventListener('click', () => copyToClipboard(els.newLinkInput));
  els.copyDetailLinkBtn.addEventListener('click', () => copyToClipboard(els.playerDetailLink));

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
