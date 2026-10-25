import { guests, therapists } from './engine.js';
import { castInventory, itemById, items } from './item-catalog.js';
import { itemAvailability, itemTuning, performItem } from './item-rules.js';
import { heldItemSvg } from './item-art.js';
import levels from './levels-data.js';
import {
  SAVE_VERSION, initialProgress, validateLevels, canUseTherapist, unlockTherapist,
  visibleTherapists, therapistUnlockStatus,
  offerLevel, beginBattle, availableServices, performService, useSkill,
  appealComplaint, settleBattle
} from './game-rules.js';

const STORAGE_KEY = 'massage-mayhem-save-v2';
const $ = id => document.getElementById(id);
validateLevels(levels);

function loadSession() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data?.progress?.version === SAVE_VERSION && Array.isArray(data.progress.completed)) return data;
  } catch { /* Bad or old data starts a fresh profile. */ }
  return { progress: initialProgress(), offer: null, battle: null };
}

let session = loadSession();
let therapistIndex = Math.max(0, visibleTherapists(session.progress).findIndex(t => t.id === session.battle?.therapistId));
let selectedService = null;
let selectedItem = null;
let gesture = null;
let message = '';

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); }
function guestName(id) { return guests.find(g => g.id === id)?.name ?? id; }
function selectedLevel() { return Number($('level').value || 1); }
function isActive() { return session.battle?.status === 'playing'; }

function render() {
  const p = session.progress;
  const roster = visibleTherapists(p);
  therapistIndex %= roster.length;
  const therapist = roster[therapistIndex];
  const unlocked = p.unlockedTherapists.includes(therapist.id);
  const ready = canUseTherapist(p, therapist.id);
  const unlockState = therapistUnlockStatus(p, therapist.id);
  $('profile').className = `profile${unlocked ? '' : ' locked'}`;
  $('profile').innerHTML = `${therapist.portrait ? `<img src="${therapist.portrait}" alt="${therapist.name}角色立绘">` : `<span style="font-size:38px">${unlocked ? '💆' : '🔒'}</span>`}<strong>${therapist.name}</strong><p>${therapist.trait}</p><p>${therapist.appearance}</p>${therapist.hidden ? '<p>隐藏技师 · 足疗重按评分 +10，但每次投诉额外 +7；足疗技能舒适 +30、投诉 +14。</p>' : ''}`;
  $('balance').textContent = `金币 ${p.coins} · 已解锁至第 ${p.unlockedLevel} 关${unlocked && !ready ? ' · 该技师冷却中' : ''}`;
  $('unlock').textContent = unlocked ? '已解锁' : unlockState === 'chapter' ? '通关第 30 关后揭晓' : `金币解锁 · ${therapist.cost}`;
  $('unlock').disabled = unlockState !== 'ready' || isActive() || Boolean(session.offer);

  const oldLevel = selectedLevel();
  $('level').innerHTML = levels.slice(0, p.unlockedLevel).map(c => `<option value="${c.level}">第 ${c.level} 关 · ${c.chapter}</option>`).join('');
  $('level').value = String(Math.min(oldLevel, p.unlockedLevel));
  const c = levels[selectedLevel() - 1];
  $('description').textContent = `舒适目标 ${c.comfortGoal} · 忍耐 ${c.patience} · 最多 ${c.maxActions} 次操作 · 基础金币 ${c.baseCoins} · 新机制：${c.unlockMechanic || '熟练度复习'}`;
  $('start').disabled = !ready || isActive() || Boolean(session.offer);
  $('offerBox').hidden = !session.offer;
  if (session.offer) $('offerText').textContent = `🔔 神秘顾客到访！目标 +18、忍耐 −20、操作次数 −3；胜利基础金币 ×2.5。接受还是维持普通订单？`;

  const b = session.battle;
  $('battleTitle').textContent = b ? `第 ${b.level} 关 · ${guestName(b.guestId)}${b.isRare ? ' ★' : ''}` : '等待接单';
  $('turns').textContent = b ? `操作 ${b.turns}/${b.maxActions}` : '';
  $('result').textContent = b ? b.status === 'playing' ? `目标舒适 ${b.goal} · ${b.scene}` : b.status === 'won' ? '✅ 通关！可选择下一关' : `❌ ${b.status} · 可重新接单` : '';
  const meters = b ? [
    ['comfort', '舒适', b.goal], ['affection', '好感', 100], ['patience', '忍耐', 100],
    ['complaint', '投诉', 100], ...(b.level >= 19 ? [['inspection', '查房', 100]] : []), ['energy', '技能', 100]
  ] : [];
  $('meters').innerHTML = meters.map(([key, name, max]) => `<div class="meter"><span>${name}</span><div class="track"><div class="fill" style="width:${b[key]}%;background:${['complaint', 'inspection'].includes(key) ? '#d65c63' : key === 'comfort' ? '#74aa8e' : '#d99d70'}"></div></div><b>${b[key]}/${max}</b></div>`).join('');
  $('face').textContent = b?.mood === 'happy' ? '🥰' : b?.mood === 'angry' ? '😡' : b?.mood === 'shock' ? '😱' : b ? guests.find(g => g.id === b.guestId)?.look : '😐';
  const actor = b && therapists.find(t => t.id === b.therapistId);
  if (actor?.portrait) $('actor').innerHTML = `<img src="${actor.portrait}" alt="${actor.name}">`;
  else $('actor').textContent = actor?.gender === '女' ? '👩‍⚕️' : '🧑‍⚕️';
  $('heldItem').innerHTML = selectedItem ? `<svg viewBox="0 0 70 70" role="img" aria-label="${itemById[selectedItem].name}">${heldItemSvg(selectedItem, { x: 35, y: 35 })}</svg>` : '';
  $('stageNote').textContent = selectedItem ? `已选 ${itemById[selectedItem].name} · 在热区操作` : selectedService ? `已选 ${selectedService} · 拖动操作` : '先选服务或道具';
  $('services').innerHTML = b ? availableServices(b, levels).map(s => `<button data-service="${s.id}" class="${selectedService === s.id ? 'selected' : ''}" ${!isActive() || p.coins - b.spentCoins < s.cost ? 'disabled' : ''}>${s.name}${s.cost ? ` −${s.cost} 金币` : ''}</button>`).join('') : '';
  $('items').innerHTML = b ? items.filter(item => castInventory[b.therapistId]?.includes(item.id)).map(item => {
    const state = itemAvailability(b, item.id, p.coins);
    const left = Math.max(0, itemTuning[item.id].stock - (b.itemUses?.[item.id] || 0));
    return `<button data-item="${item.id}" class="${selectedItem === item.id ? 'selected' : ''}" ${state.ok ? '' : 'disabled'} title="${state.reason || item.gesture}"><svg viewBox="0 0 70 70" aria-hidden="true">${heldItemSvg(item.id, { x: 35, y: 35 })}</svg>${item.name} ×${left}</button>`;
  }).join('') : '';
  $('itemHint').textContent = b?.therapistId === 'bao_master' ? '包师傅拥有全部 20 件。灰色道具需切换场景、等待冷却、补足金币或重开本局；整蛊有拒绝与投诉风险。' : '各技师使用各自的道具箱；服务和道具择一操作。';
  $('skill').disabled = !isActive() || b.energy < 100;
  $('appeal').disabled = !isActive() || b.level < 17 || b.appealUsed;
  $('keyboardAction').disabled = !isActive() || (!selectedService && !selectedItem);
  $('log').textContent = b ? b.log.slice(-14).reverse().map(e => e.message).join('\n') : '接单后在这里查看每次操作结果。';
  $('message').textContent = message;
}

function finishIfNeeded() {
  if (!session.battle || session.battle.status === 'playing') return;
  const result = settleBattle(session.progress, session.battle, levels);
  session.progress = result.progress;
  message = result.alreadySettled ? '' : `本局结算：金币 +${result.payout}，道具花费 −${session.battle.spentCoins}。`;
}

function applyAction(action) {
  try {
    session.battle = action(session.battle);
    finishIfNeeded();
    if (selectedItem && !itemAvailability(session.battle, selectedItem, session.progress.coins).ok) selectedItem = null;
    save();
    render();
  } catch (error) { message = error.message; render(); }
}

function launch(acceptRare) {
  if (!session.offer) return;
  session.battle = beginBattle(session.offer, levels, acceptRare);
  session.offer = null;
  selectedService = null;
  selectedItem = null;
  message = '';
  save(); render();
}

$('prev').onclick = () => { const count = visibleTherapists(session.progress).length; therapistIndex = (therapistIndex + count - 1) % count; render(); };
$('next').onclick = () => { const count = visibleTherapists(session.progress).length; therapistIndex = (therapistIndex + 1) % count; render(); };
$('level').onchange = render;
$('unlock').onclick = () => {
  const result = unlockTherapist(session.progress, visibleTherapists(session.progress)[therapistIndex].id);
  session.progress = result.progress;
  message = result.ok ? '技师已解锁。' : '解锁条件不足。';
  save(); render();
};
$('start').onclick = () => {
  try {
    const result = offerLevel(session.progress, levels, selectedLevel(), visibleTherapists(session.progress)[therapistIndex].id);
    session.progress = result.progress;
    session.offer = result.offer.rareOffered ? result.offer : null;
    session.battle = null;
    if (!result.offer.rareOffered) session.battle = beginBattle(result.offer, levels);
    selectedService = null; selectedItem = null; message = '';
    save(); render();
  } catch (error) { message = error.message; render(); }
};
$('accept').onclick = () => launch(true);
$('decline').onclick = () => launch(false);
$('services').onclick = event => {
  const id = event.target.closest('[data-service]')?.dataset.service;
  if (id && isActive()) { selectedService = id; selectedItem = null; message = ''; render(); }
};
$('items').onclick = event => {
  const id = event.target.closest('[data-item]')?.dataset.item;
  if (id && itemAvailability(session.battle, id, session.progress.coins).ok) { selectedItem = id; selectedService = null; message = ''; render(); }
};
$('skill').onclick = () => applyAction(b => useSkill(b));
$('appeal').onclick = () => applyAction(b => appealComplaint(b));
$('keyboardAction').onclick = () => {
  if (selectedItem) applyAction(b => performItem(b, levels, selectedItem, 70, session.progress.coins));
  else if (selectedService) applyAction(b => performService(b, levels, selectedService, 70, session.progress.coins));
};

const stage = $('stage');
stage.addEventListener('pointerdown', event => {
  if (!isActive() || (!selectedService && !selectedItem)) return;
  const rect = $('target').getBoundingClientRect();
  const hit = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, length: 0, start: performance.now(), hit };
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener('pointermove', event => {
  if (!gesture || event.pointerId !== gesture.id) return;
  gesture.length += Math.hypot(event.clientX - gesture.lastX, event.clientY - gesture.lastY);
  gesture.lastX = event.clientX; gesture.lastY = event.clientY;
});
stage.addEventListener('pointerup', event => {
  if (!gesture || event.pointerId !== gesture.id) return;
  gesture.length += Math.hypot(event.clientX - gesture.lastX, event.clientY - gesture.lastY);
  const duration = performance.now() - gesture.start;
  const distanceFit = Math.max(0, 1 - Math.abs(gesture.length - 145) / 145);
  const timeFit = duration >= 500 && duration <= 3000 ? 1 : Math.max(0, 1 - Math.abs(duration - 1200) / 1200);
  const speed = gesture.length / Math.max(1, duration);
  const speedFit = speed >= 0.05 && speed <= 0.5 ? 1 : 0.25;
  const quality = Math.round((gesture.hit ? 50 : 0) + 30 * distanceFit * timeFit + 20 * speedFit);
  gesture = null;
  message = `操作质量 ${quality}/100`;
  applyAction(b => selectedItem ? performItem(b, levels, selectedItem, quality, session.progress.coins) : performService(b, levels, selectedService, quality, session.progress.coins));
});
stage.addEventListener('pointercancel', () => { gesture = null; });

render();
