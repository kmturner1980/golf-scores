(function () {
  const token = new URLSearchParams(window.location.search).get('token');
  const els = {
    heading: document.getElementById('playerHeading'),
    subheading: document.getElementById('playerSubheading'),
    loadError: document.getElementById('loadError'),
    content: document.getElementById('content'),
    statTiles: document.getElementById('statTiles'),
    holeRows: document.getElementById('holeRows'),
    holesPlayed: document.getElementById('holesPlayed'),
    runningTotal: document.getElementById('runningTotal'),
    form: document.getElementById('roundForm'),
    formMessage: document.getElementById('formMessage'),
    submitBtn: document.getElementById('submitBtn'),
    recentRounds: document.getElementById('recentRounds'),
    date: document.getElementById('date')
  };

  let playerData = null;

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

  function renderHoleRows() {
    const holes = holeRangeFor(els.holesPlayed.value);
    els.holeRows.innerHTML = holes.map((h) => `
      <tr data-hole="${h}">
        <td>${h}</td>
        <td><input type="number" class="par" min="3" max="6" value="4" style="width:4.5em"></td>
        <td><input type="number" class="score" min="1" max="20" required style="width:4.5em"></td>
        <td>
          <select class="fairway">
            <option value="Y">Hit</option>
            <option value="N" selected>Miss</option>
          </select>
        </td>
        <td>
          <select class="gir">
            <option value="Y">Yes</option>
            <option value="N" selected>No</option>
          </select>
        </td>
        <td><input type="number" class="putts" min="0" max="10" style="width:4.5em"></td>
        <td><input type="number" class="penalty" min="0" max="10" value="0" style="width:4.5em"></td>
      </tr>
    `).join('');
    syncParHandling();
    updateRunningTotal();
  }

  function syncParHandling() {
    els.holeRows.querySelectorAll('tr').forEach((tr) => {
      const par = tr.querySelector('.par');
      const fairway = tr.querySelector('.fairway');
      const apply = () => {
        const isPar3 = Number(par.value) === 3;
        fairway.disabled = isPar3;
      };
      par.addEventListener('change', apply);
      apply();
    });
  }

  function updateRunningTotal() {
    let total = 0;
    els.holeRows.querySelectorAll('.score').forEach((input) => {
      total += Number(input.value) || 0;
    });
    els.runningTotal.textContent = total;
  }

  function collectHoles() {
    const rows = els.holeRows.querySelectorAll('tr');
    return Array.from(rows).map((tr) => ({
      hole: Number(tr.dataset.hole),
      par: Number(tr.querySelector('.par').value),
      score: Number(tr.querySelector('.score').value),
      fairway: tr.querySelector('.fairway').disabled ? 'NA' : tr.querySelector('.fairway').value,
      gir: tr.querySelector('.gir').value,
      putts: tr.querySelector('.putts').value,
      penalty: tr.querySelector('.penalty').value
    }));
  }

  function renderStatTiles(rounds, holeScores) {
    const agg = Stats.withRates(Stats.aggregateHoles(holeScores));
    const tiles = [
      ['Rounds', rounds.length],
      ['Scoring Avg /18', Stats.fmtAvg(agg.scoringAvgPer18)],
      ['Fairways %', Stats.fmtPct(agg.fairwayPct)],
      ['GIR %', Stats.fmtPct(agg.girPct)],
      ['Putts /18', Stats.fmtAvg(agg.puttingAvgPer18)],
      ['Birdies+', agg.birdies + agg.eagles],
      ['Doubles', agg.doubles],
      ['Worse than Dbl', agg.worse]
    ];
    els.statTiles.innerHTML = tiles.map(([label, value]) => `
      <div class="stat-tile"><div class="value">${value}</div><div class="label">${label}</div></div>
    `).join('');
  }

  function renderRecentRounds(rounds, holeScores) {
    const byRound = Stats.groupBy(holeScores, 'RoundID');
    const sorted = [...rounds].sort((a, b) => new Date(b.Date) - new Date(a.Date));
    if (!sorted.length) {
      els.recentRounds.innerHTML = '<p class="muted">No rounds entered yet.</p>';
      return;
    }
    const rowsHtml = sorted.map((r) => {
      const holes = byRound[r.RoundID] || [];
      const total = Stats.roundTotal(holes);
      const parTotal = holes.reduce((s, h) => s + (Number(h.Par) || 0), 0);
      const diff = parTotal ? total - parTotal : null;
      const diffStr = diff == null ? '' : (diff > 0 ? `+${diff}` : diff === 0 ? 'E' : diff);
      return `<tr>
        <td>${formatDate(r.Date)}</td>
        <td>${escapeHtml(r.Course)}</td>
        <td>${r.HolesPlayed}</td>
        <td>${total} <span class="muted">${diffStr}</span></td>
      </tr>`;
    }).join('');
    els.recentRounds.innerHTML = `<table>
      <thead><tr><th>Date</th><th>Course</th><th>Holes</th><th>Score</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;
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

  function escapeHtml(s) {
    return (s || '').toString().replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function load() {
    if (!token) {
      els.loadError.textContent = 'This link is missing a player token. Ask your coach for your personal link.';
      els.loadError.classList.remove('hidden');
      return;
    }
    try {
      playerData = await Api.get({ action: 'getPlayer', token });
      els.heading.textContent = `⛳ ${playerData.player.name}`;
      els.subheading.textContent = 'Enter your round scores below';
      renderStatTiles(playerData.rounds, playerData.holeScores);
      renderRecentRounds(playerData.rounds, playerData.holeScores);
      els.content.classList.remove('hidden');
      els.date.value = new Date().toISOString().slice(0, 10);
      renderHoleRows();
    } catch (err) {
      els.loadError.textContent = err.message;
      els.loadError.classList.remove('hidden');
    }
  }

  els.holesPlayed.addEventListener('change', renderHoleRows);
  els.holeRows.addEventListener('input', (e) => {
    if (e.target.classList.contains('score')) updateRunningTotal();
  });

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.formMessage.innerHTML = '';
    els.submitBtn.disabled = true;
    els.submitBtn.textContent = 'Submitting…';
    try {
      const holes = collectHoles();
      for (const h of holes) {
        if (!h.par || !h.score) throw new Error(`Hole ${h.hole} needs a par and a score.`);
      }
      await Api.post({
        action: 'submitRound',
        token,
        date: els.date.value,
        course: document.getElementById('course').value,
        tees: document.getElementById('tees').value,
        holesPlayed: els.holesPlayed.value,
        notes: document.getElementById('notes').value,
        holes
      });
      els.formMessage.innerHTML = '<div class="success">Round submitted. Nice work!</div>';
      els.form.reset();
      els.date.value = new Date().toISOString().slice(0, 10);
      renderHoleRows();
      playerData = await Api.get({ action: 'getPlayer', token });
      renderStatTiles(playerData.rounds, playerData.holeScores);
      renderRecentRounds(playerData.rounds, playerData.holeScores);
    } catch (err) {
      els.formMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    } finally {
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = 'Submit Round';
    }
  });

  load();
})();
