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
    formHeading: document.getElementById('formHeading'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    yearLockedNotice: document.getElementById('yearLockedNotice'),
    submitBtn: document.getElementById('submitBtn'),
    recentRounds: document.getElementById('recentRounds'),
    date: document.getElementById('date'),
    courseSelect: document.getElementById('courseSelect'),
    courseOtherRow: document.getElementById('courseOtherRow'),
    courseOther: document.getElementById('courseOther'),
    courseOtherCity: document.getElementById('courseOtherCity'),
    courseHint: document.getElementById('courseHint'),
    teeSelect: document.getElementById('teeSelect'),
    teeOtherRow: document.getElementById('teeOtherRow'),
    teeOther: document.getElementById('teeOther'),
    courseRating: document.getElementById('courseRating'),
    slopeRating: document.getElementById('slopeRating'),
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
    summaryPenalties: document.getElementById('summaryPenalties'),
    summaryEagles: document.getElementById('summaryEagles'),
    summaryBirdies: document.getElementById('summaryBirdies'),
    summaryPars: document.getElementById('summaryPars'),
    summaryBogeys: document.getElementById('summaryBogeys'),
    summaryDoubles: document.getElementById('summaryDoubles'),
    summaryWorse: document.getElementById('summaryWorse'),
    summaryHoleCheck: document.getElementById('summaryHoleCheck'),
    summaryHoleCheckTotal: document.getElementById('summaryHoleCheckTotal')
  };

  const SUMMARY_OUTCOME_FIELDS = [
    els.summaryEagles, els.summaryBirdies, els.summaryPars,
    els.summaryBogeys, els.summaryDoubles, els.summaryWorse
  ];

  let playerData = null;
  // RoundID of the round currently loaded into the form for editing, or
  // null when the form is entering a new round.
  let editingRoundId = null;

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

  // Repopulates the Tees dropdown from the currently selected course's
  // verified tee list (if any). Always keeps an "Other / manual" option.
  function populateTeeSelect() {
    const courseData = selectedCourseData();
    const tees = (courseData && courseData.tees) || [];
    const options = tees.map((t, i) =>
      `<option value="${i}">${escapeHtml(t.name)} (Rating ${t.rating} / Slope ${t.slope})</option>`);
    els.teeSelect.innerHTML = options.join('') +
      `<option value="${OTHER_TEE_VALUE}">Other / not listed (enter manually)</option>`;
    syncTeeOtherVisibility();
  }

  function syncTeeOtherVisibility() {
    els.teeOtherRow.classList.toggle('hidden', els.teeSelect.value !== OTHER_TEE_VALUE);
  }

  function selectedTee() {
    const courseData = selectedCourseData();
    if (els.teeSelect.value !== OTHER_TEE_VALUE) {
      const tee = courseData && courseData.tees && courseData.tees[Number(els.teeSelect.value)];
      if (tee) return { name: tee.name, rating: tee.rating, slope: tee.slope };
    }
    return { name: els.teeOther.value.trim(), rating: els.courseRating.value, slope: els.slopeRating.value };
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
    if (summary) {
      suggestSummaryPar();
      updateSummaryHoleCheck();
    }
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

  // Non-blocking self-check: how many of the holes played have an outcome
  // (eagle/birdie/.../worse) accounted for, vs. the holes actually played.
  function updateSummaryHoleCheck() {
    const total = holeRangeFor(els.holesPlayed.value).length;
    const accounted = SUMMARY_OUTCOME_FIELDS.reduce((sum, el) => sum + (Number(el.value) || 0), 0);
    els.summaryHoleCheck.textContent = accounted;
    els.summaryHoleCheckTotal.textContent = total;
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

  function renderHoleRows(existing) {
    const holes = holeRangeFor(els.holesPlayed.value);
    const courseData = selectedCourseData();
    HoleTable.render(els.holeRows, holes, courseData && courseData.pars ? courseData : null, existing);
    HoleTable.updateRunningTotal(els.holeRows, els.runningTotal);
    els.courseHint.textContent = courseData && courseData.pars
      ? 'Par is filled in automatically for this course.'
      : 'Enter the par for each hole below.';
  }

  function renderStatTiles(rounds, holeScores) {
    const holesByRound = Stats.groupBy(holeScores, 'RoundID');
    let agg = Stats.withRates(Stats.aggregateRounds(rounds, holesByRound));
    agg = Stats.applyTournamentWeighting(agg, rounds, holesByRound);
    Object.assign(agg, Stats.aggregateOffTee(rounds, holesByRound, findCourseByName));
    const avgDiff = Stats.averageDifferential(rounds, holesByRound);
    const tiles = [
      ['Rounds', rounds.length],
      ['Scoring Avg /18', Stats.fmtAvg(agg.scoringAvgPer18)],
      ['Avg Differential', Stats.fmtDiff(avgDiff)],
      ['Fairways %', Stats.fmtPct(agg.fairwayPct)],
      ['GIR %', Stats.fmtPct(agg.girPct)],
      ['Putts /18', Stats.fmtAvg(agg.puttingAvgPer18)],
      ['SG: Putting /18', Stats.fmtDiff(agg.sgPuttingPer18)],
      ['SG: Off the Tee /18', Stats.fmtDiff(agg.sgOffTeePer18)],
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
      const scoreDiff = Stats.scoreDifferential(r, holes);
      const badges = [
        Stats.isTournamentRound(r) ? '<span class="pill">Tournament</span>' : '',
        Stats.isSummaryRound(r) ? '<span class="pill">Totals</span>' : ''
      ].filter(Boolean).join(' ');
      const editCell = playerData && playerData.yearLocked ? '' :
        `<td><button type="button" class="secondary edit-round" data-round="${escapeHtml(r.RoundID)}">Edit</button></td>`;
      return `<tr>
        <td>${formatDate(r.Date)} ${badges}</td>
        <td>${escapeHtml(r.Course)}</td>
        <td>${r.HolesPlayed}</td>
        <td>${score == null ? '—' : score} <span class="muted">${diffStr}</span></td>
        <td>${Stats.fmtDiff(scoreDiff)}</td>
        ${editCell}
      </tr>`;
    }).join('');
    els.recentRounds.innerHTML = `<table>
      <thead><tr><th>Date</th><th>Course</th><th>Holes</th><th>Score</th><th>Differential</th>${playerData && playerData.yearLocked ? '' : '<th></th>'}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;
    els.recentRounds.querySelectorAll('.edit-round').forEach((btn) => {
      btn.addEventListener('click', () => openEditRound(btn.dataset.round));
    });
  }

  function toDateInputValue(d) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
    return m ? m[0] : '';
  }

  // Loads one of the player's own rounds back into the entry form so it
  // can be corrected and re-saved in place.
  function openEditRound(roundId) {
    const round = playerData.rounds.find((r) => r.RoundID === roundId);
    if (!round) return;
    resetForm();
    editingRoundId = roundId;
    els.formHeading.textContent = 'Edit Round';
    els.submitBtn.textContent = 'Save Changes';
    els.cancelEditBtn.classList.remove('hidden');

    els.date.value = toDateInputValue(round.Date);
    els.holesPlayed.value = String(round.HolesPlayed);
    els.isTournament.checked = Stats.isTournamentRound(round);
    document.getElementById('notes').value = round.Notes || '';

    const known = IDAHO_COURSES.some((c) => c.name === round.Course);
    els.courseSelect.value = known ? round.Course : OTHER_COURSE_VALUE;
    els.courseOther.value = known ? '' : (round.Course || '');
    els.courseOtherCity.value = '';
    syncCourseOtherVisibility();

    populateTeeSelect();
    const tees = (selectedCourseData() || {}).tees || [];
    const teeIdx = tees.findIndex((t) => t.name === round.Tees);
    els.teeSelect.value = teeIdx === -1 ? OTHER_TEE_VALUE : String(teeIdx);
    if (teeIdx === -1) {
      els.teeOther.value = round.Tees || '';
      els.courseRating.value = round.CourseRating != null ? round.CourseRating : '';
      els.slopeRating.value = round.SlopeRating != null ? round.SlopeRating : '';
    }
    syncTeeOtherVisibility();

    const summary = Stats.isSummaryRound(round);
    els.entryModeHoles.checked = !summary;
    els.entryModeSummary.checked = summary;
    if (summary) {
      els.summaryScore.value = round.SummaryScore;
      els.summaryPar.value = round.SummaryPar;
      els.summaryPutts.value = round.SummaryPutts;
      els.summaryGIR.value = round.SummaryGIR;
      els.summaryFairwaysHit.value = round.SummaryFairwaysHit;
      els.summaryFairwaysAttempted.value = round.SummaryFairwaysAttempted;
      els.summaryPenalties.value = round.SummaryPenalties;
      els.summaryEagles.value = round.SummaryEagles;
      els.summaryBirdies.value = round.SummaryBirdies;
      els.summaryPars.value = round.SummaryPars;
      els.summaryBogeys.value = round.SummaryBogeys;
      els.summaryDoubles.value = round.SummaryDoubles;
      els.summaryWorse.value = round.SummaryWorse;
    }

    const existing = {};
    (Stats.groupBy(playerData.holeScores, 'RoundID')[roundId] || []).forEach((h) => {
      existing[Number(h.Hole)] = {
        par: h.Par,
        score: h.Score,
        fairway: h.FairwayHit,
        gir: h.GIR,
        putts: h.Putts,
        penalty: h.Penalties,
        puttDistance: h.PuttDistance
      };
    });
    renderHoleRows(existing);
    syncEntryModeVisibility();
    els.formHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Back to a blank "Enter a Round" form (after submit, or cancelling an edit).
  function resetForm() {
    editingRoundId = null;
    els.formHeading.textContent = 'Enter a Round';
    els.submitBtn.textContent = 'Submit Round';
    els.cancelEditBtn.classList.add('hidden');
    els.form.reset();
    els.date.value = new Date().toISOString().slice(0, 10);
    syncCourseOtherVisibility();
    renderHoleRows();
    populateTeeSelect();
    syncEntryModeVisibility();
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
      // A locked season blocks new submissions server-side regardless, but
      // hiding the form instead of letting someone fill it out and fail at
      // the end is much less frustrating.
      els.form.classList.toggle('hidden', !!playerData.yearLocked);
      els.yearLockedNotice.classList.toggle('hidden', !playerData.yearLocked);
      if (!playerData.yearLocked) {
        els.date.value = new Date().toISOString().slice(0, 10);
        populateCourseSelect();
        populateTeeSelect();
        renderHoleRows();
        syncEntryModeVisibility();
      }
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
    populateTeeSelect();
    syncEntryModeVisibility();
  });
  els.teeSelect.addEventListener('change', syncTeeOtherVisibility);
  els.cancelEditBtn.addEventListener('click', () => {
    els.formMessage.innerHTML = '';
    resetForm();
  });
  els.holeRows.addEventListener('input', (e) => {
    if (e.target.classList.contains('score')) HoleTable.updateRunningTotal(els.holeRows, els.runningTotal);
  });
  els.entryModeHoles.addEventListener('change', syncEntryModeVisibility);
  els.entryModeSummary.addEventListener('change', syncEntryModeVisibility);
  SUMMARY_OUTCOME_FIELDS.forEach((el) => el.addEventListener('input', updateSummaryHoleCheck));

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.formMessage.innerHTML = '';
    const wasEditing = !!editingRoundId;
    try {
      await UI.withBusy(els.submitBtn, wasEditing ? 'Saving…' : 'Submitting…', async () => {
        const course = selectedCourseName();
        if (!course) throw new Error('Course is required.');
        const tee = selectedTee();

        const payload = {
          action: wasEditing ? 'updatePlayerRound' : 'submitRound',
          roundId: editingRoundId || undefined,
          token,
          date: els.date.value,
          course,
          tees: tee.name,
          courseRating: tee.rating,
          slopeRating: tee.slope,
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
            summaryPenalties: els.summaryPenalties.value,
            summaryEagles: els.summaryEagles.value,
            summaryBirdies: els.summaryBirdies.value,
            summaryPars: els.summaryPars.value,
            summaryBogeys: els.summaryBogeys.value,
            summaryDoubles: els.summaryDoubles.value,
            summaryWorse: els.summaryWorse.value
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

      els.formMessage.innerHTML = wasEditing
        ? '<div class="success">Round updated.</div>'
        : '<div class="success">Round submitted. Nice work!</div>';
      resetForm();
      playerData = await Api.get({ action: 'getPlayer', token });
      renderStatTiles(playerData.rounds, playerData.holeScores);
      renderRecentRounds(playerData.rounds, playerData.holeScores);
    } catch (err) {
      els.formMessage.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  });

  load();
})();
