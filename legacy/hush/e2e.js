// End-to-end check: play every level in the real widget by following the solver's plan, breath by breath.
// Proves the browser game and the solver run the same rules. Needs a server on :8765 (python3 -m http.server 8765).
const { chromium } = require('playwright');
const H = require('../src/logic.js');
const { LEVELS } = require('../src/levels.js');
const S = require('../src/solver.js');
(async () => {
  const only = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/dist/hush.html');
  await page.waitForTimeout(300);
  let ok = 0;
  for (const L of LEVELS) {
    if (only && L.id !== only) continue;
    await page.evaluate(id => window.__hushDebug.start(id), L.id);
    await page.waitForTimeout(150);
    // the actual world (Listen picks a hidden one at random)
    const st0 = await page.evaluate(() => window.__hushDebug.state());
    const w0 = H.init(L); st0.t.forEach((t, i) => { w0.flowers[i].t = t; });
    const plan = S.solveFrom(L, w0, {}).plan;
    const pos = async i => page.evaluate(i => window.__hushDebug.flower(i, document.getElementById('c').getBoundingClientRect()), i);
    const owlPos = async () => page.evaluate(() => window.__hushDebug.owl(document.getElementById('c').getBoundingClientRect()));
    for (let b = 0; b < L.length; b++) {
      // wait for breath b (the clock starts on the first action)
      for (let k = 0; k < 400; k++) { const s = await page.evaluate(() => window.__hushDebug.state()); if (s.breath >= b || s.outcome) break; await page.waitForTimeout(8); }
      let step = plan.find(p => p.b === b);
      if (step && !step.ws.length && step.sm < 0) step = null;
      if (b === 0 && !step) await page.evaluate(() => window.__hushDebug.go());
      if (!step) continue;
      for (const i of step.ws) { const p = await pos(i); await page.mouse.click(p.x, p.y); }
      if (step.sm >= 0) { const o = await owlPos(); await page.mouse.click(o.x, o.y); const p = await pos(step.sm); await page.mouse.click(p.x, p.y); }
      const s = await page.evaluate(() => window.__hushDebug.state());
      if (s.breath !== b) console.log(`  ${L.id}: action for breath ${b} landed at breath ${s.breath}`);
    }
    for (let k = 0; k < 300; k++) { const s = await page.evaluate(() => window.__hushDebug.state()); if (s.outcome) break; await page.waitForTimeout(30); }
    const s = await page.evaluate(() => window.__hushDebug.state());
    console.log(`${L.id} ${L.name}: ${s.outcome}`);
    if (s.outcome === 'won') ok++;
  }
  console.log(`${ok} won; page errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  await browser.close();
})();
