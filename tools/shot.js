// Usage: node tools/shot.js <file.html> <out.png> [width] [waitMs] [harness]
const { chromium } = require('playwright');
(async () => {
  const [file, out, w = '380', wait = '1500', harness] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: 900 }, deviceScaleFactor: 2 });
  const path = require('path');
  const abs = 'file://' + path.resolve(file);
  page.on('console', m => console.log('console:', m.text()));
  page.on('pageerror', e => console.log('pageerror:', e.message));
  if (harness) {
    await page.goto('file://' + path.resolve('tools/harness.html') + '?src=' + encodeURIComponent(abs));
  } else {
    await page.goto(abs);
  }
  await page.waitForTimeout(+wait);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
})();
