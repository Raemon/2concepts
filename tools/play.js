// Scripted playthrough for screenshots: node tools/play.js <out-prefix> [width] [script-json]
// script: list of steps {click:'#id'} | {tapFlower:i} | {tapOwl:true} | {wait:ms} | {shot:'name'} | {level:'id'}
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [prefix, w = '380', scriptJson = '[]'] = process.argv.slice(2);
  const steps = JSON.parse(scriptJson);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: 760 }, deviceScaleFactor: 2 });
  page.on('console', m => { if (m.type() !== 'log') console.log('console:', m.type(), m.text()); });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto('file://' + path.resolve('dist/hush.html'));
  await page.waitForTimeout(400);
  const flowerPos = async i => page.evaluate(i => {
    const c = document.getElementById('c'); const b = c.getBoundingClientRect();
    return window.__hushDebug ? window.__hushDebug.flower(i, b) : null;
  }, i);
  for (const s of steps) {
    if (s.click) await page.click(s.click);
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.tapFlower != null) { const p = await flowerPos(s.tapFlower); if (p) await page.mouse.click(p.x, p.y); else console.log('no flower pos'); }
    if (s.tapOwl) { const p = await page.evaluate(() => window.__hushDebug.owl(document.getElementById('c').getBoundingClientRect())); if (p) await page.mouse.click(p.x, p.y); }
    if (s.level) await page.evaluate(id => window.__hushDebug.start(id), s.level);
    if (s.eval) console.log(await page.evaluate(s.eval));
    if (s.shot) await page.screenshot({ path: `${prefix}-${s.shot}.png`, fullPage: false });
  }
  await browser.close();
})();
