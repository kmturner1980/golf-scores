// Pure functions for turning raw hole-score rows into the stats coaches
// care about. Shared between player.html (personal stats) and admin.html
// (roster + per-player stats), so all the math lives in exactly one place.
const Stats = {
  classifyHole(par, score) {
    const diff = score - par;
    if (diff <= -2) return 'eagle';
    if (diff === -1) return 'birdie';
    if (diff === 0) return 'par';
    if (diff === 1) return 'bogey';
    if (diff === 2) return 'double';
    return 'worse';
  },

  groupBy(rows, key) {
    const out = {};
    rows.forEach((r) => {
      const k = r[key];
      (out[k] = out[k] || []).push(r);
    });
    return out;
  },

  // holeRows: array of {Par, Score, FairwayHit, GIR, Putts, Penalties}
  aggregateHoles(holeRows) {
    const agg = {
      holesPlayed: 0,
      totalStrokes: 0,
      eagles: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      doubles: 0,
      worse: 0,
      fairwaysHit: 0,
      fairwaysAttempted: 0,
      girHit: 0,
      totalPutts: 0,
      puttsCounted: 0,
      totalPenalties: 0
    };
    const bucket = { eagle: 'eagles', birdie: 'birdies', par: 'pars', bogey: 'bogeys', double: 'doubles', worse: 'worse' };

    holeRows.forEach((h) => {
      const par = Number(h.Par);
      const score = Number(h.Score);
      if (!par || !score) return;
      agg.holesPlayed++;
      agg.totalStrokes += score;
      agg[bucket[Stats.classifyHole(par, score)]]++;

      if (par !== 3) {
        agg.fairwaysAttempted++;
        if (h.FairwayHit === 'Y') agg.fairwaysHit++;
      }
      if (h.GIR === 'Y') agg.girHit++;
      if (h.Putts !== '' && h.Putts != null && !isNaN(Number(h.Putts))) {
        agg.totalPutts += Number(h.Putts);
        agg.puttsCounted++;
      }
      if (h.Penalties) agg.totalPenalties += Number(h.Penalties) || 0;
    });

    return agg;
  },

  // Adds derived rates/averages on top of aggregateHoles() output.
  withRates(agg) {
    return Object.assign({}, agg, {
      fairwayPct: agg.fairwaysAttempted ? agg.fairwaysHit / agg.fairwaysAttempted : null,
      girPct: agg.holesPlayed ? agg.girHit / agg.holesPlayed : null,
      puttingAvgPerHole: agg.puttsCounted ? agg.totalPutts / agg.puttsCounted : null,
      puttingAvgPer18: agg.puttsCounted ? (agg.totalPutts / agg.puttsCounted) * 18 : null,
      scoringAvgPerHole: agg.holesPlayed ? agg.totalStrokes / agg.holesPlayed : null,
      scoringAvgPer18: agg.holesPlayed ? (agg.totalStrokes / agg.holesPlayed) * 18 : null
    });
  },

  roundTotal(holeRows) {
    return holeRows.reduce((sum, h) => sum + (Number(h.Score) || 0), 0);
  },

  fmtPct(v) {
    return v == null ? '—' : Math.round(v * 100) + '%';
  },

  fmtAvg(v) {
    return v == null ? '—' : v.toFixed(1);
  }
};
