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
    date: document.getElementById('date'),
    courseSelect: document.getElementById('courseSelect'),
    courseOtherRow: document.getElementById('courseOtherRow'),
    courseOther: document.getElementById('courseOther'),
    courseOtherCity: document.getElementById('courseOtherCity'),
    courseHint: document.getElementById('courseHint'),
    isTournament: document.getElementById('isTournament'),
    entryModeHoles: document.getElementById('entryModeHoles'),
    entryModeSummary: document.getElementById('entryModeSummary'),
    holeByHoleSection: document.getElementById('holeByHoleSection'),
    summarySection: document.getElementById('summarySection'),
    summaryScore: document.getElementById('summaryScore'),
    summaryPar: document.getElementById('summaryPar'),
    summaryPutts: document.getElementById('summaryPutts'),
    summaryGIR: document.getElementById('summaryGIR'),
    summaryFairwaysHit: document.getElementById('summaryFairwaysHit'),
    summaryFairwaysAttempted: document.getElementById('summaryFairwaysAttempted'),
    summaryPenalties: document.getElementById('summaryPenalties')
  };

  let playerData = null;

  function populateCourseSelect() {
    const sorted = [...IDAHO_COURSES].sort((a, b) => a.name.localeCompare(b.name));
    const options = sorted.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${escapeHtml(c.city)})</option>`);
    els.courseSelect.innerHTML = options.join('') +
      `<option value="${OTHER_COURSE_VALUE}">Other / not listed (enter manually)</option>`;
    syncCourseOtherVisibility();
  }

  function syncCourseOtherVisibility() {
    const isOther = els.courseSelect.value === OTHER_COURSE_VALUE;
    els.courseOtherRow.classList.toggle('hidden', !isOther);
    els.courseOther.required = isOther;
  }

  function selectedCourseName() {
    if (els.courseSelect.value === OTHER_COURSE_VALUE) {
      const name = els.courseOther.value.trim();
      const city = els.courseOtherCity.value.trim();
      return city ? `${name} (${city})` : name;
    }
    return els.courseSelect.value;
  }

  // The matching IDAHO_COURSES entry for the current selection, or null if
  // "Other" is selected or the course has no verified par data on file.
  function selectedCourseData() {
    if (els.courseSelect.value === OTHER_COURSE_VALUE) return null;
    return IDAHO_COURSES.find((c) => c.name === els.courseSelect.value) || null;
  }

  function isSummaryMode() {
    return els.entryModeSummary.checked;
  }

  function syncEntryModeVisibility() {
    const summary = isSummaryMode();
    els.holeByHoleSection.classList.toggle('hidden', summary);
    els.summarySection.classList.toggle('hidden', !summary);
    // A required field inside a hidden section still blocks native form
    // submission, so the Score inputs must stop being required while
    // they're hidden.
    els.holeRows.querySelectorAll('.score').forEach((input) => { input.required = !summary; });
    if (summary) suggestSummaryPar();
  }

  // Convenience default (still editable): if the selected course has
  // verified pars, sum the par for the selected holes range so the player
  // doesn't have to add it up themselves.
  function suggestSummaryPar() {
    const courseData = selectedCourseData();
    if (!courseData || !courseData.pars || els.summaryPar.value) return;
    const holes = holeRangeFor(els.holesPlayed.value);
    const total = holes.reduce((sum, h) => sum + (courseData.pars[h - 1] || 0), 0);
    if (total) els.summaryPar.value = total;
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

  function renderHoleRows() {
    const holes = holeRangeFor(els.holesPlayed.value);
    const courseData = selectedCourseData();
    HoleTable.render(els.holeRows, holes, courseData && courseData.pars ? courseData : null);
    HoleTable.updateRunningTotal(els.holeRows, els.runningTotal);
    els.courseHint.textContent = courseData && courseData.pars
      ? 'Par is filled in automatically for this course.'
      : 'Enter the par for each hole below.';
  }

  function renderStatTiles(rounds, holeScores) {
    const holesByRound = Stats.groupBy(holeScores, 'RoundID');
    let agg = Stats.withRates(Stats.aggregateRounds(rounds, holesByRound));
    agg = Stats.applyTournamentWeighting(agg, rounds, holesByRound);
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
      const { score, par } = Stats.roundScoreAndPar(r, holes);
      const diff = par ? score - par : null;
      const diffStr = diff == null ? '' : (diff > 0 ? `+${diff}` : diff === 0 ? 'E' : diff);
      const badges = [
        Stats.isTournamentRound(r) ? '<span class="pill">Tournament</span>' : '',
        Stats.isSummaryRound(r) ? '<span class="pill">Totals</span>' : ''
      ].filter(Boolean).join(' ');
      return `<tr>
        <td>${formatDate(r.Date)} ${badges}</td>
        <td>${escapeHtml(r.Course)}</td>
        <td>${r.HolesPlayed}</td>
        <td>${score == null ? '—' : score} <span class="muted">${diffStr}</span></td>
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
      els.heading.textContent = playerData.player.name;
      els.subheading.textContent = 'Enter your round scores below';
      renderStatTiles(playerData.rounds, playerData.holeScores);
      renderRecentRounds(playerData.rounds, playerData.holeScores);
      els.content.classList.remove('hidden');
      els.date.value = new Date().toISOString().slice(0, 10);
      populateCourseSelect();
      renderHoleRows();
      syncEntryModeVisibility();
    } catch (err) {
      els.loadError.textContent = err.message;
      els.loadError.classList.remove('hidden');
    }
  }

  els.holesPlayed.addEventListener('change', () => {
    renderHoleRows();
    syncEntryModeVisibility();
  });
  els.courseSelect.addEventListener('change', () => {
    syncCourseOtherVisibility();
    renderHoleRows();
    syncEntryModeVisibility();
  });
  els.holeRows.addEventListener('input', (e) => {
    if (e.target.classList.contains('score')) HoleTable.updateRunningTotal(els.holeRows, els.runningTotal);
  });
  els.entryModeHoles.addEventListener('change', syncEntryModeVisibility);
  els.entryModeSummary.addEventListener('change', syncEntryModeVisibility);

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.formMessage.innerHTML = '';
    try {
      await UI.withBusy(els.submitBtn, 'Submitting…', async () => {
        const course = selectedCourseName();
        if (!course) throw new Error('Course is required.');

        const payload = {
          action: 'submitRound',
          token,
          date: els.date.value,
          course,
          tees: document.getElementById('tees').value,
          holesPlayed: els.holesPlayed.value,
          isTournament: els.isTournament.checked,
          notes: document.getElementById('notes').value
        };

        if (isSummaryMode()) {
          if (!els.summaryScore.value) throw new Error('Total score is required.');
          if (!els.summaryPar.value) throw new Error('Total par is required.');
          Object.assign(payload, {
            entryMode: 'summary',
            summaryHoles: holeRangeFor(els.holesPlayed.value).length,
            summaryScore: els.summaryScore.value,
            summaryPar: els.summaryPar.value,
            summaryPutts: els.summaryPutts.value,
            summaryGIR: els.summaryGIR.value,
            summaryFairwaysHit: els.summaryFairwaysHit.value,
            summaryFairwaysAttempted: els.summaryFairwaysAttempted.value,
            summaryPenalties: els.summaryPenalties.value
          });
        } else {
          const holes = HoleTable.collect(els.holeRows);
          for (const h of holes) {
            if (!h.par || !h.score) throw new Error(`Hole ${h.hole} needs a par and a score.`);
          }
          payload.holes = holes;
        }

        await Api.post(payload);
      });

      els.formMessage.innerHTML = '<div class="success">Round submitted. Nice work!</div>';
      els.form.reset();
      els.date.value = new Date().toISOString().slice(0, 10);
      syncCourseOtherVisibility();
      renderHoleRows();
      syncEntryModeVisibility();
      playerData = await Api.get({ action: 'getPlayer', token });
      renderStatTiles(playerData.rounds, playerData.holeScores);
      renderRecentRounds(playerData.rounds, playerData.holeScores);
    } catch (err) {
      els.formMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  load();
})();
