// First-putt distance buckets, used to feed Strokes Gained: Putting
// (see Stats.EXPECTED_PUTTS_BY_BUCKET in stats.js). Bucketed rather than an
// exact number since a player can only eyeball it -- optional, so leaving it
// blank just excludes that hole from the SG:P calculation.
const PUTT_DISTANCE_OPTIONS = [
  { value: '', label: '—' },
  { value: '0-3', label: '0-3 ft' },
  { value: '3-10', label: '3-10 ft' },
  { value: '10-20', label: '10-20 ft' },
  { value: '20-30', label: '20-30 ft' },
  { value: '30-50', label: '30-50 ft' },
  { value: '50+', label: '50+ ft' }
];

// Tee-shot result on a par 4/5. Anything other than 'Y' counts as a missed
// fairway for Fairway % and SG: Off the Tee; the direction is recorded so a
// player (or coach) can see which way the misses tend to go.
const FAIRWAY_OPTIONS = [
  { value: 'Y', label: 'Hit' },
  { value: 'L', label: 'Left' },
  { value: 'R', label: 'Right' },
  { value: 'LONG', label: 'Long' },
  { value: 'SHORT', label: 'Short' }
];
// Rounds entered before miss directions existed stored a plain 'N'.
const LEGACY_FAIRWAY_MISS = { value: 'N', label: 'Miss' };

// Renders the editable hole-by-hole score table used on both the player
// entry form and the admin round-editor. Shared so the "par is locked when
// we know the real course, editable otherwise" behavior only lives in one
// place.
const HoleTable = {
  /**
   * @param {HTMLElement} tbody
   * @param {number[]} holes - hole numbers to render, e.g. [1..18] or [1..9]
   * @param {{pars: number[]}|null} courseData - if provided, pars[hole-1] is
   *   used and the Par input is locked; otherwise Par defaults to 4 and is editable.
   * @param {Object<number, {score:number, fairway:string, gir:string, putts:number, penalty:number}>} [existing] -
   *   prefill values keyed by hole number, used by the admin round editor.
   */
  render(tbody, holes, courseData, existing) {
    const locked = !!(courseData && courseData.pars);
    tbody.innerHTML = holes.map((h) => {
      const ex = existing && existing[h];
      const par = locked ? courseData.pars[h - 1] : (ex ? ex.par : 4);
      const isPar3 = Number(par) === 3;
      const fairwayVal = ex && ex.fairway && ex.fairway !== 'NA' ? ex.fairway : 'Y';
      const fairwayOptions = fairwayVal === LEGACY_FAIRWAY_MISS.value
        ? [...FAIRWAY_OPTIONS, LEGACY_FAIRWAY_MISS]
        : FAIRWAY_OPTIONS;
      const girVal = ex ? ex.gir : 'N';
      const puttDistanceVal = ex && ex.puttDistance != null ? ex.puttDistance : '';
      return `
      <tr data-hole="${h}">
        <td class="hole-num" data-label="Hole">${h}</td>
        <td data-label="Par"><input type="number" class="par" min="3" max="6" value="${par}" ${locked ? 'disabled' : ''} style="width:4.5em"></td>
        <td data-label="Score"><input type="number" class="score" min="1" max="20" value="${ex && ex.score != null ? ex.score : ''}" required style="width:4.5em"></td>
        <td data-label="Fairway">
          <select class="fairway" ${isPar3 ? 'disabled style="display:none"' : ''}>
            ${fairwayOptions.map((o) => `<option value="${o.value}" ${fairwayVal === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <span class="fairway-na muted" style="${isPar3 ? '' : 'display:none'}">—</span>
        </td>
        <td data-label="GIR">
          <select class="gir">
            <option value="Y" ${girVal === 'Y' ? 'selected' : ''}>Yes</option>
            <option value="N" ${girVal !== 'Y' ? 'selected' : ''}>No</option>
          </select>
        </td>
        <td data-label="Putts"><input type="number" class="putts" min="0" max="10" value="${ex && ex.putts != null ? ex.putts : ''}" style="width:4.5em"></td>
        <td data-label="Penalty"><input type="number" class="penalty" min="0" max="10" value="${ex && ex.penalty != null ? ex.penalty : 0}" style="width:4.5em"></td>
        <td data-label="1st Putt">
          <select class="putt-distance">
            ${PUTT_DISTANCE_OPTIONS.map((o) => `<option value="${o.value}" ${puttDistanceVal === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </td>
      </tr>`;
    }).join('');
    this.attachParListeners(tbody);
    this.syncFairwayVisibility(tbody);
  },

  // Attaches the "par changed" listener once per render, only on editable
  // (non-locked) par fields -- kept separate from syncFairwayVisibility so
  // re-syncing later (e.g. after applyCoursePars) never piles up duplicate
  // listeners.
  attachParListeners(tbody) {
    tbody.querySelectorAll('tr').forEach((tr) => {
      const par = tr.querySelector('.par');
      if (!par.disabled) {
        par.addEventListener('change', () => this.syncFairwayVisibility(tbody));
      }
    });
  },

  // Par-3 holes don't have a fairway to hit -- hide the fairway control
  // entirely (not just disable it) and show a "—" in its place.
  syncFairwayVisibility(tbody) {
    tbody.querySelectorAll('tr').forEach((tr) => {
      const par = tr.querySelector('.par');
      const fairway = tr.querySelector('.fairway');
      const naSpan = tr.querySelector('.fairway-na');
      const isPar3 = Number(par.value) === 3;
      fairway.disabled = isPar3;
      fairway.style.display = isPar3 ? 'none' : '';
      if (naSpan) naSpan.style.display = isPar3 ? '' : 'none';
    });
  },

  // Fills in Par for each hole from a course's verified scorecard without
  // touching anything else already entered (score, putts, etc.) -- used
  // when a coach picks a course but pars should stay editable, unlike the
  // player-side locked flow. No-op if the course has no verified pars.
  applyCoursePars(tbody, courseData) {
    if (!courseData || !courseData.pars) return;
    tbody.querySelectorAll('tr').forEach((tr) => {
      const hole = Number(tr.dataset.hole);
      const par = courseData.pars[hole - 1];
      if (par == null) return;
      tr.querySelector('.par').value = par;
    });
    this.syncFairwayVisibility(tbody);
  },

  updateRunningTotal(tbody, totalEl) {
    let total = 0;
    tbody.querySelectorAll('.score').forEach((input) => {
      total += Number(input.value) || 0;
    });
    totalEl.textContent = total;
  },

  collect(tbody) {
    return Array.from(tbody.querySelectorAll('tr')).map((tr) => {
      const fairway = tr.querySelector('.fairway');
      return {
        hole: Number(tr.dataset.hole),
        par: Number(tr.querySelector('.par').value),
        score: Number(tr.querySelector('.score').value),
        fairway: fairway.disabled ? 'NA' : fairway.value,
        gir: tr.querySelector('.gir').value,
        putts: tr.querySelector('.putts').value,
        penalty: tr.querySelector('.penalty').value,
        puttDistance: tr.querySelector('.putt-distance').value
      };
    });
  }
};
