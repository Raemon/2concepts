// STILL WATER solver. Plays a level with perfect aim, deciding every 0.25 s, using only what a player could know.
// A policy says which ideas the player has:
//   foldback  "a swimmer who went quiet may be worse, not better" (without it, only someone shouting gets a ring)
//   whistle   blows the whistle every time it's ready (a routine, never timed with hidden knowledge) and marks
//             whoever fails to answer
//   call      may radio the Captain in, at any moment it chooses
// The search is exhaustive over its decision grid (memoized depth-first), so "no plan" means no plan at this grain.
(function (root) {
  'use strict';
  const SW = typeof module !== 'undefined' && module.exports ? require('./logic.js') : root.SW;

  const DT = 0.05, GRAIN = 0.25;
  let REACT = 0.3;          // seconds between something becoming visible and the player acting on it
  let EVERY = 0;            // a lazier routine: whistle at most this often (0 = whenever it's ready)
  const VISIBLE = 0.8;   // a quiet drowner looks like someone treading water until this far under

  const POLICIES = {
    full: { foldback: true, whistle: true, call: true },
    ordinary: { foldback: false, whistle: false, call: true },   // the Captain's rule: trouble is noise
    noWhistle: { foldback: true, whistle: false, call: true },
    noCall: { foldback: true, whistle: true, call: false },
  };

  const clone = st => ({
    ...st,
    rings: st.rings.map(r => ({ ...r })),
    swimmers: st.swimmers.map(s => ({ ...s, reply: s.reply && { ...s.reply } })),
    whistle: { ...st.whistle },
    captain: { ...st.captain, schedule: st.captain.schedule.slice(), verdict: st.captain.verdict && { ...st.captain.verdict } },
    events: [],
  });

  function advance(level, st, secs) {
    const n = Math.round(secs / DT);
    for (let i = 0; i < n && !st.over; i++) { SW.step(level, st, DT); st.events.length = 0; }
    return st;
  }

  // Does the player, under this policy, know swimmer s needs a ring right now?
  function known(pol, s, st) {
    if (s.state === 'struggle') return s.since + REACT <= st.t + 1e-9;
    if (s.state !== 'drown' || !pol.foldback) return false;
    if (s.wasLoud) return s.since + REACT <= st.t + 1e-9;
    if (s.sink >= VISIBLE && s.since + VISIBLE * s.drown + REACT <= st.t + 1e-9) return true;
    if (pol.whistle && s.flagged !== false && s.flagged + REACT <= st.t + 1e-9) return true;
    return false;
  }
  // Quiet in the water and not yet explained: a whistle would tell you something.
  function ambiguous(s) {
    if (s.wasLoud || s.flagged !== false) return false;
    if (s.state === 'swim') return s.kind !== 'swimmer';
    return s.state === 'drown';
  }

  // Aim where the swimmer will be when the ring lands; return the throw only if it actually catches them.
  function aimAt(level, st, s) {
    let x = s.x, y = s.y;
    for (let it = 0; it < 3; it++) {
      const fl = SW.RULES.flight(SW.dist(SW.TOWER, { x, y }));
      const fut = advance(level, clone(st), fl);
      const f = fut.swimmers[s.id];
      x = f.x; y = f.y;
    }
    const trial = clone(st);
    if (!SW.throwRing(trial, x, y)) return null;
    let caught = false;
    for (let i = 0; i < 40 && !trial.over; i++) {
      SW.step(level, trial, DT);
      if (trial.events.some(e => e.type === 'catch' && e.who === s.id)) { caught = true; break; }
      if (trial.events.some(e => e.type === 'miss' || e.type === 'catch')) break;
      trial.events.length = 0;
    }
    return caught ? { x, y } : null;
  }

  const deadline = s => s.trouble + s.struggle + s.drown;

  function options(level, pol, st) {
    const out = [];
    if (SW.canThrow(st)) {
      // a swimmer with a ring already on its way to them doesn't need a second one
      const covered = s => st.rings.some(r => r.mode === 'flying' && SW.dist(r, s) <= SW.RULES.reachStruggle + 0.05);
      const targets = st.swimmers.filter(s => SW.needsHelp(s) && known(pol, s, st) && !covered(s)).sort((a, b) => deadline(a) - deadline(b));
      for (const s of targets) {
        const aim = aimAt(level, st, s);
        if (aim) out.push({ a: 'throw', who: s.id, x: aim.x, y: aim.y });
      }
    }
    if (pol.call && SW.canCall(level, st)) out.push({ a: 'call' });
    out.push({ a: 'wait' });
    return out;
  }

  function key(pol, st) {
    const q = v => (v === Infinity ? 'I' : v < -50 ? 'N' : Math.round(v / GRAIN));
    const sw = st.swimmers.map(s => s.state[0] + s.state[1] + (s.state === 'drown' && known(pol, s, st) ? 'k' : '')).join('');
    const rg = st.rings.map(r => r.mode[0] + q(r.t1) + (r.who >= 0 ? r.who : '')).join(',');
    const C = st.captain;
    return [q(st.t), sw, rg, C.mode[0], q(C.t0), q(C.trustUntil), C.schedule.length, st.strikes, q(st.whistle.ready)].join('|');
  }

  function apply(level, st, o) {
    if (o.a === 'throw') SW.throwRing(st, o.x, o.y);
    else if (o.a === 'whistle') SW.blowWhistle(st);
    else if (o.a === 'call') SW.callCaptain(level, st);
  }

  // Depth-first over decision points. Returns { plan, state } for the first winning line, or null.
  function solve(level, policyName, opts) {
    const pol = typeof policyName === 'string' ? POLICIES[policyName] : policyName;
    const limit = (opts && opts.limit) || 3000000;
    REACT = (opts && opts.react) || 0.3;
    EVERY = (opts && opts.whistleEvery) || 0;
    const seen = new Set();
    let nodes = 0, aborted = false;
    function dfs(st, plan) {
      if (st.over) return st.over === 'won' ? { plan, state: st } : null;
      if (++nodes > limit) { aborted = true; return null; }
      const k = key(pol, st);
      if (seen.has(k)) return null;
      seen.add(k);
      let routine = null;
      if (pol.whistle && level.whistle !== false && SW.canWhistle(st) && st.t - st.whistle.t0 >= EVERY - 1e-9 && st.swimmers.some(ambiguous)) { SW.blowWhistle(st); st.events.length = 0; routine = { t: +st.t.toFixed(2), n: Math.round(st.t / DT), a: 'whistle', routine: true }; }
      if (routine) plan = plan.concat([routine]);
      for (const o of options(level, pol, st)) {
        const next = clone(st);
        if (o.a !== 'wait') { apply(level, next, o); next.events.length = 0; }
        // after an action, look again at once (a second ring, a whistle then a throw); after waiting, move on
        if (o.a === 'wait') advance(level, next, GRAIN);
        else advance(level, next, DT);
        const step = o.a === 'wait' ? null : { t: +st.t.toFixed(2), n: Math.round(st.t / DT), ...o };
        const r = dfs(next, step ? plan.concat([step]) : plan);
        if (r) return r;
        if (aborted) return null;
      }
      return null;
    }
    const res = dfs(SW.init(level), []);
    return { ok: !!res, plan: res ? res.plan : null, state: res ? res.state : null, nodes, aborted };
  }

  // Replay a plan through the plain rules (the same path the real game takes) and report the outcome.
  function replay(level, plan) {
    const st = SW.init(level);
    let i = 0, n = 0;
    const evs = [];
    while (!st.over && st.t < level.length + 30) {
      while (i < plan.length && plan[i].n <= n) { apply(level, st, plan[i]); i++; }
      SW.step(level, st, DT); n++;
      evs.push(...st.events.map(e => ({ t: +st.t.toFixed(2), ...e })));
      st.events.length = 0;
    }
    return { over: st.over, score: st.score, saved: st.saved, stars: st.stars, strikes: st.strikes, events: evs, state: st };
  }

  const API = { solve, replay, POLICIES, known, ambiguous, DT, GRAIN, VISIBLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SWSolver = API;
})(typeof window !== 'undefined' ? window : globalThis);
