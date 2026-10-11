// HUSH: rules of the night garden, shared by the game and the solver.
// Time advances in discrete breaths so every level is a finite, searchable game.
(function (root) {
  'use strict';

  const DEATH = 10;
  // Bloom (the visible signal) as a function of thirst 0..9.
  // 'fold' flowers open with thirst, peak at 6, then close again as they wilt: the signal folds back.
  // 'mono' flowers just keep opening until they die.
  const BLOOM = {
    fold: [0, 1, 2, 3, 4, 5, 6, 4, 2, 1],
    mono: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  };
  const BLOOM_MAX = { fold: 6, mono: 9 };
  const DOSE = 4;            // water removes this much thirst
  const DISTRESS = 0.6;      // the Owl calls a flower neglected if its bloom fraction is at least this
  const CLOCHE = 6;          // breaths of glass after passing an inspection
  const OWL_REST = 2;        // breaths the Owl rests after an inspection
  const PASS = 1, CAUGHT = -2;

  function bloomOf(kind, t) { return t >= DEATH ? 0 : BLOOM[kind][t]; }
  function bloomFrac(kind, t) { return bloomOf(kind, t) / BLOOM_MAX[kind]; }
  function distressed(f) { return f.alive && bloomFrac(f.kind, f.t) >= DISTRESS - 1e-9; }

  // A level is plain data:
  // { name, length, water:{start,max,regen}, rating:{target}, owl:bool,
  //   flowers:[{kind, t, rate, offset}], gusts:[{at, f, amount}], visits:[{at, f}] }
  function init(level) {
    return {
      breath: 0,
      flowers: level.flowers.map(f => ({ kind: f.kind, t: f.t, rate: f.rate, offset: f.offset || 0, alive: true, cloche: 0 })),
      water: level.water.start,
      owl: { mode: 'idle', target: -1, rest: 0 },
      rating: 0,
      caught: 0,
      passes: 0,
      lost: false,
      events: [],
    };
  }

  function clone(s) {
    return {
      breath: s.breath,
      flowers: s.flowers.map(f => ({ kind: f.kind, t: f.t, rate: f.rate, offset: f.offset, alive: f.alive, cloche: f.cloche })),
      water: s.water,
      owl: { mode: s.owl.mode, target: s.owl.target, rest: s.owl.rest },
      rating: s.rating,
      caught: s.caught,
      passes: s.passes,
      lost: s.lost,
      events: [],
    };
  }

  function canWater(s, i) { const f = s.flowers[i]; return !s.lost && s.water >= 1 && f.alive && f.cloche === 0; }
  function canSummon(level, s, i) {
    const f = s.flowers[i];
    return !s.lost && level.owl && s.owl.mode === 'idle' && f.alive && f.cloche === 0;
  }

  // Actions happen between breaths and take effect immediately.
  function water(s, i) {
    const f = s.flowers[i];
    const before = bloomOf(f.kind, f.t);
    f.t = Math.max(0, f.t - DOSE);
    s.water -= 1;
    s.events.push({ type: 'water', f: i, before, after: bloomOf(f.kind, f.t) });
  }
  function summon(s, i) {
    s.owl.mode = 'flying';
    s.owl.target = i;
    s.events.push({ type: 'summon', f: i });
  }

  function inspect(s, i) {
    const f = s.flowers[i];
    if (!f.alive || f.cloche > 0) { s.events.push({ type: 'inspect-void', f: i }); return; }
    if (distressed(f)) {
      s.rating += CAUGHT;
      s.caught += 1;
      s.events.push({ type: 'caught', f: i });
    } else {
      s.rating += PASS;
      s.passes += 1;
      f.cloche = CLOCHE;
      s.events.push({ type: 'pass', f: i });
    }
  }

  // One breath of the world.
  function tick(level, s) {
    const b = s.breath;
    s.events = [];
    // Owl: arrive and inspect, rest, or answer the patrol schedule.
    if (s.owl.mode === 'flying') {
      inspect(s, s.owl.target);
      s.owl.mode = 'resting';
      s.owl.rest = OWL_REST;
    } else if (s.owl.mode === 'resting') {
      s.owl.rest -= 1;
      if (s.owl.rest <= 0) { s.owl.mode = 'idle'; s.owl.target = -1; }
    }
    if (level.owl && s.owl.mode === 'idle') {
      const v = (level.visits || []).find(v => v.at === b);
      if (v && s.flowers[v.f].alive && s.flowers[v.f].cloche === 0) {
        s.owl.mode = 'flying'; s.owl.target = v.f;
        s.events.push({ type: 'patrol', f: v.f });
      }
    } else if (level.owl) {
      const v = (level.visits || []).find(v => v.at === b);
      if (v) s.events.push({ type: 'patrol-missed', f: v.f });
    }
    // Gusts push thirst up; glass shelters.
    for (const g of level.gusts || []) {
      if (g.at !== b) continue;
      const f = s.flowers[g.f];
      if (!f.alive) continue;
      if (f.cloche > 0) { s.events.push({ type: 'gust-blocked', f: g.f }); continue; }
      const before = bloomOf(f.kind, f.t);
      f.t = Math.min(DEATH, f.t + (g.amount || 4));
      s.events.push({ type: 'gust', f: g.f, before, after: bloomOf(f.kind, f.t) });
    }
    // Thirst rises on each flower's own rhythm.
    s.flowers.forEach(f => {
      if (!f.alive) return;
      if ((b + f.offset) % f.rate === f.rate - 1) f.t = Math.min(DEATH, f.t + 1);
    });
    // Deaths. A death under glass is a scandal: it was certified.
    s.flowers.forEach((f, i) => {
      if (f.alive && f.t >= DEATH) {
        f.alive = false;
        s.lost = true;
        s.events.push({ type: f.cloche > 0 ? 'scandal' : 'death', f: i });
      }
    });
    s.flowers.forEach(f => { if (f.cloche > 0) f.cloche -= 1; });
    const W = level.water;
    if (W.regen && (b + 1) % W.regen === 0) s.water = Math.min(W.max, s.water + 1);
    s.breath = b + 1;
    return s;
  }

  // What the player can see coming: Owl rounds and gusts due within `ahead` breaths.
  function upcoming(level, s, ahead = 2) {
    const b = s.breath;
    const visits = (level.owl ? level.visits || [] : []).filter(v => v.at >= b && v.at < b + ahead);
    const gusts = (level.gusts || []).filter(g => g.at >= b && g.at < b + ahead);
    return { visits, gusts };
  }

  function finished(level, s) { return s.lost || s.breath >= level.length; }
  // Win: every flower alive at dawn and the Owl never caught a neglected flower.
  function won(level, s) {
    return !s.lost && s.breath >= level.length && s.flowers.every(f => f.alive) && s.caught === 0;
  }
  // Stars: certificates earned on Owl levels; on Thirst levels, dew left over at dawn.
  function stars(level, s) {
    if (!won(level, s)) return 0;
    const [two, three] = level.stars || [1, 2];
    const v = level.owl ? s.passes : s.water;
    return v >= three ? 3 : v >= two ? 2 : 1;
  }

  const API = { DEATH, BLOOM, BLOOM_MAX, DOSE, DISTRESS, CLOCHE, OWL_REST, PASS, CAUGHT,
    bloomOf, bloomFrac, distressed, init, clone, canWater, canSummon, water, summon, tick, upcoming, finished, won, stars };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Hush = API;
})(typeof window !== 'undefined' ? window : globalThis);
