import { clamp, guests, services, therapists } from './engine.js';

export const SAVE_VERSION = 2;
export const MAX_LEVEL = 30;
const guestById = new Map(guests.map(g => [g.id, g]));
const therapistById = new Map(therapists.map(t => [t.id, t]));
const serviceById = new Map(services.map(s => [s.id, s]));

// Mulberry32 step: all rule randomness is carried in state, never read from the clock.
export function randomStep(seed) {
  const next = ((seed >>> 0) + 0x6D2B79F5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { seed: next, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}

export function initialProgress(seed = 0x46c0ffee) {
  return {
    version: SAVE_VERSION, seed: seed >>> 0, attempts: 0,
    unlockedLevel: 1, coins: 0,
    unlockedTherapists: ['charming_m', 'charming_f'],
    completed: [], completedRuns: 0, settledBattles: [], rareLastOfferedLevel: -100,
    rareWins: 0, badges: [], cooldowns: {}
  };
}

export function validateLevels(levels) {
  if (!Array.isArray(levels) || levels.length !== MAX_LEVEL) throw Error('需要连续 30 关配置');
  levels.forEach((c, i) => {
    if (c.level !== i + 1 || !Array.isArray(c.guestPool) || !Array.isArray(c.scenePool) || !Array.isArray(c.servicePool)) throw Error(`第 ${i + 1} 关配置不完整`);
    if (![c.comfortGoal, c.patience, c.maxActions, c.baseCoins].every(Number.isFinite)) throw Error(`第 ${i + 1} 关数值无效`);
    if (c.comfortGoal < 1 || c.comfortGoal > 100 || c.maxActions < 1) throw Error(`第 ${i + 1} 关目标无效`);
    if (!c.guestPool.every(id => guestById.has(id)) || !c.servicePool.every(id => serviceById.has(id))) throw Error(`第 ${i + 1} 关引用未知 ID`);
  });
  return true;
}

export function canUseTherapist(progress, id) {
  return progress.unlockedTherapists.includes(id) && (progress.cooldowns[id] ?? 0) <= progress.completedRuns;
}

export function visibleTherapists(progress) {
  return therapists.filter(t => !t.hidden || progress.completed.includes(t.revealAfterLevel) || progress.unlockedTherapists.includes(t.id));
}

export function therapistUnlockStatus(progress, id) {
  const therapist = therapistById.get(id);
  if (!therapist) return 'unknown';
  if (progress.unlockedTherapists.includes(id)) return 'owned';
  if (therapist.revealAfterLevel && !progress.completed.includes(therapist.revealAfterLevel)) return 'chapter';
  if (progress.coins < therapist.cost) return 'coins';
  return 'ready';
}

export function unlockTherapist(progress, id) {
  const therapist = therapistById.get(id);
  if (!therapist || therapistUnlockStatus(progress, id) !== 'ready') return { progress, ok: false };
  return {
    progress: { ...progress, coins: progress.coins - therapist.cost, unlockedTherapists: [...progress.unlockedTherapists, id] },
    ok: true
  };
}

export function offerLevel(progress, levels, level, therapistId) {
  validateLevels(levels);
  const config = levels[level - 1];
  if (!config || level > progress.unlockedLevel) throw Error('关卡尚未解锁');
  if (!canUseTherapist(progress, therapistId)) throw Error('技师未解锁或正在冷却');
  let roll = randomStep(progress.seed);
  const guestId = config.guestPool[Math.floor(roll.value * config.guestPool.length)];
  roll = randomStep(roll.seed);
  const scene = config.scenePool[Math.floor(roll.value * config.scenePool.length)];
  roll = randomStep(roll.seed);
  const rareOffered = level >= 8 && level - progress.rareLastOfferedLevel >= 3 && roll.value < config.rareChance;
  const nextProgress = {
    ...progress, seed: roll.seed, attempts: progress.attempts + 1,
    rareLastOfferedLevel: rareOffered ? level : progress.rareLastOfferedLevel
  };
  return {
    progress: nextProgress,
    offer: { id: `battle-${nextProgress.attempts}`, level, therapistId, guestId, scene, rareOffered }
  };
}

export function beginBattle(offer, levels, acceptRare = false) {
  const config = levels[offer.level - 1];
  if (!config || !therapistById.has(offer.therapistId)) throw Error('无效委托');
  const isRare = Boolean(offer.rareOffered && acceptRare);
  const guestId = isRare ? 'tricky' : offer.guestId;
  const guest = guestById.get(guestId);
  return {
    id: offer.id, level: offer.level, therapistId: offer.therapistId, guestId,
    scene: offer.scene, isRare, goal: clamp(config.comfortGoal + (isRare ? 18 : 0)),
    maxActions: config.maxActions - (isRare ? 3 : 0),
    comfort: 0, affection: 35,
    patience: clamp(config.patience - (isRare ? 20 : 0)),
    complaint: guest.complaintBase, inspection: 0, energy: 0,
    turns: 0, spentCoins: 0, status: 'playing', mood: 'neutral',
    refusedServices: [], evidence: 0, appealUsed: false,
    log: [{ type: 'start', message: `${guest.name} 入场；舒适目标 ${clamp(config.comfortGoal + (isRare ? 18 : 0))}。` }]
  };
}

export function availableServices(battle, levels) {
  const config = levels[battle.level - 1];
  return config.servicePool.map(id => serviceById.get(id)).filter(s => s && s.scene.includes(battle.scene));
}

export function scoreGesture(guestPreference, therapistAbility, quality) {
  const match = Math.round(0.57 * guestPreference + 0.43 * therapistAbility);
  return clamp(Math.round(match + 0.25 * (quality - 70)));
}

function resolveTerminal(b) {
  if (b.complaint >= 100) b.status = 'complaint_failed';
  else if (b.inspection >= 100) b.status = 'inspection_failed';
  else if (b.patience <= 0) b.status = 'walkout';
  else if (b.comfort >= b.goal) b.status = 'won';
  else if (b.turns >= b.maxActions) b.status = 'timeout';
  if (b.status !== 'playing') b.log.push({ type: 'end', message: b.status === 'won' ? '服务完成！' : `本关结束：${b.status}` });
  return b;
}

export function performService(battle, levels, serviceId, quality, walletCoins = 0) {
  if (battle.status !== 'playing') return battle;
  if (!Number.isFinite(quality) || quality < 0 || quality > 100) throw Error('操作质量必须在 0–100');
  const service = availableServices(battle, levels).find(s => s.id === serviceId);
  if (!service) throw Error('此关或此场景不可使用该服务');
  if (walletCoins - battle.spentCoins < service.cost) throw Error('金币不足');
  const guest = guestById.get(battle.guestId);
  const therapist = therapistById.get(battle.therapistId);
  const preference = guest.preferences[serviceId] ?? guest.preferences.dance;
  const ability = therapist.skills[serviceId] ?? therapist.charm;
  const isBaoFootStrong = therapist.id === 'bao_master' && battle.scene === 'feet' && serviceId === 'strong';
  const score = clamp(scoreGesture(preference, ability, quality) + (isBaoFootStrong ? 10 : 0));
  const b = {
    ...battle, turns: battle.turns + 1, spentCoins: battle.spentCoins + service.cost,
    refusedServices: [...battle.refusedServices], log: [...battle.log]
  };
  if (service.consent && (preference < 35 || b.refusedServices.includes(serviceId))) {
    if (b.refusedServices.includes(serviceId)) {
      b.complaint = 100;
      b.log.push({ type: 'refusal', message: '顾客再次拒绝；继续尝试导致投诉。' });
    } else {
      b.refusedServices.push(serviceId);
      b.complaint = clamp(b.complaint + 13);
      b.affection = clamp(b.affection - 9);
      b.log.push({ type: 'refusal', message: '顾客明确拒绝；服务未执行，投诉 +13、好感 −9。' });
    }
    b.mood = 'angry';
    return resolveTerminal(b);
  }
  const tier = quality < 40 ? 'failed' : quality < 60 ? 'weak' : score >= 65 ? 'success' : score >= 50 ? 'weak' : 'failed';
  let comfortDelta = 0;
  let affectionDelta = 0;
  if (serviceId === 'food') {
    const chance = Math.min(0.85, 0.12 + 0.62 * preference / 100 * ability / 100);
    // Deterministic food outcome from gesture quality; higher quality cannot hurt.
    affectionDelta = quality / 100 >= 1 - chance ? service.affection : -1;
  } else if (tier === 'success') {
    comfortDelta = Math.max(1, Math.round(service.base * (0.65 + score / 100)));
    affectionDelta = Math.round(service.affection * score / 80);
  } else if (tier === 'weak') {
    comfortDelta = Math.max(1, Math.round(service.base * 0.55));
    affectionDelta = 0;
  } else {
    comfortDelta = -Math.max(1, Math.ceil(service.base * 0.1));
    affectionDelta = -8;
  }
  b.comfort = clamp(b.comfort + comfortDelta);
  b.affection = clamp(b.affection + affectionDelta);
  b.patience = clamp(b.patience + (tier === 'success' ? 1 : tier === 'weak' ? -2 : -10));
  b.complaint = clamp(b.complaint + (tier === 'failed' ? Math.max(2, service.complaint + 8) : Math.round(service.complaint * (1 - score / 125))) + (isBaoFootStrong ? 7 : 0));
  b.inspection = battle.level >= 19 ? clamp(b.inspection + service.inspection) : 0;
  b.energy = clamp(b.energy + (tier === 'success' ? service.energy : tier === 'weak' ? Math.floor(service.energy / 2) : 0));
  b.evidence += tier === 'success' ? 1 : 0;
  b.mood = tier === 'failed' ? 'angry' : 'happy';
  b.log.push({ type: tier, message: `${service.name}${isBaoFootStrong ? '・黄金右手' : ''} ${tier === 'success' ? '成功' : tier === 'weak' ? '低效' : '失误'}（评分 ${score}）：舒适 ${signed(comfortDelta)}、好感 ${signed(affectionDelta)}${isBaoFootStrong ? '、投诉 +7' : ''}。` });
  return resolveTerminal(b);
}

function signed(n) { return n >= 0 ? `+${n}` : String(n); }

export function useSkill(battle) {
  if (battle.status !== 'playing' || battle.energy < 100) return battle;
  const isBao = battle.therapistId === 'bao_master';
  const goldenHand = isBao && battle.scene === 'feet';
  const comfortGain = goldenHand ? 30 : isBao ? 18 : 22;
  const affectionGain = goldenHand ? 4 : isBao ? 6 : 8;
  const b = { ...battle, comfort: clamp(battle.comfort + comfortGain), affection: clamp(battle.affection + affectionGain),
    complaint: clamp(battle.complaint + (goldenHand ? 14 : 0)),
    patience: clamp(battle.patience - (goldenHand ? 4 : 0)), energy: 0,
    log: [...battle.log, { type: 'skill', message: goldenHand ? '黄金右手：舒适 +30、好感 +4、投诉 +14、忍耐 −4。' : `专属技能：舒适 +${comfortGain}、好感 +${affectionGain}。` }] };
  return resolveTerminal(b);
}

export function appealComplaint(battle) {
  if (battle.status !== 'playing' || battle.level < 17 || battle.appealUsed) return battle;
  const success = battle.evidence >= 3;
  const b = { ...battle, appealUsed: true, turns: battle.turns + 1,
    complaint: clamp(battle.complaint + (success ? -35 : 20)),
    log: [...battle.log, { type: 'appeal', message: success ? '3 条以上操作证据，申诉成功：投诉 −35。' : '证据不足，申诉失败：投诉 +20。' }] };
  return resolveTerminal(b);
}

export function settleBattle(progress, battle, levels) {
  if (battle.status === 'playing') throw Error('不能结算进行中的对局');
  if (progress.settledBattles.includes(battle.id)) return { progress, payout: 0, alreadySettled: true };
  const won = battle.status === 'won';
  const config = levels[battle.level - 1];
  const payout = won ? Math.round(config.baseCoins * (battle.isRare ? 2.5 : 1)) : 0;
  const completed = won && !progress.completed.includes(battle.level) ? [...progress.completed, battle.level] : progress.completed;
  const cooldowns = { ...progress.cooldowns };
  if (battle.status === 'inspection_failed') cooldowns[battle.therapistId] = progress.completedRuns + 7;
  const next = {
    ...progress, coins: Math.max(0, progress.coins - battle.spentCoins + payout),
    unlockedLevel: won ? Math.min(MAX_LEVEL, Math.max(progress.unlockedLevel, battle.level + 1)) : progress.unlockedLevel,
    completed, completedRuns: progress.completedRuns + (won ? 1 : 0),
    settledBattles: [...progress.settledBattles, battle.id], cooldowns,
    rareWins: progress.rareWins + (won && battle.isRare ? 1 : 0),
    badges: won && battle.isRare ? [...progress.badges, `稀有客-${battle.id}`] : progress.badges
  };
  return { progress: next, payout, alreadySettled: false };
}
