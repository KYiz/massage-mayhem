import { guests, scenePose, technicians, type ActionId, type GuestActionId, type Mood, type SceneId } from './data.js';
import { CharacterAnimator, GuestAnimator, durations } from './core.js';
import { render, setAssetMode } from './render.js';

const technicianSelect = document.querySelector<HTMLSelectElement>('#technician')!;
const guestSelect = document.querySelector<HTMLSelectElement>('#guest')!;
const sceneSelect = document.querySelector<HTMLSelectElement>('#scene')!;
const assetCheckbox = document.querySelector<HTMLInputElement>('#assetMode')!;
const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
const ctx = canvas.getContext('2d')!;
const status = document.querySelector<HTMLElement>('#status')!;
const eventLog = document.querySelector<HTMLElement>('#events')!;
const signatureButton = document.querySelector<HTMLButtonElement>('#signature')!;
const handInfo = document.querySelector<HTMLElement>('#handInfo')!;

const sampleTechnicians = technicians.filter(t => t.verification);
for (const t of sampleTechnicians) technicianSelect.add(new Option(`${t.name} · ${t.silhouette}`, t.id));
for (const g of guests) guestSelect.add(new Option(g.name, g.id));
for (const [id, pose] of Object.entries(scenePose)) sceneSelect.add(new Option(pose.label, id));
technicianSelect.value = 'charming_m'; guestSelect.value = 'foodie'; sceneSelect.value = 'back';

let animator = new CharacterAnimator(sampleTechnicians[0], guests[0], 'back');
let guestAnimator = new GuestAnimator(guests[0], 'back');
let contactFlash = 0;
function log(message: string) {
  const row = document.createElement('li'); row.textContent = message;
  eventLog.prepend(row); while (eventLog.children.length > 9) eventLog.lastChild?.remove();
}
function updateCast() {
  const profile = sampleTechnicians.find(t => t.id === technicianSelect.value)!;
  const guest = guests.find(g => g.id === guestSelect.value)!;
  const scene = sceneSelect.value as SceneId;
  animator.setCast(profile, guest, scene);
  guestAnimator.setCast(guest, scene);
  signatureButton.textContent = `专属技能 · ${profile.signature.id}`;
  signatureButton.disabled = Boolean(profile.signature.scene && profile.signature.scene !== scene);
  status.textContent = `${profile.name}｜${profile.costume}｜身体宽 ${profile.body.torsoWidth}｜上臂 ${profile.body.upperArm}／前臂 ${profile.body.forearm}｜技能 ${profile.signature.id}`;
  log(`载入 ${profile.name}、${guest.name}、${scenePose[scene].label}`);
}
technicianSelect.addEventListener('change', updateCast);
guestSelect.addEventListener('change', updateCast);
sceneSelect.addEventListener('change', updateCast);
assetCheckbox.addEventListener('change', () => setAssetMode(assetCheckbox.checked));
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => button.addEventListener('click', () => {
  const action = button.dataset.action as ActionId;
  if (animator.play(action) === false) { log('该专属技能仅适用于指定场景'); return; }
  log(`动作切换：${action}（${durations[action] === Infinity ? '循环' : `${durations[action]} 秒`}）`);
}));
document.querySelectorAll<HTMLButtonElement>('[data-mood]').forEach(button => button.addEventListener('click', () => {
  guestAnimator.setMood(button.dataset.mood as Mood); log(`顾客表情：${button.dataset.mood}`);
}));
document.querySelectorAll<HTMLButtonElement>('[data-guest-action]').forEach(button => button.addEventListener('click', () => {
  guestAnimator.play(button.dataset.guestAction as GuestActionId); log(`顾客动作：${button.dataset.guestAction}`);
}));

let lastTime = performance.now();
function tick(time: number) {
  const dt = Math.min((time - lastTime) / 1000, .1); lastTime = time;
  for (const event of animator.update(dt)) {
    if (event.type === 'contact') {
      guestAnimator.play(event.action === 'signature' && event.technicianId === 'bao_master' ? 'pain' : 'relaxed');
      contactFlash = .35;
      log(`接触帧：${event.technicianId} · ${event.action} · ${event.scene}`);
    } else log(`${event.type === 'interrupted' ? '动作中断' : '动作完成'}：${event.action}`);
  }
  const guestCompleted = guestAnimator.update(dt);
  if (guestCompleted) log(`顾客动作完成：${guestCompleted}`);
  const pose = animator.sample();
  render(ctx, animator.profile, animator.guest, animator.scene, { ...pose, contactActive: contactFlash > 0 }, guestAnimator.sample());
  contactFlash = Math.max(0, contactFlash - dt);
  const hand = pose.right.hand, target = pose.contact;
  handInfo.textContent = `右手接触点 (${hand.x.toFixed(0)}, ${hand.y.toFixed(0)}) · 热区 (${target.x}, ${target.y}) · 距离 ${Math.hypot(hand.x - target.x, hand.y - target.y).toFixed(1)} px`;
  requestAnimationFrame(tick);
}
updateCast(); requestAnimationFrame(tick);
