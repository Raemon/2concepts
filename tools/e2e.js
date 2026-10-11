// Play every level in the real page with real mouse clicks, following the solver's winning plan.
// The page's clock is held and stepped in lockstep with the plan, so this checks the UI path (click -> water
// coordinates -> throw, Whistle and Call buttons), not the player's reflexes.
//   node tools/build.js && node tools/e2e.js [width]
const { chromium } = require('playwright');
const path = require('path');
const { LEVELS } = require('../src/levels.js');
const Solver = require('../src/solver.js');

(async () => {
  const width = +(process.argv[2] || 420);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve('dist/still-water.html'));
  await page.waitForTimeout(400);
  let fails = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i];
    const sol = Solver.solve(L, 'full');
    if (!sol.ok) { console.log('NO PLAN', L.id); fails++; continue; }
    await page.evaluate(i => { const D = window.__swDebug; D.openCard(i); D.begin(); D.hold(true); }, i);
    let n = 0, pi = 0, over = null;
    const plan = sol.plan;
    while (!over && n < 4000) {
      while (pi < plan.length && plan[pi].n <= n) {
        const a = plan[pi++];
        if (a.a === 'throw') {
          const p = await page.evaluate(([x, y]) => window.__swDebug.canvasPoint(x, y), [a.x, a.y]);
          await page.mouse.click(p.x, p.y);
        } else if (a.a === 'whistle') await page.click('#whistleBtn');
        else if (a.a === 'call') await page.click('#callBtn');
      }
      // step until the next planned action (or the end)
      const next = pi < plan.length ? plan[pi].n : n + 4000;
      const k = Math.max(1, Math.min(next - n, 50));
      over = await page.evaluate(k => { const D = window.__swDebug; D.step(k); return D.state.over; }, k);
      n += k;
    }
    const st = await page.evaluate(() => { const s = window.__swDebug.state; return { over: s.over, score: s.score, saved: s.saved, stars: s.stars, misses: s.misses }; });
    const ok = st.over === 'won';
    if (!ok) fails++;
    console.log(`${ok ? 'won ' : 'FAIL'} ${L.id.padEnd(8)} score ${st.score} saved ${st.saved} misses ${st.misses}${st.stars ? ' clean inspections ' + st.stars : ''}`);
    await page.waitForTimeout(1700);   // let the result card appear
    const res = await page.evaluate(() => ({ view: window.__swDebug.view, title: document.getElementById('rTitle').textContent }));
    if (res.view !== 'result') { console.log('   result card did not show:', res.view); fails++; }
  }
  if (errors.length) { console.log('page errors:', errors); fails++; }
  console.log(fails ? `${fails} failure(s)` : 'all levels won through the UI');
  await browser.close();
  process.exitCode = fails ? 1 : 0;
})();
