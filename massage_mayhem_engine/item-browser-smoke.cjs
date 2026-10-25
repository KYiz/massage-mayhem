const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(process.env.USERPROFILE || '', '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }

(async () => {
  const rules = await import(pathToFileURL(path.join(__dirname, 'game-rules.js')).href);
  const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
  const progress = { ...rules.initialProgress(), coins: 20000, unlockedLevel: 30, completed: [30], unlockedTherapists: ['charming_m','bao_master'] };
  const battle = rules.beginBattle({ id:'item-browser-qa', level:30, therapistId:'bao_master', guestId:'foodie', scene:'feet', rareOffered:false }, levels);
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({ headless:true, ...(fs.existsSync(chrome) ? { executablePath:chrome } : {}), args:process.env.NO_FILE_FLAG ? [] : ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport:{ width:1366, height:900 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(data => localStorage.setItem('massage-mayhem-save-v2', JSON.stringify(data)), { progress, battle, offer:null });
  await page.goto(pathToFileURL(path.join(__dirname, 'play.html')).href);
  await page.locator('#items button[data-item="salt"]').waitFor();
  const count = await page.locator('#items button[data-item]').count();
  if (count !== 20) throw Error(`Expected 20 Bao items, got ${count}`);
  await page.locator('#items button[data-item="salt"]').click();
  if (!(await page.locator('#heldItem svg').count())) throw Error('Held item not shown in campaign stage');
  await page.locator('#keyboardAction').click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('massage-mayhem-save-v2')));
  if (state.battle.itemUses?.salt !== 1 || state.battle.turns !== 1) throw Error('Campaign item action did not persist');
  if (!(await page.locator('#items button[data-item="salt"]').isDisabled())) throw Error('Cooldown not reflected in campaign UI');
  const starter = await browser.newPage({ viewport:{ width:1366, height:900 } });
  const starterProgress = rules.initialProgress();
  const starterBattle = rules.beginBattle({ id:'starter-items-qa', level:1, therapistId:'charming_m', guestId:'foodie', scene:'back', rareOffered:false }, levels);
  await starter.addInitScript(data => localStorage.setItem('massage-mayhem-save-v2', JSON.stringify(data)), { progress:starterProgress, battle:starterBattle, offer:null });
  await starter.goto(pathToFileURL(path.join(__dirname, 'play.html')).href);
  const cake = starter.locator('#items button[data-item="cake"]');
  if (!(await cake.textContent()).includes('第 3 关开放')) throw Error('starter item milestone is not visible');
  await cake.click({ force:true });
  if (!(await starter.locator('#message').textContent()).includes('第 3 关开放')) throw Error('locked item click gave no explanation');
  if (errors.length) throw Error(errors.join(' | '));
  console.log(JSON.stringify({ availableItems:count, starterCakeUnlock:3, saltUses:state.battle.itemUses.salt, turns:state.battle.turns, campaignPageErrors:errors.length }, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
