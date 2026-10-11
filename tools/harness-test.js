// Load dist/hush.html inside a sandboxed iframe (allow-scripts, no same-origin) like LessWrong does,
// at several widths; report errors and the measured height; save screenshots.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '.';
  const browser = await chromium.launch();
  for (const w of [340, 500, 700]) {
    const page = await browser.newPage({ viewport: { width: w + 32, height: 1100 }, deviceScaleFactor: 2 });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:8765/tools/harness.html?src=' + encodeURIComponent('/dist/hush.html'));
    await page.waitForTimeout(1500);
    const h = await page.evaluate(() => window.__widgetHeight);
    const frame = page.frames().find(f => f !== page.mainFrame());
    let inner = null;
    if (frame) inner = await frame.evaluate(() => ({ body: document.body.offsetHeight, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }));
    await page.screenshot({ path: `${out}/harness-${w}.png`, fullPage: true });
    console.log(`width ${w}: reported height ${h}, inner ${JSON.stringify(inner)}, errors: ${errs.length ? errs.join(' | ') : 'none'}`);
    await page.close();
  }
  await browser.close();
})();
