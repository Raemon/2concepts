// Load the widget (default dist/still-water.html) inside a sandboxed iframe (allow-scripts, no same-origin) like LessWrong does,
// at several widths; report errors and the measured height; save screenshots.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '.';
  const file = process.argv[3] || '/dist/still-water.html';
  const browser = await chromium.launch();
  for (const w of [340, 500, 700]) {
    const page = await browser.newPage({ viewport: { width: w + 32, height: 1100 }, deviceScaleFactor: 2 });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:8765/tools/harness.html?src=' + encodeURIComponent(file));
    await page.waitForTimeout(1500);
    const h = await page.evaluate(() => window.__widgetHeight);
    const frame = page.frames().find(f => f !== page.mainFrame());
    let inner = null;
    if (frame) inner = await frame.evaluate(() => ({ body: document.body.offsetHeight, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, styled: getComputedStyle(document.getElementById('playBtn') || document.body).backgroundColor }));
    // storage must be optional: in a sandbox without same-origin, localStorage throws
    if (frame) inner.storageThrows = await frame.evaluate(() => { try { localStorage.getItem('x'); return false; } catch (e) { return true; } });
    // start a level inside the sandbox and let it run, to catch runtime errors
    if (frame) { await frame.click('#playBtn'); await frame.click('#startBtn'); await page.waitForTimeout(2500); inner.view = await frame.evaluate(() => window.__swDebug.view); inner.t = await frame.evaluate(() => +window.__swDebug.state.t.toFixed(1)); }
    await page.screenshot({ path: `${out}/harness-${w}.png`, fullPage: true });
    console.log(`width ${w}: reported height ${h}, inner ${JSON.stringify(inner)}, errors: ${errs.length ? errs.join(' | ') : 'none'}`);
    await page.close();
  }
  await browser.close();
})();
