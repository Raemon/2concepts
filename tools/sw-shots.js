// Screenshots of STILL WATER at chosen moments. Usage: node tools/sw-shots.js [width] [outdir]
// Each shot: open a level, step the simulation to a time (optionally with actions), wait for effects, capture.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const w = +(process.argv[2] || 380), out = process.argv[3] || 'docs/screenshots';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  const url = 'file://' + path.resolve('dist/still-water.html');
  const shot = async name => { await (await page.$('#sw')).screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };

  await page.goto(url); await page.waitForTimeout(1200);
  await shot('title');

  // level card
  await page.click('#playBtn'); await page.waitForTimeout(300);
  await shot('card');
  await page.click('#startBtn');

  async function run(levelIdx, until, actions = []) {
    await page.evaluate(({ levelIdx, until, actions }) => {
      const D = window.__swDebug;
      D.openCard(levelIdx); D.begin();
      D.setPaused(true);
      let ai = 0;
      while (D.state.t < until - 1e-6 && !D.state.over) {
        while (ai < actions.length && actions[ai].t <= D.state.t + 1e-6) {
          const a = actions[ai++];
          D.setPaused(false);
          if (a.a === 'throw') D.throwAt(a.x, a.y); else if (a.a === 'whistle') D.whistle(); else if (a.a === 'call') D.call();
          D.setPaused(true);
        }
        D.step(1);
      }
    }, { levelIdx, until, actions });
  }
  // Level 1: someone yelling for help, ring in the air
  await run(0, 2.3, [{ t: 2.0, a: 'throw', x: 0.32, y: 0.6 }]);
  await page.evaluate(() => window.__swDebug.setPaused(false)); await page.waitForTimeout(150);
  await page.evaluate(() => window.__swDebug.setPaused(true)); await page.waitForTimeout(100);
  await shot('help');
  // Level 2: one went quiet while the ring was busy
  await run(1, 5.9, [{ t: 3.4, a: 'throw', x: 0.25, y: 0.6 }]);
  await page.evaluate(() => window.__swDebug.setPaused(false)); await page.waitForTimeout(900);
  await page.evaluate(() => window.__swDebug.setPaused(true));
  await shot('quiet');
  // Level 3: whistle, someone doesn't answer
  await run(2, 5.6, [{ t: 4.6, a: 'whistle' }]);
  await page.evaluate(() => window.__swDebug.setPaused(false)); await page.waitForTimeout(500);
  await page.evaluate(() => window.__swDebug.setPaused(true));
  await shot('whistle');
  // Level 5: the Captain inspecting (Captain vision)
  await run(4, 13, [{ t: 3.4, a: 'throw', x: 0.3, y: 0.58 }, { t: 7, a: 'throw', x: 0.72, y: 0.38 }, { t: 9.6, a: 'throw', x: 0.2, y: 0.26 }]);
  await shot('captain-vision');
  // Level 8: certified collapse: call him while someone silently drowns
  await run(7, 8.65, [{ t: 2.4, a: 'throw', x: 0.6, y: 0.58 }, { t: 5.0, a: 'call' }]);
  await page.evaluate(() => window.__swDebug.setPaused(false)); await page.waitForTimeout(700);
  await page.evaluate(() => window.__swDebug.setPaused(true));
  await shot('certified');
  await page.evaluate(() => window.__swDebug.setPaused(false)); await page.waitForTimeout(1600);
  await page.evaluate(() => window.__swDebug.setPaused(true));
  await shot('certified-after');
  await browser.close();
})();
