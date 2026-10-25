import { beginBattle, performService, useSkill } from '../massage_mayhem_engine/game-rules.js';
import { InteractionDirector } from './interaction.js';
import { VisualStage } from './visuals.js';
import { castInventory, itemById, items } from './items.js';
import { itemAvailability, itemTuning, performItem } from './item-rules.js';

const $ = selector => document.querySelector(selector);
const stage = $('#stage');
const visual = new VisualStage(stage);
const names = { charming_m: '阿烈', aunt: '芬姨', bao_master: '包师傅', back: '开背', legs: '压腿', feet: '足疗' };
const phases = { approach: '入场 · 步态与转身', observe: '观察顾客 · 寻找接触点', prepare: '准备 · 转身和重心调整', precontact: '接触前 · 手掌悬停', contact: '接触 · 掌心落点', hold: '持续接触 · 跟随玩家', release: '松手 · 顾客停止持续反馈', recover: '回位 · 重找落点', toolTake: '拿取道具 · 握持切换', toolReturn: '工具归位', interrupted: '打断 · 躲避并重新观察', signaturePrep: '专属技能 · 准备', signatureCharge: '专属技能 · 蓄力', signaturePose: '专属技能 · 出手' };
const labels = { comfort: '舒适', affection: '好感', patience: '耐心', complaint: '投诉', energy: '能量' };
const levels = [{ level: 1, comfortGoal: 95, patience: 90, maxActions: 50, servicePool: ['gentle', 'strong', 'food', 'prank'], scenePool: ['back', 'legs', 'feet'] }];
let cast = 'charming_m', scene = 'back', service = 'gentle', tool = 'hand', serial = 0;
let battle, director, pointerId = null, last = performance.now(), latestPose = null;

function log(message) {
  const li = document.createElement('li');
  li.textContent = message;
  $('#log').prepend(li);
  while ($('#log').children.length > 24) $('#log').lastElementChild.remove();
}
function point(event) {
  const rect = stage.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * 960 / rect.width, y: (event.clientY - rect.top) * 540 / rect.height };
}
function selectGroup(name, value) {
  document.querySelectorAll(`[data-group="${name}"] button`).forEach(button => button.classList.toggle('active', button.dataset.id === value));
}
function renderInventory() {
  const owned = items.filter(item => castInventory[cast].includes(item.id));
  $('#inventoryTitle').textContent = `${names[cast]}的道具箱 · ${owned.length} 件`;
  const groups = ['护理','足疗','招待','整蛊'];
  $('#inventory').innerHTML = `<div class="propgrid"><button data-id="hand" class="active">✋ 徒手</button></div>` + groups.map(group => {
    const groupItems = owned.filter(item => item.group === group);
    if (!groupItems.length) return '';
    return `<div class="propgroup"><strong>${group}</strong><div class="propgrid">${groupItems.map(item => { const available = itemAvailability(battle, item.id, 999); const remaining = Math.max(0, itemTuning[item.id].stock - (battle.itemUses?.[item.id] || 0)); return `<button data-id="${item.id}" title="${item.gesture}｜${item.scenes.map(key => names[key]).join('、')}｜${available.reason || `本局剩余 ${remaining} 次`}" class="${item.scenes.includes(scene) ? '' : 'offscene'}" ${available.ok ? '' : 'disabled'}>${item.icon} ${item.name} <small>×${remaining}</small></button>`; }).join('')}</div></div>`;
  }).join('');
  selectGroup('tool', tool);
  $('#toolTip').textContent = tool === 'hand' ? '选择道具后，在虚线区域点击、长按或拖动。招待类的虚线热区会移到顾客面前。' : `${itemById[tool].name}：${itemById[tool].gesture}；适用${itemById[tool].scenes.map(key => names[key]).join('、')}。`;
}
function updateMetrics() {
  for (const [key, label] of Object.entries(labels)) {
    const el = document.querySelector(`.metric[data-key="${key}"]`);
    if (!el) continue;
    el.querySelector('.fill').style.width = `${Math.max(0, Math.min(100, battle[key]))}%`;
    el.querySelector('output').textContent = battle[key];
    el.querySelector('label').textContent = label;
  }
  $('#signature').disabled = director.phase !== 'observe' || battle.status !== 'playing' || director.toolHeld || (cast === 'bao_master' && scene !== 'feet');
}
function reset(clearLog = false) {
  if (pointerId !== null && stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
  pointerId = null;
  battle = beginBattle({ id: `animation-qa-${++serial}`, level: 1, therapistId: cast, guestId: 'foodie', scene, rareOffered: false }, levels);
  battle.energy = 100; // Director QA only; this never touches persistent progress.
  director = new InteractionDirector({ technicianId: cast, scene, onEvent: handleEvent, contactValidator: frame => {
    if (frame.signature && cast !== 'bao_master') return true; // Flying kiss and food offering have a separate gesture target.
    const pose = visual.render({ ...frame, reach: 1 }, performance.now() / 1000);
    return Math.hypot(pose.rightHand.x - frame.target.x, pose.rightHand.y - frame.target.y) <= 12;
  } });
  director.setService(service);
  tool = 'hand'; selectGroup('tool', tool);
  visual.setCast(cast, scene);
  renderInventory();
  director.startApproach();
  $('#castTitle').textContent = `${names[cast]} · ${names[scene]}`;
  if (clearLog) $('#log').replaceChildren();
  log(`${names[cast]}进入${names[scene]}验证局；点击虚线区域开始。`);
  updateMetrics();
}
function handleEvent(event) {
  switch (event.type) {
    case 'started': log(`#${event.interactionId} ${event.signature ? '专属技能开始' : '锁定接触点'}`); break;
    case 'toolHeld': log(`${itemById[event.tool]?.name || '道具'}已握持；${itemById[event.tool]?.gesture || ''}。`); break;
    case 'toolReturned': log(`${itemById[event.returnedTool]?.name || '道具'}离开顾客并归位。`); break;
    case 'toolSelected': if (event.tool === 'hand') { tool = 'hand'; renderInventory(); $('#toolTip').textContent = '徒手模式；选择道具可切换动作和规则。'; } break;
    case 'contactStart': log(`#${event.interactionId} 技师接触 → 顾客开始反馈`); break;
    case 'contactEnd': log(`#${event.interactionId} 接触结束 → 顾客停止持续反馈（${event.reason}）`); break;
    case 'commit': {
      if (battle.status !== 'playing') break;
      const before = battle;
      battle = event.tool === 'hand' ? performService(battle, levels, event.service, event.quality, 999) : performItem(battle, levels, event.tool, event.quality, 999);
      const toolName = event.tool === 'hand' ? '徒手' : itemById[event.tool]?.name || event.tool;
      log(`#${event.interactionId} ${toolName}${event.interrupted ? '受打断' : '完成'}，质量 ${event.quality}；舒适 ${battle.comfort - before.comfort >= 0 ? '+' : ''}${battle.comfort - before.comfort}，投诉 ${battle.complaint - before.complaint >= 0 ? '+' : ''}${battle.complaint - before.complaint}。`);
      updateMetrics(); renderInventory();
      break;
    }
    case 'skillImpact': {
      if (battle.status !== 'playing') break;
      const before = battle;
      if (cast === 'aunt') battle = performService(battle, levels, 'food', 90, 999);
      else battle = useSkill(battle);
      log(`#${event.interactionId} ${cast === 'aunt' ? '芬姨递美食' : cast === 'charming_m' ? '阿烈飞吻' : '包师傅黄金右手'}命中；舒适 ${battle.comfort - before.comfort >= 0 ? '+' : ''}${battle.comfort - before.comfort}，好感 ${battle.affection - before.affection >= 0 ? '+' : ''}${battle.affection - before.affection}。`);
      updateMetrics();
      break;
    }
    case 'interrupted': log(`#${event.interactionId} 顾客乱动；技师避让，${event.hadContact ? '中断已接触动作' : '接触前取消'}。`); break;
    case 'phase': $('#phase').textContent = `${phases[event.next] || event.next} · #${event.interactionId}`; updateMetrics(); break;
  }
}

$('#metrics').innerHTML = Object.entries(labels).map(([key,label]) => `<div class="metric" data-key="${key}"><label>${label}</label><div class="track"><div class="fill"></div></div><output>0</output></div>`).join('');
document.querySelectorAll('[data-group="cast"] button').forEach(button => button.addEventListener('click', () => { cast = button.dataset.id; selectGroup('cast', cast); reset(true); }));
document.querySelectorAll('[data-group="scene"] button').forEach(button => button.addEventListener('click', () => { scene = button.dataset.id; selectGroup('scene', scene); reset(true); }));
document.querySelectorAll('[data-group="service"] button').forEach(button => button.addEventListener('click', () => { if (director.setService(button.dataset.id)) { service = button.dataset.id; selectGroup('service', service); } }));
$('#inventory').addEventListener('click', event => {
  const button = event.target.closest('button[data-id]');
  if (!button || button.disabled) return;
  if (button.dataset.id !== 'hand' && !itemAvailability(battle, button.dataset.id, 999).ok) return;
  if (director.selectTool(button.dataset.id)) {
    tool = director.tool; selectGroup('tool', tool);
    $('#toolTip').textContent = director.phase === 'toolReturn' ? `${itemById[tool].name}正在归位。` : tool === 'hand' ? '徒手模式。' : `${itemById[tool].name}：${itemById[tool].gesture}；按提示虚线区域操作。`;
  }
});
$('#signature').addEventListener('click', () => { if (director.startSignature()) log('专属动作进入准备、蓄力、出手三段。'); });
$('#jolt').addEventListener('click', () => director.interrupt('guest-jolt'));
$('#reset').addEventListener('click', () => reset(true));
document.addEventListener('keydown', event => { if (event.key.toLowerCase() === 'g') director.interrupt('guest-jolt'); });
stage.addEventListener('pointerdown', event => {
  if (pointerId !== null || battle.status !== 'playing') return;
  if (director.pointerDown(point(event))) { pointerId = event.pointerId; stage.setPointerCapture(pointerId); event.preventDefault(); }
});
stage.addEventListener('pointermove', event => { if (event.pointerId === pointerId) director.pointerMove(point(event), event.pressure || .5); });
stage.addEventListener('pointerup', event => { if (event.pointerId === pointerId) { director.pointerUp(); pointerId = null; event.preventDefault(); } });
stage.addEventListener('pointercancel', event => { if (event.pointerId === pointerId) { director.pointerCancel(); pointerId = null; } });
function tick(now) {
  const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;
  director.update(dt);
  const frame = director.frame();
  latestPose = visual.render(frame, now / 1000);
  if (frame.contactActive && cast === 'bao_master' && scene === 'feet' && frame.signature) $('#hint').textContent = '黄金右手接触中：手掌位置、足底反馈和投诉数值同步';
  else $('#hint').textContent = `目标：${frame.zone.label}｜${frame.tool === 'hand' ? '徒手' : itemById[frame.tool]?.name}｜${phases[frame.phase]}｜按 G 触发乱动`;
  requestAnimationFrame(tick);
}
reset(true); requestAnimationFrame(tick);
window.animationQA = { get state() { return { battle, frame: director.frame(), pose: latestPose }; }, get director() { return director; }, reset };
