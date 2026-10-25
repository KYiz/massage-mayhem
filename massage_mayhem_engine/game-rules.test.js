import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  initialProgress, validateLevels, offerLevel, beginBattle, performService,
  useSkill, appealComplaint, settleBattle, unlockTherapist, canUseTherapist,
  scoreGesture, visibleTherapists, therapistUnlockStatus
} from './game-rules.js';

const levels = JSON.parse(readFileSync(new URL('./levels.json', import.meta.url), 'utf8'));
const copyLevels = () => structuredClone(levels);

test('30 关配置可用，首关使用关卡目标而非顾客固有目标', () => {
  assert.equal(validateLevels(levels), true);
  const { offer } = offerLevel(initialProgress(1), levels, 1, 'charming_f');
  const battle = beginBattle(offer, levels);
  assert.equal(battle.goal, 40);
  assert.equal(battle.maxActions, 23);
  assert.equal(battle.patience, 90);
});

test('同种子生成相同订单，规则操作不修改输入状态', () => {
  const a = offerLevel(initialProgress(678), levels, 1, 'charming_f');
  const b = offerLevel(initialProgress(678), levels, 1, 'charming_f');
  assert.deepEqual(a, b);
  const start = beginBattle(a.offer, levels);
  const next = performService(start, levels, 'gentle', 80);
  assert.equal(start.turns, 0);
  assert.equal(next.turns, 1);
  assert.equal(start.log.length, 1);
  assert.ok(next.log.length > start.log.length);
});

test('首关从接单到真实操作再到结算可以走通', () => {
  const { progress, offer } = offerLevel(initialProgress(10), levels, 1, 'charming_f');
  let battle = beginBattle({ ...offer, guestId: 'gentle' }, levels);
  for (let i = 0; i < 10 && battle.status === 'playing'; i++) battle = performService(battle, levels, 'gentle', 80);
  assert.equal(battle.status, 'won');
  const result = settleBattle(progress, battle, levels);
  assert.equal(result.progress.coins, 82);
  assert.equal(result.progress.unlockedLevel, 2);
});

test('服务池限制与操作质量参与评分', () => {
  const { offer } = offerLevel(initialProgress(5), levels, 1, 'charming_f');
  const battle = beginBattle(offer, levels);
  assert.throws(() => performService(battle, levels, 'strong', 80), /不可使用/);
  assert.throws(() => performService(battle, levels, 'gentle', -1), /0–100/);
  assert.ok(scoreGesture(95, 78, 90) > scoreGesture(95, 78, 30));
  const strongPreference = { ...battle, guestId: 'gentle' };
  assert.equal(performService(strongPreference, levels, 'gentle', 10).mood, 'angry');
});

test('关卡操作次数耗尽与投诉优先于舒适达标', () => {
  const quick = copyLevels();
  quick[0].maxActions = 1;
  quick[0].comfortGoal = 100;
  const { offer } = offerLevel(initialProgress(2), quick, 1, 'charming_f');
  const timed = performService(beginBattle(offer, quick), quick, 'gentle', 90);
  assert.equal(timed.status, 'timeout');

  const later = offerLevel({ ...initialProgress(1), unlockedLevel: 7 }, levels, 7, 'charming_f');
  const battle = { ...beginBattle(later.offer, levels), guestId: 'strong', comfort: 48, goal: 49, complaint: 99 };
  const result = performService(battle, levels, 'strong', 90);
  assert.equal(result.status, 'complaint_failed');
});

test('明确拒绝不可反复试探刷收益', () => {
  const { offer } = offerLevel({ ...initialProgress(1), unlockedLevel: 19 }, levels, 19, 'charming_f');
  const battle = { ...beginBattle(offer, levels), guestId: 'gentle' };
  const once = performService(battle, levels, 'dance', 80);
  assert.equal(once.comfort, 0);
  assert.equal(once.complaint, battle.complaint + 13);
  const twice = performService(once, levels, 'dance', 80);
  assert.equal(twice.status, 'complaint_failed');
});

test('稀有委托可拒绝，接受时增加目标并减少容错', () => {
  const rareLevels = copyLevels();
  rareLevels[7].rareChance = 1;
  const { progress, offer } = offerLevel({ ...initialProgress(123), unlockedLevel: 8 }, rareLevels, 8, 'charming_f');
  assert.equal(offer.rareOffered, true);
  const normal = beginBattle(offer, rareLevels, false);
  const rare = beginBattle(offer, rareLevels, true);
  assert.equal(normal.isRare, false);
  assert.equal(rare.goal, normal.goal + 18);
  assert.equal(rare.patience, normal.patience - 20);
  assert.equal(rare.maxActions, normal.maxActions - 3);
  const retry = offerLevel(progress, rareLevels, 8, 'charming_f');
  assert.equal(retry.offer.rareOffered, false);
});

test('结算只发一次金币，解锁和冷却按已完成对局计', () => {
  const startProgress = initialProgress(3);
  const { progress, offer } = offerLevel(startProgress, levels, 1, 'charming_f');
  const battle = { ...beginBattle(offer, levels), status: 'won', spentCoins: 8 };
  const first = settleBattle(progress, battle, levels);
  assert.equal(first.payout, 82);
  assert.equal(first.progress.coins, 74);
  assert.equal(first.progress.unlockedLevel, 2);
  assert.equal(first.progress.completedRuns, 1);
  const second = settleBattle(first.progress, battle, levels);
  assert.equal(second.alreadySettled, true);
  assert.equal(second.progress.coins, 74);
  assert.equal(unlockTherapist(first.progress, 'gentle').ok, false);

  const failed = { ...battle, id: 'battle-fail', status: 'inspection_failed' };
  const afterFailure = settleBattle(first.progress, failed, levels).progress;
  assert.equal(canUseTherapist(afterFailure, 'charming_f'), false);
  assert.equal(canUseTherapist({ ...afterFailure, completedRuns: 8 }, 'charming_f'), true);
});

test('技能和申诉仅在满足条件时生效', () => {
  const { offer } = offerLevel({ ...initialProgress(9), unlockedLevel: 17 }, levels, 17, 'charming_f');
  const battle = beginBattle(offer, levels);
  assert.equal(useSkill(battle), battle);
  const powered = useSkill({ ...battle, energy: 100 });
  assert.equal(powered.comfort, 22);
  const appealed = appealComplaint({ ...battle, evidence: 3, complaint: 50 });
  assert.equal(appealed.complaint, 15);
  assert.equal(appealComplaint(appealed), appealed);
});

test('包师傅在完成第 30 关后出现，需支付全角色最高的 12800 金币', () => {
  const fresh = initialProgress(11);
  assert.equal(visibleTherapists(fresh).some(t => t.id === 'bao_master'), false);
  assert.equal(therapistUnlockStatus({ ...fresh, coins: 12800 }, 'bao_master'), 'chapter');
  const cleared = { ...fresh, completed: [30], unlockedLevel: 30, coins: 12799 };
  assert.equal(visibleTherapists(cleared).some(t => t.id === 'bao_master'), true);
  assert.equal(therapistUnlockStatus(cleared, 'bao_master'), 'coins');
  assert.equal(unlockTherapist(cleared, 'bao_master').ok, false);
  const purchased = unlockTherapist({ ...cleared, coins: 12800 }, 'bao_master');
  assert.equal(purchased.ok, true);
  assert.equal(purchased.progress.coins, 0);
  assert.equal(canUseTherapist(purchased.progress, 'bao_master'), true);
  assert.equal(unlockTherapist(purchased.progress, 'bao_master').ok, false);
});

test('包师傅足疗重按加分伴随风险，黄金右手不会绕过失败优先级', () => {
  const p = { ...initialProgress(12), unlockedLevel: 30, completed: [30], unlockedTherapists: ['charming_m', 'charming_f', 'bao_master'] };
  const { offer } = offerLevel(p, levels, 9, 'bao_master');
  const battle = beginBattle({ ...offer, guestId: 'strong', scene: 'feet' }, levels);
  const acted = performService(battle, levels, 'strong', 80);
  assert.match(acted.log.at(-1).message, /黄金右手/);
  assert.ok(acted.complaint >= battle.complaint + 7);
  const skill = useSkill({ ...battle, energy: 100, complaint: 70 });
  assert.equal(skill.comfort, 30);
  assert.equal(skill.complaint, 84);
  const failed = useSkill({ ...battle, energy: 100, complaint: 90, comfort: battle.goal - 10 });
  assert.equal(failed.status, 'complaint_failed');
});
