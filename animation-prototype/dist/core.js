import { scenePose,                                                                                                       } from './data.js';










const clamp = (v        , a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v        ) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a        , b        , t        ) => a + (b - a) * t;
const move = (a       , b       , t        )        => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
const rotateAround = (p       , origin       , angle        )        => ({
  x: origin.x + (p.x - origin.x) * Math.cos(angle) - (p.y - origin.y) * Math.sin(angle),
  y: origin.y + (p.x - origin.x) * Math.sin(angle) + (p.y - origin.y) * Math.cos(angle)
});

export const durations                           = {
  idle: Infinity, walk: 1.25, turn: .7, reach: .95, massage: 1.45,
  take_tool: 1.05, happy: .95, angry: .95, fail: 1.15, signature: 2.2
};

// Two-bone IK: input target may be unreachable; it is clamped to the exact reachable annulus.
export function solveTwoBoneIK(shoulder       , target       , upper        , lower        , bend        )            {
  if (!(upper > 0 && lower > 0)) throw new Error('Arm lengths must be positive');
  const dx = target.x - shoulder.x, dy = target.y - shoulder.y;
  const distance = Math.hypot(dx, dy);
  const minReach = Math.abs(upper - lower) + .001;
  const maxReach = upper + lower - .001;
  const reach = clamp(distance, minReach, maxReach);
  const angle = distance > .0001 ? Math.atan2(dy, dx) : 0;
  const along = (upper * upper + reach * reach - lower * lower) / (2 * reach);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const ux = Math.cos(angle), uy = Math.sin(angle);
  const elbow = { x: shoulder.x + along * ux - bend * height * uy, y: shoulder.y + along * uy + bend * height * ux };
  const hand = { x: shoulder.x + reach * ux, y: shoulder.y + reach * uy };
  return { shoulder, elbow, hand };
}

export class CharacterAnimator {
  profile                   ;
  guest              ;
  scene         ;
  mood       = 'neutral';
  action           = 'idle';
  time = 0;
          blendFrom                   = null;
          blendTime = .18;
          contactSent = false;
          events                   = [];

  constructor(profile                   , guest              , scene         ) {
    this.profile = profile; this.guest = guest; this.scene = scene;
  }

  setCast(profile                   , guest              , scene         ) {
    this.profile = profile; this.guest = guest; this.scene = scene;
    this.action = 'idle'; this.time = 0; this.blendFrom = null; this.contactSent = false; this.events.length = 0; this.mood = 'neutral';
  }

  play(action          ) {
    if (action === 'signature' && this.profile.signature.scene && this.profile.signature.scene !== this.scene) return false;
    if (action === this.action && action === 'idle') return;
    const previous = this.action;
    const from = this.sample();
    if (previous !== 'idle' && this.time < durations[previous]) this.events.push({ type: 'interrupted', action: previous, technicianId: this.profile.id, scene: this.scene });
    this.blendFrom = from; this.blendTime = 0;
    this.action = action; this.time = 0; this.contactSent = false;
    return true;
  }

  setMood(mood      ) { this.mood = mood; }

  update(dt        )                   {
    if (!Number.isFinite(dt) || dt < 0) throw new Error('dt must be a nonnegative finite number');
    const step = Math.min(dt, .1);
    this.time += step; this.blendTime += step;
    const duration = durations[this.action];
    const contactAt = this.action === 'signature' ? this.profile.signature.contactAt : .66;
    const hasContact = this.action === 'massage' || this.action === 'signature';
    if (hasContact && !this.contactSent && this.time / duration >= contactAt) {
      this.contactSent = true;
      this.events.push({ type: 'contact', action: this.action, technicianId: this.profile.id, scene: this.scene });
    }
    if (this.time >= duration) {
      this.events.push({ type: 'completed', action: this.action, technicianId: this.profile.id, scene: this.scene });
      this.action = 'idle'; this.time = 0; this.blendFrom = null; this.contactSent = false;
    }
    return this.events.splice(0);
  }

  sample()            {
    const p = this.profile, spec = scenePose[this.scene];
    const x = this.scene === 'back' ? 520 : this.scene === 'legs' ? 580 : 675;
    const y = 426;
    const pulse = Math.sin(this.time * 3.2) * 2;
    const shoulderL = { x: x + p.handAnchor.left[0], y: y + p.handAnchor.left[1] + pulse };
    const shoulderR = { x: x + p.handAnchor.right[0], y: y + p.handAnchor.right[1] + pulse };
    const idleL = { x: shoulderL.x - 25, y: shoulderL.y + 87 };
    const idleR = { x: shoulderR.x + 25, y: shoulderR.y + 87 };
    const contact = { x: spec.contact[0], y: spec.contact[1] };
    const progress = clamp(this.time / durations[this.action]);
    let leftTarget = idleL, rightTarget = idleR, bodyAngle = 0, offset = 0;
    let toolVisible = false, watchVisible = true, goldPower = 0;
    const action = this.action;
    if (action === 'walk') {
      offset = -30 + 30 * smooth(progress);
      leftTarget = { x: idleL.x + Math.sin(this.time * 12) * 18, y: idleL.y };
      rightTarget = { x: idleR.x - Math.sin(this.time * 12) * 18, y: idleR.y };
    } else if (action === 'turn') bodyAngle = Math.sin(progress * Math.PI) * .17;
    else if (action === 'reach' || action === 'massage' || action === 'signature') {
      const reach = smooth(progress / (action === 'signature' ? .76 : .5));
      const contactL = { x: contact.x - 9, y: contact.y - 2 };
      const contactR = { x: contact.x + 9, y: contact.y + 2 };
      leftTarget = move(idleL, contactL, reach);
      rightTarget = move(idleR, contactR, reach);
      if (action === 'massage') {
        const push = Math.sin(progress * Math.PI * 3) * 8 * reach;
        leftTarget.y += push; rightTarget.y += push;
      }
      if (action === 'signature') {
        if (p.signature.id === 'flying_kiss') {
          leftTarget = move(idleL, { x: x - 3, y: y - p.body.torsoHeight - 37 }, smooth(progress / .42));
          rightTarget = move(idleR, { x: x + 145, y: y - p.body.torsoHeight - 83 }, smooth(progress / .72));
        } else if (p.signature.id === 'offer_food') {
          toolVisible = progress >= .3;
          leftTarget = move(idleL, { x: 450, y: 322 }, smooth(progress / .55));
          rightTarget = move(idleR, { x: 535, y: 319 }, smooth(progress / .68));
        } else if (p.signature.id === 'golden_right_hand') {
          watchVisible = progress < .25;
          leftTarget = move(idleL, { x: x + 25, y: y - 130 }, smooth(progress / .26));
          const charge = { x: x + 80, y: y - 132 };
          rightTarget = progress < .55 ? move(idleR, charge, smooth(progress / .45)) : move(charge, contactR, smooth((progress - .55) / .28));
          goldPower = progress < .35 ? 0 : progress < .82 ? smooth((progress - .35) / .47) : 1 - smooth((progress - .82) / .18);
        }
      }
    } else if (action === 'take_tool') {
      toolVisible = progress >= .55;
      rightTarget = move(idleR, { x: 455, y: 399 }, smooth(progress / .6));
    } else if (action === 'happy') {
      leftTarget.y -= 45 * Math.sin(progress * Math.PI); rightTarget.y -= 56 * Math.sin(progress * Math.PI);
    } else if (action === 'angry') {
      bodyAngle = -.08; leftTarget.x += 20; rightTarget.x -= 20;
    } else if (action === 'fail') {
      bodyAngle = .17 * Math.sin(progress * Math.PI); leftTarget.y += 35; rightTarget.y += 35;
    }
    const left = solveTwoBoneIK(shoulderL, leftTarget, p.body.upperArm, p.body.forearm, p.bend.left);
    const right = solveTwoBoneIK(shoulderR, rightTarget, p.body.upperArm, p.body.forearm, p.bend.right);
    if (offset || bodyAngle) {
      for (const arm of [left, right]) {
        for (const joint of [arm.shoulder, arm.elbow, arm.hand]) {
          const transformed = rotateAround(joint, { x, y }, bodyAngle);
          joint.x = transformed.x + offset; joint.y = transformed.y;
        }
      }
    }
    const raw            = { x: x + offset, y: y + pulse, bodyAngle, face: this.mood, left, right, contact,
      contactActive: this.contactSent && (action === 'massage' || action === 'signature'), toolVisible, watchVisible, goldPower };
    if (!this.blendFrom || this.blendTime >= .18) return raw;
    const b = smooth(this.blendTime / .18), from = this.blendFrom;
    return { ...raw, x: mix(from.x, raw.x, b), y: mix(from.y, raw.y, b), bodyAngle: mix(from.bodyAngle, raw.bodyAngle, b),
      left: { shoulder: move(from.left.shoulder, raw.left.shoulder, b), elbow: move(from.left.elbow, raw.left.elbow, b), hand: move(from.left.hand, raw.left.hand, b) },
      right: { shoulder: move(from.right.shoulder, raw.right.shoulder, b), elbow: move(from.right.elbow, raw.right.elbow, b), hand: move(from.right.hand, raw.right.hand, b) }
    };
  }
}

export const guestDurations                                = {
  enter: 1, idle: Infinity, relaxed: .9, pain: .65, refuse: .9, complain: 1.2, leave: 1
};

// Guest animation uses the same event timing contract for all seven profiles; scene-specific art is selected by scene ID.
export class GuestAnimator {
  profile              ;
  scene         ;
  action                = 'idle';
  mood       = 'neutral';
  time = 0;
  constructor(profile              , scene         ) { this.profile = profile; this.scene = scene; }
  setCast(profile              , scene         ) { this.profile = profile; this.scene = scene; this.action = 'idle'; this.mood = 'neutral'; this.time = 0; }
  setMood(mood      ) { this.mood = mood; }
  play(action               ) {
    this.action = action; this.time = 0;
    const expression                                       = { relaxed: 'delighted', pain: 'uncomfortable', refuse: 'refused', complain: 'angry' };
    if (expression[action]) this.mood = expression[action] ;
  }
  update(dt        ) {
    if (!Number.isFinite(dt) || dt < 0) throw new Error('dt must be a nonnegative finite number');
    this.time += Math.min(dt, .1);
    if (this.time >= guestDurations[this.action]) { const finished = this.action; this.action = 'idle'; this.time = 0; return finished; }
    return null;
  }
  sample()             {
    const p = clamp(this.time / guestDurations[this.action]);
    switch (this.action) {
      case 'enter': return { dx: -70 * (1 - smooth(p)), dy: 0, angle: 0, mood: this.mood };
      case 'leave': return { dx: 75 * smooth(p), dy: 0, angle: 0, mood: this.mood };
      case 'relaxed': return { dx: 0, dy: -10 * Math.sin(p * Math.PI), angle: -.035 * Math.sin(p * Math.PI), mood: this.mood };
      case 'pain': return { dx: 9 * Math.sin(p * Math.PI * 6), dy: -8 * Math.sin(p * Math.PI), angle: .06 * Math.sin(p * Math.PI), mood: this.mood };
      case 'refuse': return { dx: -9 * Math.sin(p * Math.PI), dy: 0, angle: .08 * Math.sin(p * Math.PI * 4), mood: this.mood };
      case 'complain': return { dx: 0, dy: -13 * Math.sin(p * Math.PI), angle: -.08 * Math.sin(p * Math.PI), mood: this.mood };
      default: return { dx: 0, dy: Math.sin(this.time * 2.4) * 1.5, angle: 0, mood: this.mood };
    }
  }
}
