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

  // Sheets can round-trip a checkbox as a real boolean or as the strings
  // "TRUE"/"true" depending on how the cell was written -- handle both.
  isTournamentRound(round) {
    return round.IsTournament === true || round.IsTournament === 'TRUE' || round.IsTournament === 'true';
  },

  isSummaryRound(round) {
    return round.EntryMode === 'summary';
  },

  // HolesPlayed is stored as "18", "9F", or "9B" (the front/back distinction
  // only matters for rendering the hole-by-hole table) -- this just wants
  // the count.
  holesCountFor(round) {
    return Number(round.HolesPlayed === '9F' || round.HolesPlayed === '9B' ? 9 : round.HolesPlayed) || 0;
  },

  // The score and par for one round regardless of how it was entered --
  // from its hole rows for a normal round, from the typed totals for a
  // summary-only one.
  roundScoreAndPar(round, holeRows) {
    if (Stats.isSummaryRound(round)) {
      return {
        score: round.SummaryScore === '' || round.SummaryScore == null ? null : Number(round.SummaryScore),
        par: round.SummaryPar === '' || round.SummaryPar == null ? null : Number(round.SummaryPar)
      };
    }
    const score = Stats.roundTotal(holeRows);
    const par = holeRows.reduce((s, h) => s + (Number(h.Par) || 0), 0);
    return { score, par: par || null };
  },

  roundPutts(round, holeRows) {
    if (Stats.isSummaryRound(round)) {
      return round.SummaryPutts === '' || round.SummaryPutts == null ? null : Number(round.SummaryPutts);
    }
    return holeRows.reduce((s, h) => s + (Number(h.Putts) || 0), 0);
  },

  /**
   * Combines aggregateHoles() over every hole-by-hole round with the typed
   * totals from any summary-only rounds, into one agg in the same shape.
   * Summary rounds can't contribute to per-hole breakdowns (eagles, birdies,
   * pars, bogeys, doubles, worse) since there's no hole-by-hole detail to
   * classify -- only to the totals (strokes, fairways, GIR, putts,
   * penalties). `holesByRound` is Stats.groupBy(holeScores, 'RoundID').
   */
  aggregateRounds(rounds, holesByRound) {
    const holeByHoleRounds = rounds.filter((r) => !Stats.isSummaryRound(r));
    const summaryRounds = rounds.filter(Stats.isSummaryRound);
    const agg = Stats.aggregateHoles(holeByHoleRounds.flatMap((r) => holesByRound[r.RoundID] || []));

    summaryRounds.forEach((r) => {
      const holes = Stats.holesCountFor(r);
      const num = (v) => (v === '' || v == null ? 0 : Number(v));
      agg.holesPlayed += holes;
      agg.totalStrokes += num(r.SummaryScore);
      agg.fairwaysAttempted += num(r.SummaryFairwaysAttempted);
      agg.fairwaysHit += num(r.SummaryFairwaysHit);
      agg.girHit += num(r.SummaryGIR);
      agg.totalPutts += num(r.SummaryPutts);
      agg.puttsCounted += num(r.SummaryPutts) ? holes : 0;
      agg.totalPenalties += num(r.SummaryPenalties);
    });

    return agg;
  },

  /**
   * Recomputes scoring average so tournament rounds count double, leaving
   * every other stat on `agg` (fairway%, GIR%, putting, birdie/bogey counts,
   * etc.) untouched -- only "average scoring" is meant to be weighted.
   * `holesByRound` is Stats.groupBy(holeScores, 'RoundID'). Handles a mix of
   * hole-by-hole and summary-only rounds.
   */
  applyTournamentWeighting(agg, rounds, holesByRound) {
    let weightedStrokes = 0;
    let weightedHoles = 0;
    rounds.forEach((r) => {
      const weight = Stats.isTournamentRound(r) ? 2 : 1;
      const { score } = Stats.roundScoreAndPar(r, holesByRound[r.RoundID] || []);
      const holeCount = Stats.isSummaryRound(r)
        ? Stats.holesCountFor(r)
        : (holesByRound[r.RoundID] || []).filter((h) => Number(h.Par) && Number(h.Score)).length;
      weightedStrokes += (score || 0) * weight;
      weightedHoles += holeCount * weight;
    });
    return Object.assign({}, agg, {
      scoringAvgPerHole: weightedHoles ? weightedStrokes / weightedHoles : null,
      scoringAvgPer18: weightedHoles ? (weightedStrokes / weightedHoles) * 18 : null
    });
  },

  fmtPct(v) {
    return v == null ? '—' : Math.round(v * 100) + '%';
  },

  fmtAvg(v) {
    return v == null ? '—' : v.toFixed(1);
  },

  /**
   * Rule-of-thumb coaching callouts derived from a player's aggregated
   * stats (pass the output of withRates(aggregateHoles(...))). These
   * thresholds are reasonable defaults for high school golf, not a
   * scientific standard -- a coach should use judgment alongside them.
   * Returns an array of {area, tip, severity}, worst issues first.
   */
  generateAdvice(agg) {
    const MIN_HOLES = 9;
    if (!agg.holesPlayed || agg.holesPlayed < MIN_HOLES) {
      return [{ area: 'Sample size', tip: 'Not enough holes logged yet for reliable advice -- encourage a few more rounds entered first.', severity: 'info' }];
    }

    const notes = [];
    const bigNumberRate = (agg.doubles + agg.worse) / agg.holesPlayed;
    const penaltiesPerHole = agg.totalPenalties / agg.holesPlayed;

    if (agg.puttsCounted >= MIN_HOLES && agg.puttingAvgPer18 != null) {
      if (agg.puttingAvgPer18 >= 36) {
        notes.push({ area: 'Putting', tip: `Averaging ${agg.puttingAvgPer18.toFixed(1)} putts per 18 -- that's high. Prioritize putting practice: lag putts from 20-30 ft and cleaning up the 3-5 ft range.`, severity: 'high' });
      } else if (agg.puttingAvgPer18 >= 33) {
        notes.push({ area: 'Putting', tip: `Putting average (${agg.puttingAvgPer18.toFixed(1)}/18) has room to improve -- more short-game reps on the practice green.`, severity: 'medium' });
      }
    }

    if (bigNumberRate >= 0.25) {
      notes.push({ area: 'Course management', tip: `Double bogey or worse on ${Math.round(bigNumberRate * 100)}% of holes -- focus on course management: take the safe play near trouble instead of chasing a risky shot.`, severity: 'high' });
    } else if (bigNumberRate >= 0.15) {
      notes.push({ area: 'Course management', tip: `Occasional big numbers (${Math.round(bigNumberRate * 100)}% of holes are double bogey or worse) -- work on recognizing when to play conservatively.`, severity: 'medium' });
    }

    if (agg.fairwaysAttempted >= MIN_HOLES && agg.fairwayPct != null) {
      if (agg.fairwayPct < 0.40) {
        notes.push({ area: 'Driving accuracy', tip: `Hitting only ${Math.round(agg.fairwayPct * 100)}% of fairways -- spend practice time on tee shot consistency, and consider clubbing down for accuracy on tight holes.`, severity: 'high' });
      } else if (agg.fairwayPct < 0.55) {
        notes.push({ area: 'Driving accuracy', tip: `Fairway accuracy (${Math.round(agg.fairwayPct * 100)}%) is a bit below a solid target of ~55-60% -- keep working on tee shot repeatability.`, severity: 'medium' });
      }
    }

    if (agg.girPct != null) {
      if (agg.girPct < 0.25) {
        notes.push({ area: 'Approach shots', tip: `Greens in regulation is low (${Math.round(agg.girPct * 100)}%) -- focus on iron/approach practice and distance control.`, severity: 'high' });
      } else if (agg.girPct < 0.40) {
        notes.push({ area: 'Approach shots', tip: `GIR (${Math.round(agg.girPct * 100)}%) has room to grow -- more approach-shot practice should help lower scores.`, severity: 'medium' });
      }
    }

    if (penaltiesPerHole >= 0.2) {
      notes.push({ area: 'Hazard avoidance', tip: `Averaging a penalty stroke roughly every ${Math.round(1 / penaltiesPerHole)} holes -- work on course management around water/OB and picking safer targets off the tee.`, severity: 'high' });
    } else if (penaltiesPerHole >= 0.1) {
      notes.push({ area: 'Hazard avoidance', tip: 'Penalty strokes are creeping in -- stay mindful of hazards on tee shots.', severity: 'medium' });
    }

    const severityRank = { high: 0, medium: 1, info: 2 };
    notes.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    if (!notes.length) {
      return [{ area: 'Overall', tip: 'Well-rounded game right now -- no single weak spot stands out. Keep up the current practice mix.', severity: 'info' }];
    }
    return notes;
  }
};
