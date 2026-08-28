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
      const fairwayVal = ex ? ex.fairway : 'N';
      const girVal = ex ? ex.gir : 'N';
      return `
      <tr data-hole="${h}">
        <td>${h}</td>
        <td><input type="number" class="par" min="3" max="6" value="${par}" ${locked ? 'disabled' : ''} style="width:4.5em"></td>
        <td><input type="number" class="score" min="1" max="20" value="${ex && ex.score != null ? ex.score : ''}" required style="width:4.5em"></td>
        <td>
          <select class="fairway" ${isPar3 ? 'disabled' : ''}>
            <option value="Y" ${fairwayVal === 'Y' ? 'selected' : ''}>Hit</option>
            <option value="N" ${fairwayVal !== 'Y' ? 'selected' : ''}>Miss</option>
          </select>
        </td>
        <td>
          <select class="gir">
            <option value="Y" ${girVal === 'Y' ? 'selected' : ''}>Yes</option>
            <option value="N" ${girVal !== 'Y' ? 'selected' : ''}>No</option>
          </select>
        </td>
        <td><input type="number" class="putts" min="0" max="10" value="${ex && ex.putts != null ? ex.putts : ''}" style="width:4.5em"></td>
        <td><input type="number" class="penalty" min="0" max="10" value="${ex && ex.penalty != null ? ex.penalty : 0}" style="width:4.5em"></td>
      </tr>`;
    }).join('');
    this.syncParHandling(tbody);
  },

  // Keeps the Fairway column disabled (par-3s don't have a fairway) and, for
  // unlocked/editable par fields, re-checks that whenever par changes.
  syncParHandling(tbody) {
    tbody.querySelectorAll('tr').forEach((tr) => {
      const par = tr.querySelector('.par');
      const fairway = tr.querySelector('.fairway');
      const apply = () => {
        fairway.disabled = Number(par.value) === 3;
      };
      if (!par.disabled) par.addEventListener('change', apply);
      apply();
    });
  },

  updateRunningTotal(tbody, totalEl) {
    let total = 0;
    tbody.querySelectorAll('.score').forEach((input) => {
      total += Number(input.value) || 0;
    });
    totalEl.textContent = total;
  },

  collect(tbody) {
    return Array.from(tbody.querySelectorAll('tr')).map((tr) => ({
      hole: Number(tr.dataset.hole),
      par: Number(tr.querySelector('.par').value),
      score: Number(tr.querySelector('.score').value),
      fairway: tr.querySelector('.fairway').disabled ? 'NA' : tr.querySelector('.fairway').value,
      gir: tr.querySelector('.gir').value,
      putts: tr.querySelector('.putts').value,
      penalty: tr.querySelector('.penalty').value
    }));
  }
};
