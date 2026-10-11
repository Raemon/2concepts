// Skill expression in the endless mode: how many nights do different players survive?
//   naive  : waters the most open flower; certifies the calmest-looking flower whenever the Owl is idle
//   reader : tracks each flower's side of the fold from what it can see (sudden closings, closing on its own,
//            the dilution test), waters by estimated thirst, and only certifies flowers it knows are healthy;
//            when the Owl is about to visit a distressed flower it sends the Owl somewhere safe first.
global.window = global;
const H = require('../src/logic.js');
const S = require('../src/solver.js');
const { makeNight: gen } = require('../src/levels.js');
const makeNight = (night, seed) => gen(night, seed, lv => S.solveFeasible(lv, 40000) === 'solved');
const PEAK = 6;
function play(level, policy) {
  let s = H.init(level);
  // reader's belief: which side of the fold each flower is on (it sees the trail, so it starts informed)
  const side = s.flowers.map(f => f.t > PEAK ? 'high' : 'low');
  let prev = s.flowers.map(f => H.bloomOf(f.kind, f.t));
  const est = i => { const b = H.bloomOf('fold', s.flowers[i].t); return side[i] === 'high' ? (b === 4 ? 7 : b === 2 ? 8 : b === 1 ? 9 : 6) : b; };
  for (let b = 0; b < level.length && !s.lost; b++) {
    const live = s.flowers.map((f, i) => i).filter(i => s.flowers[i].alive && s.flowers[i].cloche === 0);
    const up = H.upcoming(level, s, 2).visits[0];
    if (policy === 'naive') {
      if (s.water >= 1 && live.length) { const i = live.reduce((a, c) => H.bloomOf('fold', s.flowers[c].t) > H.bloomOf('fold', s.flowers[a].t) ? c : a); if (H.bloomOf('fold', s.flowers[i].t) >= 3) H.water(s, i); }
      if (level.owl && s.owl.mode === 'idle') { const c = live.filter(i => !H.distressed(s.flowers[i])); if (c.length) H.summon(s, c.reduce((a, x) => H.bloomOf('fold', s.flowers[x].t) < H.bloomOf('fold', s.flowers[a].t) ? x : a)); }
    } else {
      // water the flower with the highest estimated thirst (if worth it)
      while (s.water >= 1) {
        const c = live.filter(i => H.canWater(s, i)); if (!c.length) break;
        const i = c.reduce((a, x) => est(x) > est(a) ? x : a);
        if (est(i) < 5 && !(up && up.f === i && H.distressed(s.flowers[i]))) break;
        const before = H.bloomOf('fold', s.flowers[i].t); H.water(s, i);
        const after = H.bloomOf('fold', s.flowers[i].t);
        side[i] = after > before ? (s.flowers[i].t > PEAK ? 'high' : 'low') : 'low';
        if (side[i] === 'low' && after > before) side[i] = 'low';
        if (est(i) < 5) break;
      }
      if (level.owl && s.owl.mode === 'idle') {
        const danger = up && (H.distressed(s.flowers[up.f]) || side[up.f] === 'high');
        const safe = live.filter(i => side[i] === 'low' && !H.distressed(s.flowers[i]) && est(i) <= 3);
        if ((danger || safe.length) && safe.length) H.summon(s, safe.reduce((a, x) => est(x) < est(a) ? x : a));
      }
    }
    s = H.tick(level, s);
    // reader updates sides from what it sees: sudden changes (gusts) and peaks
    s.flowers.forEach((f, i) => {
      if (!f.alive) return;
      const bl = H.bloomOf(f.kind, f.t);
      if (s.events.some(e => e.type === 'gust' && e.f === i)) side[i] = f.t > PEAK ? 'high' : 'low'; // reader sees the gust and the jump
      else if (side[i] === 'low' && prev[i] === 6 && bl < 6) side[i] = 'high';
      prev[i] = bl;
    });
  }
  return H.won(level, s);
}
for (const policy of ['naive', 'reader']) {
  const nights = [];
  for (let seed = 1; seed <= 60; seed++) {
    let k = 1;
    for (; k <= 20; k++) { const L = makeNight(k, seed); if (!L || !play(L, policy)) break; }
    nights.push(k - 1);
  }
  nights.sort((a, b) => a - b);
  const mean = nights.reduce((a, b) => a + b, 0) / nights.length;
  console.log(policy.padEnd(7), 'nights survived: mean', mean.toFixed(1), 'median', nights[30], 'max', nights[nights.length - 1]);
}
