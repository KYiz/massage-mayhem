import { performService } from './game-rules.js';
import { castInventory, itemById, items } from './item-catalog.js';

const clamp = value => Math.max(0, Math.min(100, value));

// Director-tunable values, distinct from the existing service-family balance.
// extraCost is in addition to the food service's base 8 coins.
export const itemTuning = {
  towel: { stock: 4, cooldown: 0, extraCost: 0, comfort: 3, affection: 0, patience: 1, complaint: 0 },
  oil: { stock: 4, cooldown: 1, extraCost: 1, comfort: 4, affection: 1, patience: 0, complaint: 0 },
  massage_cream: { stock: 4, cooldown: 1, extraCost: 1, comfort: 3, affection: 2, patience: 0, complaint: 0 },
  cake: { stock: 2, cooldown: 2, extraCost: 2, comfort: 0, affection: 4, patience: 0, complaint: 0 },
  basin: { stock: 2, cooldown: 1, extraCost: 0, comfort: 5, affection: 0, patience: 2, complaint: 0 },
  hot_stone: { stock: 3, cooldown: 1, extraCost: 1, comfort: 5, affection: 0, patience: 0, complaint: 2 },
  guasha: { stock: 3, cooldown: 1, extraCost: 0, comfort: 4, affection: 0, patience: 0, complaint: 3 },
  hammer: { stock: 3, cooldown: 1, extraCost: 0, comfort: 4, affection: 0, patience: 0, complaint: 4 },
  salt: { stock: 3, cooldown: 1, extraCost: 1, comfort: 4, affection: 0, patience: 0, complaint: 0 },
  scrub: { stock: 3, cooldown: 1, extraCost: 0, comfort: 4, affection: 0, patience: 0, complaint: 2 },
  footcare: { stock: 3, cooldown: 1, extraCost: 0, comfort: 3, affection: 2, patience: 0, complaint: 1 },
  milk_tea: { stock: 2, cooldown: 2, extraCost: 1, comfort: 0, affection: 3, patience: 1, complaint: 0 },
  hotpot: { stock: 2, cooldown: 2, extraCost: 3, comfort: 0, affection: 5, patience: 0, complaint: 2 },
  healthy_meal: { stock: 2, cooldown: 2, extraCost: 2, comfort: 0, affection: 2, patience: 3, complaint: 0 },
  slipper: { stock: 3, cooldown: 1, extraCost: 0, comfort: 0, affection: -2, patience: 0, complaint: 5 },
  glow_slipper: { stock: 3, cooldown: 1, extraCost: 1, comfort: 0, affection: 2, patience: 0, complaint: 4 },
  durian: { stock: 2, cooldown: 2, extraCost: 0, comfort: 0, affection: -5, patience: -4, complaint: 15 },
  spatula: { stock: 2, cooldown: 2, extraCost: 0, comfort: 0, affection: -3, patience: -2, complaint: 12 },
  banana: { stock: 3, cooldown: 1, extraCost: 0, comfort: 0, affection: 0, patience: -1, complaint: 7 },
  feather: { stock: 3, cooldown: 1, extraCost: 0, comfort: 0, affection: 3, patience: 0, complaint: 3 }
};

export function itemAvailability(battle, itemId, walletCoins = Infinity) {
  const item = itemById[itemId], tuning = itemTuning[itemId];
  if (!item || !tuning) return { ok: false, reason: '未知道具' };
  if (!battle || battle.status !== 'playing') return { ok: false, reason: '当前没有可操作的顾客' };
  if (!castInventory[battle.therapistId]?.includes(itemId)) return { ok: false, reason: '该技师未拥有此道具' };
  if (!item.scenes.includes(battle.scene)) return { ok: false, reason: '此场景不可用' };
  const used = battle.itemUses?.[itemId] || 0;
  if (used >= tuning.stock) return { ok: false, reason: '本局用尽' };
  const readyTurn = battle.itemReadyTurn?.[itemId] || 0;
  if (battle.turns < readyTurn) return { ok: false, reason: `冷却至第 ${readyTurn + 1} 次操作` };
  const serviceCost = item.service === 'food' ? 8 : 0;
  if (walletCoins - battle.spentCoins < serviceCost + tuning.extraCost) return { ok: false, reason: '金币不足' };
  return { ok: true, reason: '', remaining: tuning.stock - used, extraCost: tuning.extraCost, serviceCost };
}

function terminal(b) {
  if (b.complaint >= 100) return 'complaint_failed';
  if (b.inspection >= 100) return 'inspection_failed';
  if (b.patience <= 0) return 'walkout';
  if (b.comfort >= b.goal) return 'won';
  if (b.turns >= b.maxActions) return 'timeout';
  return 'playing';
}

export function performItem(battle, levels, itemId, rawQuality, walletCoins = Infinity) {
  const status = itemAvailability(battle, itemId, walletCoins);
  if (!status.ok) throw Error(status.reason);
  if (!Number.isFinite(rawQuality) || rawQuality < 0 || rawQuality > 100) throw Error('操作质量必须在 0–100');
  const item = itemById[itemId], tuning = itemTuning[itemId];
  const quality = clamp(rawQuality + item.bonus);
  const config = levels[battle.level - 1];
  if (!config) throw Error('关卡配置缺失');
  const levelForItem = config.servicePool.includes(item.service) ? levels : levels.map((entry, index) => index === battle.level - 1 ? { ...entry, servicePool: [...entry.servicePool, item.service] } : entry);
  let result = performService(battle, levelForItem, item.service, quality, walletCoins - tuning.extraCost);
  if (result.turns === battle.turns) throw Error('道具服务未执行');
  const log = [...result.log];
  const previousEnd = log.at(-1)?.type === 'end' ? log.pop() : null;
  const outcome = log.at(-1)?.type;
  const applied = ['success', 'weak', 'failed'].includes(outcome);
  const positive = applied && outcome !== 'failed';
  result = {
    ...result,
    spentCoins: result.spentCoins + tuning.extraCost,
    comfort: clamp(result.comfort + (positive ? tuning.comfort : 0)),
    affection: clamp(result.affection + (positive ? Math.max(0, tuning.affection) : 0) + (applied ? Math.min(0, tuning.affection) : 0)),
    patience: clamp(result.patience + (positive ? Math.max(0, tuning.patience) : 0) + (applied ? Math.min(0, tuning.patience) : 0)),
    complaint: clamp(result.complaint + (applied ? tuning.complaint : 0)),
    itemUses: { ...(battle.itemUses || {}), [itemId]: (battle.itemUses?.[itemId] || 0) + 1 },
    itemReadyTurn: { ...(battle.itemReadyTurn || {}), [itemId]: result.turns + tuning.cooldown },
    log
  };
  result.status = terminal(result);
  result.log.push({ type: 'item', itemId, message: `${item.name}：${item.gesture}；质量 ${quality}，剩余 ${tuning.stock - result.itemUses[itemId]} 次，额外花费 ${tuning.extraCost} 金币。` });
  if (result.status !== 'playing') result.log.push({ type: 'end', message: result.status === 'won' ? '服务完成！' : `本关结束：${result.status}` });
  else if (previousEnd) result.log.push(previousEnd); // Defensive: retain terminal evidence if the base rule was already terminal.
  return result;
}

if (items.some(item => !itemTuning[item.id])) throw Error('道具数值表缺项');
