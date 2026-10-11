// How long do simple bots last in Endless summer? A bot that knows the game's ideas should outlast one that doesn't.
//   node tools/endless-bots.js [seeds]
const SW = require('../src/logic.js');
const { endless } = require('../src/levels.js');
const Solver = require('../src/solver.js');

function bot(level, pol, react) {
  const st = SW.init(level);
  const DT = 0.05;
  let n = 0;
  while (!st.over && st.t < 900) {
    if (n % 5 === 0) {
      if (pol.whistle && SW.canWhistle(st) && st.t - st.whistle.t0 >= 3 && st.swimmers.some(Solver.ambiguous)) SW.blowWhistle(st);
      const known = s => SW.needsHelp(s) && Solver.known(pol, s, st);
      // throw at the most urgent known swimmer, aiming where they are (they barely drift)
      if (SW.canThrow(st)) {
        const flying = st.rings.filter(r => r.mode === 'flying');
        const ts = st.swimmers.filter(s => known(s) && !flying.some(r => SW.dist(r, s) < 0.15))
          .sort((a, b) => (a.trouble + a.struggle + a.drown) - (b.trouble + b.struggle + b.drown));
        if (ts.length) SW.throwRing(st, ts[0].x, ts[0].y - (ts[0].state === 'struggle' ? 0.01 : 0));
      }
      // radio him in when the water is calm and a visit is coming soon
      if (pol.call && SW.canCall(level, st) && !st.swimmers.some(SW.loud) && !st.swimmers.some(known)) {
        const due = st.captain.schedule.find(v => v > st.t);
        if (due != null && due - st.t < 10) SW.callCaptain(level, st);
      }
    }
    SW.step(level, st, DT); st.events.length = 0; n++;
  }
  return st;
}

const seeds = +(process.argv[2] || 12);
for (const name of ['full', 'noWhistle', 'noCall', 'ordinary']) {
  const pol = Solver.POLICIES[name];
  const res = [];
  for (let s = 1; s <= seeds; s++) {
    const L = endless(s * 7919);
    const st = bot(L, pol);
    res.push({ t: st.t, saved: st.saved, over: st.over });
  }
  const avg = k => (res.reduce((a, r) => a + r[k], 0) / res.length).toFixed(0);
  const fired = res.filter(r => r.over === 'fired').length;
  console.log(`${name.padEnd(9)} lasts ${avg('t')}s on average, saves ${avg('saved')}; fired in ${fired}/${seeds}; range ${Math.min(...res.map(r => r.t)).toFixed(0)}-${Math.max(...res.map(r => r.t)).toFixed(0)}s`);
}
