const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
let chromium;
try { ({ chromium } = require('playwright')); }
catch {
  const bundled = path.join(process.env.USERPROFILE || '', '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  ({ chromium } = require(bundled));
}

(async () => {
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}), args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
  await page.waitForFunction(() => window.animationQA?.state?.pose?.rightHand, { timeout: 10000 });
  const ready = () => page.waitForFunction(() => window.animationQA.state.frame.phase === 'observe');
  await ready();
  const clickZone = async (x = 603, y = 342) => {
    const rect = await page.locator('#stage').boundingBox();
    await page.mouse.click(rect.x + rect.width * x / 960, rect.y + rect.height * y / 540);
  };
  await clickZone();
  await page.waitForTimeout(1200);
  const first = await page.evaluate(() => ({ battle: window.animationQA.state.battle, frame: window.animationQA.state.frame, pose: window.animationQA.state.pose }));
  if (first.battle.turns !== 1) throw Error(`click did not commit once: ${first.battle.turns}`);
  await page.locator('[data-group="cast"] [data-id="aunt"]').click();
  await page.locator('[data-group="scene"] [data-id="feet"]').click();
  await ready();
  const foot = await page.evaluate(() => window.animationQA.state);
  if (foot.battle.therapistId !== 'aunt' || foot.battle.scene !== 'feet') throw Error('cast/scene switch failed');
  await page.screenshot({ path: path.join(__dirname, 'qa-stage.png'), fullPage: false });
  await page.locator('[data-group="tool"] [data-id="towel"]').click();
  await ready();
  const footRect = await page.locator('#stage').boundingBox();
  await page.mouse.move(footRect.x + footRect.width * 600 / 960, footRect.y + footRect.height * 389 / 540);
  await page.mouse.down(); await page.waitForTimeout(550);
  await page.mouse.move(footRect.x + footRect.width * 632 / 960, footRect.y + footRect.height * 399 / 540, { steps: 10 });
  const dragging = await page.evaluate(() => window.animationQA.state);
  if (!dragging.frame.contactActive || dragging.frame.target.x < 625 || dragging.frame.tool !== 'towel') throw Error('hold/drag/tool did not bind');
  await page.locator('#jolt').click(); await page.mouse.up(); await page.waitForTimeout(850);
  const interrupted = await page.evaluate(() => window.animationQA.state);
  if (interrupted.frame.contactActive || interrupted.battle.turns !== 1) throw Error('jolt failed to stop/contact commit');
  const contacts = [];
  for (const [technician, targetScene, x, y] of [['charming_m','back',683,342],['aunt','feet',678,389],['bao_master','feet',678,389]]) {
    await page.locator(`[data-group="cast"] [data-id="${technician}"]`).click();
    await page.locator(`[data-group="scene"] [data-id="${targetScene}"]`).click();
    await ready();
    const rect = await page.locator('#stage').boundingBox();
    await page.mouse.move(rect.x + rect.width * x / 960, rect.y + rect.height * y / 540);
    await page.mouse.down(); await page.waitForTimeout(650);
    const contact = await page.evaluate(() => window.animationQA.state);
    const error = Math.hypot(contact.pose.rightHand.x - contact.pose.target.x, contact.pose.rightHand.y - contact.pose.target.y);
    contacts.push({ technician, scene: targetScene, error: Math.round(error * 10) / 10 });
    if (!contact.frame.contactActive || error > 12) throw Error(`contact miss ${technician}/${targetScene}: ${error}`);
    await page.mouse.up(); await page.waitForTimeout(750);
  }
  await page.locator('[data-group="cast"] [data-id="bao_master"]').click();
  await page.locator('[data-group="scene"] [data-id="feet"]').click();
  await ready();
  await page.locator('#signature').click();
  await page.waitForTimeout(2500);
  const bao = await page.evaluate(() => window.animationQA.state);
  if (bao.battle.energy !== 0 || bao.battle.comfort < 30) throw Error('Bao skill/rules not synchronized');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  if (mobile.content > mobile.viewport) throw Error(`mobile horizontal overflow: ${mobile.content} > ${mobile.viewport}`);
  if (errors.length) throw Error(`browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify({ clickTurns: first.battle.turns, draggedTargetX: dragging.frame.target.x, joltTurns: interrupted.battle.turns, contactErrors: contacts, baoComfort: bao.battle.comfort, baoEnergy: bao.battle.energy, mobile, browserErrors: errors.length }, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
