// Touch behaviour: before the reader taps the game, the board must not capture swipes or act on touches.
// Runs the widget in the sandboxed harness with a phone profile.
const { chromium, devices } = require('playwright');
(async () => {
  const file = process.argv[2] || '/dist/still-water.html';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await ctx.newPage();
  let bad = 0;
  page.on('pageerror', e => { console.log('pageerror', e.message); bad++; });
  await page.goto('http://localhost:8765/tools/harness.html?src=' + encodeURIComponent(file));
  await page.waitForTimeout(1200);
  const frame = page.frames().find(f => f !== page.mainFrame());
  const ta = () => frame.evaluate(() => getComputedStyle(document.getElementById('stage')).touchAction);
  console.log('coarse pointer:', await frame.evaluate(() => matchMedia('(pointer: coarse)').matches));
  const before = await ta();
  console.log('touch-action before any tap:', before, before === 'pan-y' ? '(ok: swipes scroll the page)' : '(BAD)');
  if (before !== 'pan-y') bad++;
  // start level 1 without tapping the board, run to the first cry for help, hold the clock
  await frame.evaluate(() => { const D = window.__swDebug; D.openCard(0); D.begin(); D.hold(true); D.step(40); });
  const box = await page.locator('iframe').boundingBox();
  const p = await frame.evaluate(() => { const s = window.__swDebug.state.swimmers[0]; return window.__swDebug.canvasPoint(s.x, s.y); });
  const ready = () => frame.evaluate(() => window.__swDebug.state.rings.filter(r => r.mode === 'ready').length);
  await page.touchscreen.tap(box.x + p.x, box.y + p.y);
  await page.waitForTimeout(300);
  const r1 = await ready();
  console.log('after first tap: rings ready', r1, 'touch-action', await ta(), r1 === 1 ? '(ok: the first tap only activates the board)' : '(BAD: it threw)');
  if (r1 !== 1) bad++;
  await page.touchscreen.tap(box.x + p.x, box.y + p.y);
  await page.waitForTimeout(300);
  const r2 = await ready();
  console.log('after second tap: rings ready', r2, r2 === 0 ? '(ok: threw the ring)' : '(BAD: did not throw)');
  if (r2 !== 0) bad++;
  // tapping outside the widget deactivates the board and pauses the game
  await page.touchscreen.tap(box.x + 20, box.y - 20);
  await page.waitForTimeout(300);
  console.log('after tapping the post text: touch-action', await ta(), 'view', await frame.evaluate(() => window.__swDebug.view));
  console.log(bad ? `${bad} problem(s)` : 'touch gating ok');
  await browser.close();
  process.exitCode = bad ? 1 : 0;
})();
