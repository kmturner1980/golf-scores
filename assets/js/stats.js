// Approximate expected-putts-by-distance baseline, bucketed since a player
// can only eyeball first-putt distance (see the "1st Putt" column in
// HoleTable). Rough published PGA Tour-average figures. SG:Putting compares
// actual putts against this, so it's a "vs. tour average" number -- useful
// for tracking a player's trend and comparing teammates against each other,
// not literal parity with tour pros (high schoolers will run negative here,
// and that's expected).
const EXPECTED_PUTTS_BY_BUCKET = {
  '0-3': 1.02,
  '3-10': 1.3,
  '10-20': 1.5,
  '20-30': 1.75,
  '30-50': 1.95,
  '50+': 2.15
};

// Approximate expected-strokes-to-hole-out by distance (yards), a scratch-
// golfer baseline curve used for SG:OTT. We don't track exact yardages or
// tee-shot outcomes (just fairway hit/miss), so this is a rough model, not
// tour ShotLink data -- linear interpolation between the listed points.
const EXPECTED_STROKES_BY_YARDS = [
  [0, 0], [10, 1.0], [20, 1.4], [30, 1.6], [40, 1.7], [50, 1.8], [60, 1.9],
  [80, 2.1], [100, 2.4], [120, 2.5], [150, 2.8], [175, 2.9], [200, 3.0],
  [225, 3.2], [250, 3.5], [275, 3.6], [300, 3.8], [325, 3.9], [350, 4.0],
  [375, 4.1], [400, 4.2], [425, 4.3], [450, 4.4], [475, 4.5], [500, 4.6],
  [525, 4.7], [550, 4.8]
];

// Typical hole yardage by par, used for SG:OTT when a course doesn't have
// real per-tee yardages on file (see courses.js -- a `tees[].yardages`
// array, one entry per hole, is picked up automatically if a course ever
// gets one; today none do, so every course falls back to this).
const TYPICAL_YARDAGE_BY_PAR = { 3: 155, 4: 380, 5: 510 };

// Assumed typical drive distance (yards) by whether the tee shot found the
// fairway. There's no real distance-remaining data, so SG:OTT models it
// from this plus hole yardage -- a rough estimate, not a measurement.
const DRIVE_DISTANCE_BY_LIE = { hit: 200, miss: 165 };

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
      girCounted: 0,
      totalPutts: 0,
      puttsCounted: 0,
      totalPenalties: 0,
      sgPuttingSum: 0,
      sgPuttingHoles: 0
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
      // Hole-by-hole entry always has a GIR value (the control defaults to
      // "No"), so every counted hole counts toward the GIR% denominator.
      agg.girCounted++;
      if (h.GIR === 'Y') agg.girHit++;
      if (h.Putts !== '' && h.Putts != null && !isNaN(Number(h.Putts))) {
        agg.totalPutts += Number(h.Putts);
        agg.puttsCounted++;
      }
      if (h.Penalties) agg.totalPenalties += Number(h.Penalties) || 0;

      const expectedPutts = EXPECTED_PUTTS_BY_BUCKET[h.PuttDistance];
      if (expectedPutts != null && h.Putts !== '' && h.Putts != null && !isNaN(Number(h.Putts))) {
        agg.sgPuttingSum += expectedPutts - Number(h.Putts);
        agg.sgPuttingHoles++;
      }
    });

    return agg;
  },

  // Adds derived rates/averages on top of aggregateHoles() output.
  withRates(agg) {
    return Object.assign({}, agg, {
      fairwayPct: agg.fairwaysAttempted ? agg.fairwaysHit / agg.fairwaysAttempted : null,
      girPct: agg.girCounted ? agg.girHit / agg.girCounted : null,
      puttingAvgPerHole: agg.puttsCounted ? agg.totalPutts / agg.puttsCounted : null,
      puttingAvgPer18: agg.puttsCounted ? (agg.totalPutts / agg.puttsCounted) * 18 : null,
      scoringAvgPerHole: agg.holesPlayed ? agg.totalStrokes / agg.holesPlayed : null,
      scoringAvgPer18: agg.holesPlayed ? (agg.totalStrokes / agg.holesPlayed) * 18 : null,
      sgPuttingPerHole: agg.sgPuttingHoles ? agg.sgPuttingSum / agg.sgPuttingHoles : null,
      sgPuttingPer18: agg.sgPuttingHoles ? (agg.sgPuttingSum / agg.sgPuttingHoles) * 18 : null
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
      const provided = (v) => v !== '' && v != null;
      const num = (v) => (provided(v) ? Number(v) : 0);
      agg.holesPlayed += holes;
      agg.totalStrokes += num(r.SummaryScore);
      agg.fairwaysAttempted += num(r.SummaryFairwaysAttempted);
      agg.fairwaysHit += num(r.SummaryFairwaysHit);
      agg.girHit += num(r.SummaryGIR);
      agg.girCounted += provided(r.SummaryGIR) ? holes : 0;
      agg.totalPutts += num(r.SummaryPutts);
      agg.puttsCounted += provided(r.SummaryPutts) ? holes : 0;
      agg.totalPenalties += num(r.SummaryPenalties);
      agg.eagles += num(r.SummaryEagles);
      agg.birdies += num(r.SummaryBirdies);
      agg.pars += num(r.SummaryPars);
      agg.bogeys += num(r.SummaryBogeys);
      agg.doubles += num(r.SummaryDoubles);
      agg.worse += num(r.SummaryWorse);
    });

    return agg;
  },

  // Linear interpolation over EXPECTED_STROKES_BY_YARDS -- the scratch-
  // golfer baseline used by SG:OTT. Clamped at both ends of the table.
  expectedStrokesFromDistance(yards) {
    const table = EXPECTED_STROKES_BY_YARDS;
    if (yards <= table[0][0]) return table[0][1];
    for (let i = 1; i < table.length; i++) {
      const [y0, s0] = table[i - 1];
      const [y1, s1] = table[i];
      if (yards <= y1) return s0 + (s1 - s0) * (yards - y0) / (y1 - y0);
    }
    return table[table.length - 1][1];
  },

  // A hole's tee yardage for SG:OTT -- real per-tee yardage if the course
  // has one on file (courses.js), otherwise a typical distance for that par.
  holeYardage(hole, par, courseData, teeName) {
    if (courseData && courseData.tees && teeName) {
      const tee = courseData.tees.find((t) => t.name === teeName);
      if (tee && tee.yardages && tee.yardages[hole - 1] != null) return tee.yardages[hole - 1];
    }
    return TYPICAL_YARDAGE_BY_PAR[par] || TYPICAL_YARDAGE_BY_PAR[4];
  },

  /**
   * SG: Off the Tee for one round -- par 4/5 holes only (a par-3 tee shot is
   * an approach shot, not "off the tee", and we don't track it separately).
   * Needs each hole's Par and FairwayHit; models distance remaining after
   * the tee shot from an assumed drive distance rather than a measurement.
   * `findCourse(name)` should return the matching courses.js entry or null.
   */
  sgOffTeeForRound(round, holeRows, findCourse) {
    const courseData = findCourse ? findCourse(round.Course) : null;
    let sum = 0;
    let count = 0;
    holeRows.forEach((h) => {
      const par = Number(h.Par);
      if (par !== 4 && par !== 5) return;
      // 'Y' is a hit; any miss direction (or legacy plain 'N') is a miss.
      if (!h.FairwayHit || h.FairwayHit === 'NA') return;
      const teeYards = Stats.holeYardage(Number(h.Hole), par, courseData, round.Tees);
      const drive = h.FairwayHit === 'Y' ? DRIVE_DISTANCE_BY_LIE.hit : DRIVE_DISTANCE_BY_LIE.miss;
      const remaining = Math.max(teeYards - drive, 20);
      sum += Stats.expectedStrokesFromDistance(teeYards) - Stats.expectedStrokesFromDistance(remaining) - 1;
      count++;
    });
    return { sum, count };
  },

  // Aggregates SG:OTT across every hole-by-hole round (summary rounds have
  // no per-hole fairway data to work from, so they contribute nothing).
  aggregateOffTee(rounds, holesByRound, findCourse) {
    let sum = 0;
    let count = 0;
    rounds.filter((r) => !Stats.isSummaryRound(r)).forEach((r) => {
      const holeResult = Stats.sgOffTeeForRound(r, holesByRound[r.RoundID] || [], findCourse);
      sum += holeResult.sum;
      count += holeResult.count;
    });
    return {
      sgOffTeePerHole: count ? sum / count : null,
      sgOffTeePer18: count ? (sum / count) * 18 : null
    };
  },

  // Standard USGA-style score differential: how a round compares to scratch
  // once the tee's difficulty is normalized out. Needs a course rating and
  // slope rating for the tee played -- null if either is missing (e.g. an
  // "Other" course entered without them).
  scoreDifferential(round, holeRows) {
    const rating = round.CourseRating === '' || round.CourseRating == null ? null : Number(round.CourseRating);
    const slope = round.SlopeRating === '' || round.SlopeRating == null ? null : Number(round.SlopeRating);
    if (rating == null || !slope) return null;
    const { score } = Stats.roundScoreAndPar(round, holeRows);
    if (score == null) return null;
    return (113 / slope) * (score - rating);
  },

  // Average score differential across rounds, tournament-weighted the same
  // way scoring average is. Rounds missing a rating/slope are excluded
  // entirely (not treated as 0).
  averageDifferential(rounds, holesByRound) {
    let weightedSum = 0;
    let weightedCount = 0;
    rounds.forEach((r) => {
      const diff = Stats.scoreDifferential(r, holesByRound[r.RoundID] || []);
      if (diff == null) return;
      const weight = Stats.isTournamentRound(r) ? 2 : 1;
      weightedSum += diff * weight;
      weightedCount += weight;
    });
    return weightedCount ? weightedSum / weightedCount : null;
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

  fmtDiff(v) {
    if (v == null) return '—';
    return (v > 0 ? '+' : '') + v.toFixed(1);
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
