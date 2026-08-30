(function () {
  const els = {
    loginCard: document.getElementById('loginCard'),
    loginForm: document.getElementById('loginForm'),
    loginMessage: document.getElementById('loginMessage'),
    loginBtn: document.getElementById('loginBtn'),
    password: document.getElementById('password'),
    dashboard: document.getElementById('dashboard'),
    teamTiles: document.getElementById('teamTiles'),
    addPlayerForm: document.getElementById('addPlayerForm'),
    addPlayerMessage: document.getElementById('addPlayerMessage'),
    newPlayerName: document.getElementById('newPlayerName'),
    newPlayerSex: document.getElementById('newPlayerSex'),
    newLinkBox: document.getElementById('newLinkBox'),
    newLinkInput: document.getElementById('newLinkInput'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    rosterTable: document.getElementById('rosterTable'),
    playerDetail: document.getElementById('playerDetail'),
    playerDetailName: document.getElementById('playerDetailName'),
    playerDetailLink: document.getElementById('playerDetailLink'),
    copyDetailLinkBtn: document.getElementById('copyDetailLinkBtn'),
    playerDetailTiles: document.getElementById('playerDetailTiles'),
    playerDetailRounds: document.getElementById('playerDetailRounds'),
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
    editTees: document.getElementById('editTees'),
    editIsTournament: document.getElementById('editIsTournament'),
    editNotes: document.getElementById('editNotes'),
    editHoleRows: document.getElementById('editHoleRows'),
    editRunningTotal: document.getElementById('editRunningTotal'),
    editSaveBtn: document.getElementById('editSaveBtn'),
    editCancelBtn: document.getElementById('editCancelBtn')
  };

  let currentPlayerToken = null;
  let editingRoundId = null;
  let sortKey = 'avg';
  let sortDir = 'asc';

  let session = sessionStorage.getItem('adminSession') || null;
  let data = { players: [], rounds: [], holeScores: [] };

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
    let agg = Stats.withRates(Stats.aggregateHoles(data.holeScores));
    agg = Stats.applyTournamentWeighting(agg, data.rounds, Stats.groupBy(data.holeScores, 'RoundID'));
    statTiles(els.teamTiles, [
      ['Players', data.players.length],
      ['Rounds Logged', data.rounds.length],
      ['Team Scoring Avg /18', Stats.fmtAvg(agg.scoringAvgPer18)],
      ['Team Fairways %', Stats.fmtPct(agg.fairwayPct)],
      ['Team GIR %', Stats.fmtPct(agg.girPct)],
      ['Team Putts /18', Stats.fmtAvg(agg.puttingAvgPer18)]
    ]);
  }

  // Column definitions for the sortable roster table: label shown in the
  // header, and how to pull a comparable value out of a computed row.
  // No Sex column here -- the roster is already split into Boys/Girls
  // tables, so it'd be redundant.
  const ROSTER_COLUMNS = [
    { key: 'name', label: 'Name', value: (row) => row.player.Name.toLowerCase() },
    { key: 'rounds', label: 'Rounds', value: (row) => row.rounds.length },
    { key: 'avg', label: 'Avg /18', value: (row) => row.agg.scoringAvgPer18 },
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
      <tbody>${sorted.map(({ player, rounds, agg }) => `
        <tr class="clickable" data-token="${escapeHtml(player.Token)}">
          <td>${escapeHtml(player.Name)}</td>
          <td>${rounds.length}</td>
          <td>${Stats.fmtAvg(agg.scoringAvgPer18)}</td>
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
    const roundsByPlayer = Stats.groupBy(data.rounds, 'PlayerToken');

    if (!data.players.length) {
      els.rosterTable.innerHTML = '<p class="muted">No players yet — add one above.</p>';
      return;
    }

    const rows = data.players.map((p) => {
      const rounds = roundsByPlayer[p.Token] || [];
      const holes = rounds.flatMap((r) => holesByRound[r.RoundID] || []);
      let agg = Stats.withRates(Stats.aggregateHoles(holes));
      agg = Stats.applyTournamentWeighting(agg, rounds, holesByRound);
      return { player: p, rounds, agg };
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
    const rounds = (Stats.groupBy(data.rounds, 'PlayerToken')[token] || [])
      .sort((a, b) => new Date(b.Date) - new Date(a.Date));
    const holesByRound = Stats.groupBy(data.holeScores, 'RoundID');
    const allHoles = rounds.flatMap((r) => holesByRound[r.RoundID] || []);
    let agg = Stats.withRates(Stats.aggregateHoles(allHoles));
    agg = Stats.applyTournamentWeighting(agg, rounds, holesByRound);

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
        <thead><tr><th>Date</th><th>Course</th><th>Tees</th><th>Holes</th><th>Score</th><th>Putts</th><th colspan="2"></th></tr></thead>
        <tbody>${rounds.map((r) => {
          const holes = holesByRound[r.RoundID] || [];
          const total = Stats.roundTotal(holes);
          const putts = holes.reduce((s, h) => s + (Number(h.Putts) || 0), 0);
          return `<tr>
            <td>${formatDate(r.Date)}${Stats.isTournamentRound(r) ? ' <span class="pill">Tournament</span>' : ''}</td>
            <td>${escapeHtml(r.Course)}</td>
            <td>${escapeHtml(r.Tees)}</td>
            <td>${r.HolesPlayed}</td>
            <td>${total}</td>
            <td>${putts}</td>
            <td><button type="button" class="secondary edit-round" data-round="${escapeHtml(r.RoundID)}">Edit</button></td>
            <td><button type="button" class="danger delete-round" data-round="${escapeHtml(r.RoundID)}">Delete</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
      els.playerDetailRounds.querySelectorAll('.delete-round').forEach((btn) => {
        btn.addEventListener('click', () => deleteRound(btn.dataset.round));
      });
      els.playerDetailRounds.querySelectorAll('.edit-round').forEach((btn) => {
        btn.addEventListener('click', () => openEditRound(btn.dataset.round));
      });
    }

    els.playerDetail.classList.remove('hidden');
    els.editRoundCard.classList.add('hidden');
    els.playerDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteRound(roundId) {
    if (!confirm('Delete this round? This cannot be undone.')) return;
    try {
      await Api.post({ action: 'deleteRound', session, roundId });
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

  function openEditRound(roundId) {
    const round = data.rounds.find((r) => r.RoundID === roundId);
    if (!round) return;
    editingRoundId = roundId;
    els.editRoundHeading.textContent = 'Edit Round';
    els.editSaveBtn.textContent = 'Save Changes';

    els.editRoundMessage.innerHTML = '';
    els.editDate.value = round.Date;
    els.editHolesPlayed.value = round.HolesPlayed;
    els.editTees.value = round.Tees || '';
    els.editIsTournament.checked = Stats.isTournamentRound(round);
    els.editNotes.value = round.Notes || '';

    populateCourseSelect(els.editCourseSelect, round.Course);
    const isOther = els.editCourseSelect.value === OTHER_COURSE_VALUE;
    els.editCourseOtherRow.classList.toggle('hidden', !isOther);
    els.editCourseOther.value = isOther ? round.Course : '';
    els.editCourseOtherCity.value = '';

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
    els.editTees.value = '';
    els.editIsTournament.checked = false;
    els.editNotes.value = '';

    populateCourseSelect(els.editCourseSelect);
    els.editCourseOtherRow.classList.toggle('hidden', els.editCourseSelect.value !== OTHER_COURSE_VALUE);
    els.editCourseOther.value = '';
    els.editCourseOtherCity.value = '';

    HoleTable.render(els.editHoleRows, holeRangeFor('18'), null, {});
    HoleTable.updateRunningTotal(els.editHoleRows, els.editRunningTotal);

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
    if (!confirm(`Delete ${name}? This permanently deletes every round and score they've entered. This cannot be undone.`)) return;
    try {
      await Api.post({ action: 'deletePlayer', session, token: currentPlayerToken });
      currentPlayerToken = null;
      await refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  async function refresh() {
    await loadData();
    renderTeamTiles();
    renderRoster();
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
    els.loginBtn.disabled = true;
    els.loginBtn.textContent = 'Logging in…';
    try {
      await login(els.password.value);
      await showDashboard();
    } catch (err) {
      els.loginMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    } finally {
      els.loginBtn.disabled = false;
      els.loginBtn.textContent = 'Log In';
    }
  });

  els.addPlayerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.addPlayerMessage.innerHTML = '';
    els.newLinkBox.classList.add('hidden');
    try {
      const result = await Api.post({ action: 'addPlayer', session, name: els.newPlayerName.value, sex: els.newPlayerSex.value });
      els.addPlayerMessage.innerHTML = `<div class="success">Added ${escapeHtml(els.newPlayerName.value)}.</div>`;
      els.newLinkInput.value = playerLink(result.Token);
      els.newLinkBox.classList.remove('hidden');
      els.addPlayerForm.reset();
      await refresh();
    } catch (err) {
      els.addPlayerMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
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
      await Api.post({ action: 'updatePlayer', session, token: currentPlayerToken, sex: els.playerDetailSexSelect.value });
      await refresh();
      if (currentPlayerToken) showPlayerDetail(currentPlayerToken);
    } catch (err) {
      alert(err.message);
    }
  });

  els.editCourseSelect.addEventListener('change', () => {
    els.editCourseOtherRow.classList.toggle('hidden', els.editCourseSelect.value !== OTHER_COURSE_VALUE);
  });

  els.editHolesPlayed.addEventListener('change', () => {
    HoleTable.render(els.editHoleRows, holeRangeFor(els.editHolesPlayed.value), null, {});
    HoleTable.updateRunningTotal(els.editHoleRows, els.editRunningTotal);
  });

  els.editHoleRows.addEventListener('input', (e) => {
    if (e.target.classList.contains('score')) HoleTable.updateRunningTotal(els.editHoleRows, els.editRunningTotal);
  });

  els.editCancelBtn.addEventListener('click', () => {
    editingRoundId = null;
    els.editRoundCard.classList.add('hidden');
  });

  els.addRoundBtn.addEventListener('click', openAddRound);

  els.editRoundForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.editRoundMessage.innerHTML = '';
    const isAdding = editingRoundId == null;
    els.editSaveBtn.disabled = true;
    els.editSaveBtn.textContent = isAdding ? 'Adding…' : 'Saving…';
    try {
      const course = editedCourseName();
      if (!course) throw new Error('Course is required.');
      const holes = HoleTable.collect(els.editHoleRows);
      for (const h of holes) {
        if (!h.par || !h.score) throw new Error(`Hole ${h.hole} needs a par and a score.`);
      }
      const payload = {
        date: els.editDate.value,
        course,
        tees: els.editTees.value,
        holesPlayed: els.editHolesPlayed.value,
        isTournament: els.editIsTournament.checked,
        notes: els.editNotes.value,
        holes
      };
      if (isAdding) {
        await Api.post(Object.assign({ action: 'submitRound', token: currentPlayerToken }, payload));
      } else {
        await Api.post(Object.assign({ action: 'updateRound', session, roundId: editingRoundId }, payload));
      }
      editingRoundId = null;
      els.editRoundCard.classList.add('hidden');
      await refresh();
      if (currentPlayerToken) showPlayerDetail(currentPlayerToken);
    } catch (err) {
      els.editRoundMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    } finally {
      els.editSaveBtn.disabled = false;
      els.editSaveBtn.textContent = isAdding ? 'Add Round' : 'Save Changes';
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
