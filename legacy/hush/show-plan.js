// Print the solver's winning line for a level: node tools/show-plan.js <id> [rules-json]
const H = require('../src/logic.js');
const { LEVELS } = require('../src/levels.js');
const S = require('../src/solver.js');
const L = LEVELS.find(l => l.id === process.argv[2]);
const rules = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const worlds = L.alternatives ? S.openingWorlds(L) : [H.init(L)];
for (const w0 of worlds) {
  const r = S.solveFrom(L, w0, rules);
  console.log(`${L.id} ${L.name} world=${w0.flowers.map(f => f.t).join(',')}: ${r.status}`);
  if (!r.plan) continue;
  let s = H.clone(w0);
  for (let b = 0; b < L.length; b++) {
    const st = r.plan.find(p => p.b === b);
    let a = '';
    if (st) { for (const i of st.ws) { H.water(s, i); a += 'W' + i + ' '; } if (st.sm >= 0) { H.summon(s, st.sm); a += 'Owl→' + st.sm; } }
    s = H.tick(L, s);
    const fl = s.flowers.map(f => f.alive ? `${f.t}(${H.bloomOf(f.kind, f.t)})${f.cloche ? '*' : ''}` : 'x').join(' ');
    console.log(String(b).padStart(2), a.padEnd(10), fl.padEnd(40), 'w' + s.water, s.owl.mode.padEnd(7), s.events.map(e => e.type + e.f).join(','));
  }
}
