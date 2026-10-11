// How does a player without the concepts lose each level? Simulates a "naive" policy:
// water the most open flower when water is available; call the Owl to the calmest-looking flower (to farm certificates).
const H = require('../src/logic.js');
const { LEVELS } = require('../src/levels.js');
function naive(level) {
  let s = H.init(level);
  for (let b = 0; b < level.length && !s.lost; b++) {
    const live = s.flowers.map((f, i) => [f, i]).filter(([f]) => f.alive && f.cloche === 0);
    if (s.water >= 1 && live.length) {
      const [f, i] = live.reduce((a, c) => H.bloomFrac(c[0].kind, c[0].t) > H.bloomFrac(a[0].kind, a[0].t) ? c : a);
      if (H.bloomFrac(f.kind, f.t) >= 0.5) H.water(s, i);
    }
    if (level.owl && s.owl.mode === 'idle' && live.length) {
      const [f, i] = live.reduce((a, c) => H.bloomFrac(c[0].kind, c[0].t) < H.bloomFrac(a[0].kind, a[0].t) ? c : a);
      if (!H.distressed(f)) H.summon(s, i);
    }
    s = H.tick(level, s);
    for (const e of s.events) if (['death', 'scandal', 'caught'].includes(e.type)) console.log(`  ${level.id} breath ${b}: ${e.type} flower ${e.f}`);
  }
  return H.won(level, s) ? 'won' : 'lost';
}
for (const L of LEVELS) console.log(L.id, L.name, '→', naive(L));
