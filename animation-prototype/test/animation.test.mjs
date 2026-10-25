import test from 'node:test';
import assert from 'node:assert/strict';
import { technicians, guests, scenePose, technicianPartUrl, guestPoseUrl } from '../dist/data.js';
import { CharacterAnimator, GuestAnimator, solveTwoBoneIK, durations } from '../dist/core.js';

const byId = (list, id) => list.find(x => x.id === id);
const step = (animator, seconds) => {
  const all = [];
  for (let t = 0; t < seconds; t += .05) all.push(...animator.update(.05));
  return all;
};

test('八名技师和七类顾客具有独立配置、素材路径及三场景姿态', () => {
  assert.equal(technicians.length, 8);
  assert.equal(new Set(technicians.map(t => t.id)).size, 8);
  assert.equal(guests.length, 7);
  assert.equal(new Set(guests.map(g => g.id)).size, 7);
  assert.deepEqual(Object.keys(scenePose), ['back', 'legs', 'feet']);
  for (const t of technicians) {
    assert.ok(t.body.upperArm > 0 && t.body.forearm > 0);
    assert.ok(t.handAnchor.left && t.handAnchor.right && t.signature.id && t.signature.clip);
    assert.match(technicianPartUrl(t, 'handR'), new RegExp(`/${t.id}/parts/handR.png$`));
  }
  for (const g of guests) {
    assert.equal(g.moods.length, 7);
    for (const scene of Object.keys(scenePose)) assert.match(guestPoseUrl(g, scene), new RegExp(`/${g.id}/poses/${scene}.png$`));
  }
});

test('同一状态机适配阿烈和芬姨的不同体型，双手关节长度守恒', () => {
  const ale = byId(technicians, 'charming_m');
  const aunt = byId(technicians, 'aunt');
  assert.notEqual(ale.body.torsoWidth, aunt.body.torsoWidth);
  assert.notEqual(ale.body.height, aunt.body.height);
  for (const profile of [ale, aunt]) {
    const animator = new CharacterAnimator(profile, guests[0], 'back');
    animator.play('massage');
    step(animator, .9);
    const pose = animator.sample();
    for (const arm of [pose.left, pose.right]) {
      assert.ok(Math.abs(Math.hypot(arm.elbow.x - arm.shoulder.x, arm.elbow.y - arm.shoulder.y) - profile.body.upperArm) < .01);
      assert.ok(Math.abs(Math.hypot(arm.hand.x - arm.elbow.x, arm.hand.y - arm.elbow.y) - profile.body.forearm) < .01);
    }
    assert.ok(Number.isFinite(pose.right.hand.x));
    assert.ok(Math.hypot(pose.right.hand.x - pose.contact.x, pose.right.hand.y - pose.contact.y) <= 12);
  }
});

test('不可及目标由 IK 裁剪，不产生 NaN 或手臂变长', () => {
  const pose = solveTwoBoneIK({ x: 0, y: 0 }, { x: 1000, y: 200 }, 60, 50, 1);
  assert.ok(Math.hypot(pose.hand.x, pose.hand.y) < 111);
  assert.ok(Number.isFinite(pose.elbow.x));
  assert.throws(() => solveTwoBoneIK({x:0,y:0},{x:1,y:1},0,30,1));
});

test('中断动作不会补发旧按摩接触帧，完成动作会返回待机', () => {
  const animator = new CharacterAnimator(technicians[0], guests[0], 'back');
  animator.play('massage');
  step(animator, .25);
  animator.play('fail');
  const events = step(animator, durations.fail + .2);
  assert.ok(events.some(e => e.type === 'interrupted' && e.action === 'massage'));
  assert.ok(!events.some(e => e.type === 'contact' && e.action === 'massage'));
  assert.ok(events.some(e => e.type === 'completed' && e.action === 'fail'));
  assert.equal(animator.action, 'idle');
});

test('包师傅技能只在足疗可用，接触事件恰好一次且发生在卸表后', () => {
  const bao = byId(technicians, 'bao_master');
  const animator = new CharacterAnimator(bao, guests[0], 'back');
  assert.equal(animator.play('signature'), false);
  assert.equal(animator.action, 'idle');
  animator.setCast(bao, guests[0], 'feet');
  assert.equal(animator.play('signature'), true);
  step(animator, .9);
  assert.equal(animator.sample().watchVisible, false);
  assert.ok(animator.sample().goldPower > 0);
  const events = step(animator, 1.4);
  assert.equal(events.filter(e => e.type === 'contact').length, 1);
  assert.equal(events.find(e => e.type === 'contact')?.technicianId, 'bao_master');
});

test('七类顾客共用动作状态机，三场景姿态和表情反馈可独立切换', () => {
  for (const profile of guests) for (const scene of Object.keys(scenePose)) {
    const animator = new GuestAnimator(profile, scene);
    animator.play('enter'); animator.update(.1);
    assert.ok(animator.sample().dx < 0);
    animator.play('refuse');
    assert.equal(animator.sample().mood, 'refused');
    animator.play('complain');
    assert.equal(animator.sample().mood, 'angry');
    animator.setMood('shocked');
    assert.equal(animator.sample().mood, 'shocked');
    assert.equal(animator.scene, scene);
  }
});
