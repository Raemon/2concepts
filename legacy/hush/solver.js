// Exhaustive solver for HUSH levels (used by tools/check-levels.js and by the endless mode in the browser).
// solveFull(level, rules) searches every action sequence breath by breath (full information) and
// returns a winning plan or null. `rules` restricts the action set to model a player who lacks a concept:
//   greedyBloom: each water must go to a flower whose bloom is currently the most open (monotonic reading)
//   noSummon:    the Owl is never summoned (inspections are something that happens to you)
//   noCertifyPastFold: never summon the Owl to a fold flower past its peak (forbids certified collapse)
(function (root) {
'use strict';
const H = (typeof module !== 'undefined' && module.exports) ? require('./logic.js') : root.Hush;

function key(s) {
  let k = s.breath + '|' + s.water + '|' + s.owl.mode[0] + s.owl.target + s.owl.rest + '|';
  for (const f of s.flowers) k += (f.alive ? f.t : 'x') + ':' + f.cloche + ',';
  return k;
}

function waterOptions(s, rules) {
  // Multisets of flowers to water this breath (order-free, since each dose just subtracts).
  const out = [[]];
  const n = s.flowers.length;
  const maxW = Math.min(s.water, 3);
  function rec(start, list, st) {
    if (list.length >= maxW) return;
    for (let i = start; i < n; i++) {
      if (!H.canWater(st, i)) continue;
      if (rules.greedyBloom) {
        let best = -1;
        st.flowers.forEach((f, j) => { if (H.canWater(st, j)) best = Math.max(best, H.bloomFrac(f.kind, f.t)); });
        if (H.bloomFrac(st.flowers[i].kind, st.flowers[i].t) < best - 1e-9) continue;
      }
      const nx = H.clone(st); H.water(nx, i);
      const nl = list.concat([i]);
      out.push(nl);
      rec(rules.greedyBloom ? 0 : i, nl, nx);
    }
  }
  rec(0, [], s);
  // dedupe multisets
  const seen = new Set();
  return out.filter(l => { const k = l.slice().sort().join(','); if (seen.has(k)) return false; seen.add(k); return true; });
}

function actions(level, s, rules) {
  const res = [];
  for (const ws of waterOptions(s, rules)) {
    const st = H.clone(s);
    let ok = true;
    for (const i of ws) { if (!H.canWater(st, i)) { ok = false; break; } H.water(st, i); }
    if (!ok) continue;
    res.push({ ws, sm: -1, st });
    if (!rules.noSummon) {
      for (let i = 0; i < st.flowers.length; i++) {
        if (!H.canSummon(level, st, i)) continue;
        const f = st.flowers[i];
        if (rules.noCertifyPastFold && f.kind === 'fold' && f.t > 6) continue;
        const s2 = H.clone(st); H.summon(s2, i);
        res.push({ ws, sm: i, st: s2 });
      }
    }
  }
  return res;
}

function solveFull(level, rules = {}, limit = 2e6) {
  let layer = new Map();
  const s0 = H.init(level);
  layer.set(key(s0), { s: s0, plan: [] });
  let expanded = 0;
  for (let b = 0; b < level.length; b++) {
    const next = new Map();
    for (const { s, plan } of layer.values()) {
      for (const a of actions(level, s, rules)) {
        const st = H.tick(level, a.st);
        if (st.lost || st.caught > 0) continue;
        expanded++;
        if (expanded > limit) return { status: 'limit', expanded };
        const k = key(st);
        const prev = next.get(k);
        if (!prev || prev.s.passes < st.passes) next.set(k, { s: st, plan: plan.concat([{ b, ws: a.ws, sm: a.sm }]) });
      }
    }
    layer = next;
    if (layer.size === 0) return { status: 'unsolvable', breath: b, expanded };
  }
  let best = null;
  for (const v of layer.values()) if (H.won(level, v.s) && (!best || v.s.passes > best.s.passes)) best = v;
  return best ? { status: 'solved', plan: best.plan, rating: best.s.passes, expanded } : { status: 'unsolvable', breath: level.length, expanded };
}

function replay(level, plan) {
  let s = H.init(level);
  for (let b = 0; b < level.length; b++) {
    const step = plan.find(p => p.b === b);
    if (step) { for (const i of step.ws) H.water(s, i); if (step.sm >= 0) H.summon(s, step.sm); }
    s = H.tick(level, s);
  }
  return s;
}

// Fast feasibility check for generated nights: depth-first, most promising action first, with a visited set.
function solveFeasible(level, budget = 60000) {
  const seen = new Set();
  let n = 0;
  const risk = st => st.flowers.reduce((a, f) => a + (f.alive ? f.t * f.t : 999), 0) + st.caught * 500;
  function rec(s) {
    if (s.breath >= level.length) return H.won(level, s);
    if (++n > budget) throw new Error('budget');
    const k = key(s) + '|' + s.caught;
    if (seen.has(k)) return false;
    seen.add(k);
    const opts = actions(level, s, {}).map(a => ({ a, st: H.tick(level, a.st) }))
      .filter(o => !o.st.lost && o.st.caught === 0)
      .sort((x, y) => risk(x.st) - risk(y.st));
    for (const o of opts) if (rec(o.st)) return true;
    return false;
  }
  try { return rec(H.init(level)) ? 'solved' : 'unsolvable'; } catch (e) { return 'limit'; }
}

const API = { solveFull, replay, key, solveFeasible };

// Partial-observation solver. `worlds` are complete states that look identical to the player at the start
// (hidden thirst behind the same bloom). Returns true if one policy, choosing actions from what the player
// can see, wins in every world. AND over what the player might observe next, OR over actions.
function observe(level, s) {
  let o = s.water + '|' + s.owl.mode[0] + s.owl.target + '|' + s.caught + '|';
  for (const f of s.flowers) o += (f.alive ? H.bloomOf(f.kind, f.t) : 'x') + ':' + f.cloche + ',';
  for (const e of s.events) o += e.type[0] + e.f;
  return o;
}

function solveBelief(level, worlds, rules = {}, budget = { n: 0, max: 3e6 }) {
  const memo = new Map();
  function rec(ws) {
    if (ws.length === 1) {
      // Fully identified: hand over to the full-information search from here.
      const rest = Object.assign({}, level, { length: level.length });
      return solveFrom(level, ws[0], rules).status === 'solved';
    }
    const b = ws[0].breath;
    if (b >= level.length) return ws.every(w => H.won(level, w));
    const k = ws.map(key).sort().join('#');
    if (memo.has(k)) return memo.get(k);
    if (++budget.n > budget.max) throw new Error('belief budget exceeded');
    memo.set(k, false);
    // Actions are chosen from the first world's options; availability is observable, so it matches across worlds.
    const opts = actions(level, ws[0], rules);
    let win = false;
    for (const a of opts) {
      const nexts = [];
      let dead = false;
      for (const w of ws) {
        const st = H.clone(w);
        for (const i of a.ws) H.water(st, i);
        if (a.sm >= 0) H.summon(st, a.sm);
        const t = H.tick(level, st);
        if (t.lost || t.caught > 0) { dead = true; break; }
        nexts.push(t);
      }
      if (dead) continue;
      const parts = new Map();
      for (const t of nexts) { const o = observe(level, t); if (!parts.has(o)) parts.set(o, []); parts.get(o).push(t); }
      let all = true;
      for (const p of parts.values()) if (!rec(p)) { all = false; break; }
      if (all) { win = true; break; }
    }
    memo.set(k, win);
    return win;
  }
  return rec(worlds);
}

function solveFrom(level, s0, rules = {}) {
  let layer = new Map([[key(s0), { s: s0, plan: [] }]]);
  for (let b = s0.breath; b < level.length; b++) {
    const next = new Map();
    for (const { s, plan } of layer.values()) {
      for (const a of actions(level, s, rules)) {
        const st = H.tick(level, a.st);
        if (st.lost || st.caught > 0) continue;
        const k = key(st);
        const prev = next.get(k);
        if (!prev || prev.s.passes < st.passes) next.set(k, { s: st, plan: plan.concat([{ b, ws: a.ws, sm: a.sm }]) });
      }
    }
    layer = next;
    if (!layer.size) return { status: 'unsolvable' };
  }
  for (const v of layer.values()) if (H.won(level, v.s)) return { status: 'solved', plan: v.plan };
  return { status: 'unsolvable' };
}

// Worlds consistent with the opening view: each flower listed in level.hidden could be at either thirst
// that shows the same bloom.
function openingWorlds(level) {
  if (level.alternatives) {
    return level.alternatives.map(alt => { const w = H.init(level); for (const [i, t] of Object.entries(alt)) w.flowers[+i].t = t; return w; });
  }
  const twins = { fold: { 1: [1, 9], 9: [1, 9], 2: [2, 8], 8: [2, 8], 4: [4, 7], 7: [4, 7] } };
  let worlds = [H.init(level)];
  for (const i of level.hidden || []) {
    const f = level.flowers[i];
    const alts = (twins[f.kind] || {})[f.t] || [f.t];
    const nw = [];
    for (const w of worlds) for (const t of alts) { const c = H.clone(w); c.flowers[i].t = t; nw.push(c); }
    worlds = nw;
  }
  return worlds;
}

Object.assign(API, { solveBelief, solveFrom, openingWorlds, observe });
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.HushSolver = API;
})(typeof window !== 'undefined' ? window : globalThis);
