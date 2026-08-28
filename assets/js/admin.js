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
    newLinkBox: document.getElementById('newLinkBox'),
    newLinkInput: document.getElementById('newLinkInput'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    rosterTable: document.getElementById('rosterTable'),
    playerDetail: document.getElementById('playerDetail'),
    playerDetailName: document.getElementById('playerDetailName'),
    playerDetailLink: document.getElementById('playerDetailLink'),
    copyDetailLinkBtn: document.getElementById('copyDetailLinkBtn'),
    playerDetailTiles: document.getElementById('playerDetailTiles'),
    playerDetailRounds: document.getElementById('playerDetailRounds')
  };

  let session = sessionStorage.getItem('adminSession') || null;
  let data = { players: [], rounds: [], holeScores: [] };

  function playerLink(token) {
    return new URL('player.html?token=' + encodeURIComponent(token), window.location.href).toString();
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
    const agg = Stats.withRates(Stats.aggregateHoles(data.holeScores));
    statTiles(els.teamTiles, [
      ['Players', data.players.length],
      ['Rounds Logged', data.rounds.length],
      ['Team Scoring Avg /18', Stats.fmtAvg(agg.scoringAvgPer18)],
      ['Team Fairways %', Stats.fmtPct(agg.fairwayPct)],
      ['Team GIR %', Stats.fmtPct(agg.girPct)],
      ['Team Putts /18', Stats.fmtAvg(agg.puttingAvgPer18)]
    ]);
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
      const agg = Stats.withRates(Stats.aggregateHoles(holes));
      return { player: p, rounds, agg };
    }).sort((a, b) => (a.agg.scoringAvgPer18 || 999) - (b.agg.scoringAvgPer18 || 999));

    els.rosterTable.innerHTML = `<table>
      <thead><tr>
        <th>Name</th><th>Rounds</th><th>Avg /18</th><th>Fairway %</th><th>GIR %</th>
        <th>Putts /18</th><th>Birdies+</th><th>Doubles</th><th>Worse</th><th>Status</th>
      </tr></thead>
      <tbody>${rows.map(({ player, rounds, agg }) => `
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

    els.rosterTable.querySelectorAll('tr[data-token]').forEach((tr) => {
      tr.addEventListener('click', () => showPlayerDetail(tr.dataset.token));
    });
  }

  function showPlayerDetail(token) {
    const player = data.players.find((p) => p.Token === token);
    if (!player) return;
    const rounds = (Stats.groupBy(data.rounds, 'PlayerToken')[token] || [])
      .sort((a, b) => new Date(b.Date) - new Date(a.Date));
    const holesByRound = Stats.groupBy(data.holeScores, 'RoundID');
    const allHoles = rounds.flatMap((r) => holesByRound[r.RoundID] || []);
    const agg = Stats.withRates(Stats.aggregateHoles(allHoles));

    els.playerDetailName.textContent = player.Name;
    els.playerDetailLink.value = playerLink(player.Token);
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
        <thead><tr><th>Date</th><th>Course</th><th>Tees</th><th>Holes</th><th>Score</th><th>Putts</th><th></th></tr></thead>
        <tbody>${rounds.map((r) => {
          const holes = holesByRound[r.RoundID] || [];
          const total = Stats.roundTotal(holes);
          const putts = holes.reduce((s, h) => s + (Number(h.Putts) || 0), 0);
          return `<tr>
            <td>${formatDate(r.Date)}</td>
            <td>${escapeHtml(r.Course)}</td>
            <td>${escapeHtml(r.Tees)}</td>
            <td>${r.HolesPlayed}</td>
            <td>${total}</td>
            <td>${putts}</td>
            <td><button type="button" class="danger delete-round" data-round="${escapeHtml(r.RoundID)}">Delete</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
      els.playerDetailRounds.querySelectorAll('.delete-round').forEach((btn) => {
        btn.addEventListener('click', () => deleteRound(btn.dataset.round));
      });
    }

    els.playerDetail.classList.remove('hidden');
    els.playerDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteRound(roundId) {
    if (!confirm('Delete this round? This cannot be undone.')) return;
    try {
      await Api.post({ action: 'deleteRound', session, roundId });
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
      const result = await Api.post({ action: 'addPlayer', session, name: els.newPlayerName.value });
      els.addPlayerMessage.innerHTML = `<div class="success">Added ${escapeHtml(els.newPlayerName.value)}.</div>`;
      els.newLinkInput.value = playerLink(result.Token);
      els.newLinkBox.classList.remove('hidden');
      els.addPlayerForm.reset();
      await refresh();
    } catch (err) {
      els.addPlayerMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
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
