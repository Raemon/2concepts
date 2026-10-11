// Touch behaviour: before the reader taps the game, the board must not capture swipes or act on touches.
const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror', e.message));
  await page.goto('http://localhost:8765/tools/harness.html?src=' + encodeURIComponent('/dist/hush.html'));
  await page.waitForTimeout(1200);
  const frame = page.frames().find(f => f !== page.mainFrame());
  const ta = () => frame.evaluate(() => getComputedStyle(document.getElementById('c')).touchAction);
  console.log('coarse pointer:', await frame.evaluate(() => matchMedia('(pointer: coarse)').matches));
  console.log('touch-action before tap:', await ta());
  // start a level without tapping the board, then touch a flower: it must not water (board not yet activated)
  await frame.evaluate(() => window.__hushDebug.start('t1'));
  // the debug start activates the board; put it back in the not-yet-tapped state a reader scrolling past would see
  await frame.evaluate(() => { const c = document.getElementById('c'); c.dataset.active = ''; c.style.touchAction = 'pan-y'; });
  const box = await page.locator('iframe').boundingBox();
  const p = await frame.evaluate(() => window.__hushDebug.flower(1, document.getElementById('c').getBoundingClientRect()));
  await page.touchscreen.tap(box.x + p.x, box.y + p.y);
  await page.waitForTimeout(300);
  const s1 = await frame.evaluate(() => window.__hushDebug.state());
  console.log('after first tap: water', s1.water, 'touch-action', await ta(), '(water should be unchanged; board now active)');
  await page.touchscreen.tap(box.x + p.x, box.y + p.y);
  await page.waitForTimeout(300);
  const s2 = await frame.evaluate(() => window.__hushDebug.state());
  console.log('after second tap: water', s2.water, '(should have watered)');
  await browser.close();
})();
