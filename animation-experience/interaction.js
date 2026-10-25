// Input-driven performance director. No DOM or rendering dependencies.
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
import { castInventory, itemById, offerZones } from './items.js';

export const sceneZones = {
  back: { center: { x: 603, y: 342 }, rx: 93, ry: 52, label: '上背肌肉' },
  legs: { center: { x: 637, y: 356 }, rx: 100, ry: 48, label: '腿部肌肉' },
  feet: { center: { x: 600, y: 389 }, rx: 90, ry: 49, label: '足底' }
};
const durations = { approach: .68, observe: 0, prepare: .14, precontact: .17, contact: .1, release: .23, toolTake: .34, toolReturn: .33, interrupted: .36, recover: .26, signaturePrep: .72, signatureCharge: .53, signaturePose: .3 };
const ease = v => { const t = clamp(v); return t * t * (3 - 2 * t); };

function inside(z, point, margin = 0) {
  return Math.pow((point.x - z.center.x) / (z.rx + margin), 2) + Math.pow((point.y - z.center.y) / (z.ry + margin), 2) <= 1;
}
function clampPoint(z, point) {
  const dx = point.x - z.center.x, dy = point.y - z.center.y;
  const radius = Math.sqrt((dx * dx) / (z.rx * z.rx) + (dy * dy) / (z.ry * z.ry));
  if (radius <= 1) return { ...point };
  return { x: z.center.x + dx / radius, y: z.center.y + dy / radius };
}
export const pointInZone = (scene, point, margin = 0) => inside(sceneZones[scene], point, margin);
export const clampToZone = (scene, point) => clampPoint(sceneZones[scene], point);

export class InteractionDirector {
  constructor({ technicianId = 'charming_m', scene = 'back', onEvent = () => {}, contactValidator = () => true } = {}) {
    this.onEvent = onEvent; this.contactValidator = contactValidator; this.serial = 0; this.setCast(technicianId, scene);
  }
  setCast(technicianId, scene) {
    if (!sceneZones[scene]) throw new Error(`Unknown scene ${scene}`);
    this.technicianId = technicianId; this.scene = scene; this.phase = 'observe'; this.phaseTime = 0;
    this.interactionId = 0; this.pointerActive = false; this.releaseRequested = false; this.contactActive = false;
    this.target = { ...sceneZones[scene].center }; this.lastPointer = { ...this.target };
    this.pathLength = 0; this.holdTime = 0; this.pressure = 0; this.tool = 'hand'; this.toolHeld = false;
    this.service = 'gentle'; this.signature = false; this.committed = false; this.guestMood = 'neutral'; this.guestRecoil = 0;
    this.effectTime = 0; this.impactTime = 0;
  }
  emit(type, extra = {}) {
    this.onEvent({ type, interactionId: this.interactionId, technicianId: this.technicianId, scene: this.scene, tool: this.tool, phase: this.phase, ...extra });
  }
  enter(phase) { this.phase = phase; this.phaseTime = 0; this.emit('phase', { next: phase }); }
  activeZone() { return this.tool !== 'hand' && itemById[this.tool]?.service === 'food' ? offerZones[this.scene] : sceneZones[this.scene]; }
  actionService() { return itemById[this.tool]?.service || this.service; }
  startApproach() { if (this.phase === 'observe') { this.enter('approach'); return true; } return false; }
  setService(service) { if (this.phase !== 'observe') return false; this.service = service; return true; }
  selectTool(tool) {
    const item = itemById[tool];
    if (this.phase !== 'observe') return false;
    if (this.toolHeld) { if (tool === 'hand') { this.enter('toolReturn'); return true; } return false; }
    if (tool !== 'hand' && (!item || !item.scenes.includes(this.scene) || !castInventory[this.technicianId]?.includes(tool))) return false;
    this.tool = tool;
    if (tool === 'hand') { this.toolHeld = false; this.emit('toolSelected', { tool }); }
    else this.enter('toolTake');
    return true;
  }
  pointerDown(point) {
    const zone = this.activeZone();
    if (this.phase !== 'observe' || !inside(zone, point, 15)) return false;
    this.interactionId = ++this.serial; this.pointerActive = true; this.releaseRequested = false;
    this.committed = false; this.signature = false; this.contactActive = false; this.holdTime = 0; this.pathLength = 0; this.pressure = 0;
    this.target = clampPoint(zone, point); this.lastPointer = { ...this.target }; this.guestMood = 'anticipate';
    this.emit('started', { target: { ...this.target }, service: this.actionService() });
    this.enter('prepare'); return true;
  }
  pointerMove(point, devicePressure = .5) {
    if (!this.pointerActive) return false;
    const zone = this.activeZone();
    if (!inside(zone, point, 100)) { this.interrupt('pointer-left-zone'); return false; }
    const next = clampPoint(zone, point);
    this.pathLength += length(this.lastPointer, next); this.lastPointer = next; this.target = next;
    this.pressure = Math.max(this.pressure, clamp(devicePressure));
    return true;
  }
  pointerUp() {
    if (!this.pointerActive) return false;
    this.pointerActive = false; this.releaseRequested = true;
    if (this.phase === 'hold' && this.holdTime >= .12) this.beginRelease();
    return true;
  }
  pointerCancel() { if (this.phase !== 'observe') this.interrupt('pointer-cancel'); }
  interrupt(reason = 'guest-jolt') {
    if (this.phase === 'observe' || this.phase === 'interrupted' || this.phase === 'recover') return false;
    const hadContact = this.contactActive, duration = this.holdTime;
    this.pointerActive = false; this.releaseRequested = false;
    if (hadContact) { this.contactActive = false; this.emit('contactEnd', { reason }); }
    this.guestMood = 'uncomfortable'; this.guestRecoil = 1; this.effectTime = 0;
    if (hadContact && duration >= .12 && !this.committed && !this.signature) {
      this.committed = true; this.emit('commit', { interrupted: true, quality: 25, service: this.actionService(), duration, pathLength: this.pathLength });
    }
    this.emit('interrupted', { reason, hadContact }); this.enter('interrupted'); return true;
  }
  startSignature() {
    if (this.phase !== 'observe') return false;
    if (this.toolHeld) return false;
    if (this.technicianId === 'bao_master' && this.scene !== 'feet') return false;
    this.interactionId = ++this.serial; this.signature = true; this.committed = false; this.contactActive = false;
    this.target = { ...sceneZones[this.scene].center }; this.guestMood = 'anticipate'; this.effectTime = 0;
    this.emit('started', { signature: true }); this.enter('signaturePrep'); return true;
  }
  beginContact() {
    if (!this.contactValidator(this.frame())) { this.interrupt('missed-contact'); return; }
    this.contactActive = true; this.holdTime = 0; this.guestMood = 'responding'; this.effectTime = 0;
    this.enter('hold'); this.emit('contactStart', { target: { ...this.target }, signature: this.signature });
    if (this.signature && !this.committed) { this.committed = true; this.emit('skillImpact', { signature: true }); }
  }
  quality() {
    const z = this.activeZone();
    const landing = 1 - clamp(length(this.target, z.center) / Math.max(z.rx, z.ry));
    const path = this.pathLength < 8 ? .65 : clamp(this.pathLength / 140);
    const stability = 1 - clamp(Math.max(0, this.pressure - .85) * 2);
    const completion = clamp(this.holdTime / .55);
    const toolBonus = this.toolHeld ? (itemById[this.tool]?.bonus || 0) : 0;
    return Math.round(clamp((.4 * landing + .25 * path + .2 * stability + .15 * completion) * 100 + toolBonus, 0, 100));
  }
  beginRelease() {
    if (this.phase !== 'hold') return;
    this.contactActive = false; this.emit('contactEnd', { reason: 'release' });
    this.guestMood = 'recovering'; this.effectTime = 0;
    if (!this.committed && !this.signature) {
      this.committed = true;
      this.emit('commit', { interrupted: false, quality: this.quality(), service: this.actionService(), duration: this.holdTime, pathLength: this.pathLength });
    }
    this.enter('release');
  }
  update(dt) {
    if (!Number.isFinite(dt) || dt < 0) throw new Error('dt must be finite and nonnegative');
    const step = Math.min(dt, .05); this.phaseTime += step; this.effectTime += step;
    if (this.guestRecoil > 0) this.guestRecoil = Math.max(0, this.guestRecoil - step * 2.2);
    switch (this.phase) {
      case 'approach': if (this.phaseTime >= durations.approach) this.enter('observe'); break;
      case 'toolTake': if (this.phaseTime >= durations.toolTake) { this.toolHeld = true; this.emit('toolHeld'); this.enter('observe'); } break;
      case 'prepare': if (this.phaseTime >= durations.prepare) this.enter('precontact'); break;
      case 'precontact': if (this.phaseTime >= durations.precontact) this.enter('contact'); break;
      case 'contact': if (this.phaseTime >= durations.contact) this.beginContact(); break;
      case 'hold':
        this.holdTime += step;
        this.pressure = Math.max(this.pressure, clamp(.35 + this.holdTime * .34));
        if (this.releaseRequested && this.holdTime >= .12) this.beginRelease();
        break;
      case 'release': if (this.phaseTime >= durations.release) this.enter(this.toolHeld ? 'toolReturn' : 'recover'); break;
      case 'toolReturn': if (this.phaseTime >= durations.toolReturn) { this.toolHeld = false; this.emit('toolReturned', { returnedTool: this.tool }); this.tool = 'hand'; this.emit('toolSelected', { tool: 'hand' }); this.enter('recover'); } break;
      case 'interrupted': if (this.phaseTime >= durations.interrupted) this.enter(this.toolHeld ? 'toolReturn' : 'recover'); break;
      case 'recover': if (this.phaseTime >= durations.recover) { this.guestMood = 'neutral'; this.signature = false; this.enter('observe'); } break;
      case 'signaturePrep': if (this.phaseTime >= durations.signaturePrep) this.enter('signatureCharge'); break;
      case 'signatureCharge': if (this.phaseTime >= durations.signatureCharge) this.enter('signaturePose'); break;
      case 'signaturePose': if (this.phaseTime >= durations.signaturePose) this.beginContact(); break;
    }
    if (this.signature && this.phase === 'hold' && this.holdTime >= .32) this.beginRelease();
  }
  frame() {
    const p = this.phaseTime / (durations[this.phase] || 1);
    let reach = 0;
    if (this.phase === 'prepare') reach = .28 * ease(p);
    else if (this.phase === 'precontact') reach = .28 + .55 * ease(p);
    else if (this.phase === 'contact') reach = .83 + .17 * ease(p);
    else if (this.phase === 'hold') reach = 1;
    else if (this.phase === 'release') reach = 1 - ease(p);
    else if (this.phase === 'signaturePrep') reach = .15 * ease(p);
    else if (this.phase === 'signatureCharge') reach = .15 + .47 * ease(p);
    else if (this.phase === 'signaturePose') reach = .62 + .38 * ease(p);
    else if (this.phase === 'interrupted') reach = .72 * (1 - ease(p));
    const lift = this.contactActive ? clamp(this.pressure) : 0;
    return {
      phase: this.phase, phaseProgress: clamp(p), interactionId: this.interactionId, target: { ...this.target },
      approach: this.phase === 'approach' ? 1 - ease(p) : 0,
      reach, pressure: lift, contactActive: this.contactActive, guestMood: this.guestMood,
      guestRecoil: this.guestRecoil, tool: this.tool, toolHeld: this.toolHeld,
      signature: this.signature, gold: this.signature && this.technicianId === 'bao_master' ? (this.phase === 'signatureCharge' ? ease(p) : this.contactActive ? 1 : this.phase === 'release' ? 1 - ease(p) : 0) : 0,
      watchOn: !(this.signature && this.technicianId === 'bao_master' && !['signaturePrep', 'observe'].includes(this.phase)),
      holdTime: this.holdTime, quality: this.quality(), service: this.actionService(), zone: this.activeZone()
    };
  }
}
