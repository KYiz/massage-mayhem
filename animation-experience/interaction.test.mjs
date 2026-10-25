import test from 'node:test';
import assert from 'node:assert/strict';
import { InteractionDirector, sceneZones } from './interaction.js';

function advance(d, seconds) { for (let t = 0; t < seconds; t += .02) d.update(.02); }
function make(id = 'charming_m', scene = 'back') { const events = []; return { d: new InteractionDirector({ technicianId: id, scene, onEvent: e => events.push(e) }), events }; }
const count = (events, type) => events.filter(event => event.type === type).length;

test('entry walk resolves to observation before player input is accepted', () => {
  const { d } = make();
  assert.equal(d.startApproach(), true); assert.equal(d.pointerDown(sceneZones.back.center), false);
  advance(d, .8); assert.equal(d.phase, 'observe'); assert.equal(d.pointerDown(sceneZones.back.center), true);
});

test('a short click creates one contact, guest reaction, and one rule commit', () => {
  const { d, events } = make();
  assert.equal(d.pointerDown(sceneZones.back.center), true);
  d.pointerUp(); advance(d, 1.3);
  assert.equal(count(events, 'contactStart'), 1);
  assert.equal(count(events, 'contactEnd'), 1);
  assert.equal(count(events, 'commit'), 1);
  assert.ok(events.findIndex(e => e.type === 'contactStart') < events.findIndex(e => e.type === 'commit'));
  assert.equal(d.phase, 'observe'); assert.equal(d.frame().guestMood, 'neutral');
});
test('hold and drag keep one continuous contact with quality and changing target', () => {
  const { d, events } = make('aunt', 'feet');
  d.pointerDown(sceneZones.feet.center); advance(d, .6);
  assert.equal(d.frame().contactActive, true);
  const first = d.frame().target;
  d.pointerMove({ x: first.x + 50, y: first.y + 10 }, .55); advance(d, 1);
  assert.ok(d.frame().target.x > first.x); assert.ok(d.frame().holdTime > 1);
  d.pointerUp(); advance(d, .7);
  assert.equal(count(events, 'commit'), 1); assert.ok(events.find(e => e.type === 'commit').pathLength >= 50);
  assert.equal(d.frame().contactActive, false);
});
test('a precontact guest jolt cancels without contact or scoring', () => {
  const { d, events } = make();
  d.pointerDown(sceneZones.back.center); advance(d, .2); d.interrupt('guest-jolt'); advance(d, .8);
  assert.equal(count(events, 'contactStart'), 0); assert.equal(count(events, 'commit'), 0); assert.equal(d.phase, 'observe');
});
test('a jolt after contact stops the guest and commits at most once', () => {
  const { d, events } = make();
  d.pointerDown(sceneZones.back.center); advance(d, .7); d.interrupt('guest-jolt'); advance(d, .8);
  assert.equal(count(events, 'contactStart'), 1); assert.equal(count(events, 'contactEnd'), 1);
  assert.equal(count(events, 'commit'), 1); assert.equal(events.find(e => e.type === 'commit').quality, 25);
});
test('an unreachable hand cannot trigger a false contact or rule commit', () => {
  const events = [];
  const d = new InteractionDirector({ onEvent: e => events.push(e), contactValidator: () => false });
  d.pointerDown(sceneZones.back.center); d.pointerUp(); advance(d, 1);
  assert.equal(count(events, 'contactStart'), 0); assert.equal(count(events, 'commit'), 0);
  assert.equal(events.find(e => e.type === 'interrupted').reason, 'missed-contact');
});
test('tool take and return bracket the actual contact', () => {
  const { d, events } = make();
  assert.equal(d.selectTool('towel'), true); advance(d, .45); assert.equal(d.toolHeld, true);
  d.pointerDown(sceneZones.back.center); d.pointerUp(); advance(d, 1.5);
  assert.equal(count(events, 'toolHeld'), 1); assert.equal(count(events, 'toolReturned'), 1);
  assert.ok(events.findIndex(e => e.type === 'toolHeld') < events.findIndex(e => e.type === 'contactStart'));
  assert.ok(events.findIndex(e => e.type === 'contactEnd') < events.findIndex(e => e.type === 'toolReturned'));
});
test('a held comfort tool changes the quality sent to the existing rule engine', () => {
  const bare = make(), oil = make();
  bare.d.pointerDown(sceneZones.back.center); bare.d.pointerUp(); advance(bare.d, 1);
  oil.d.selectTool('oil'); advance(oil.d, .45);
  oil.d.pointerDown(sceneZones.back.center); oil.d.pointerUp(); advance(oil.d, 1);
  assert.equal(oil.events.find(e => e.type === 'commit').quality - bare.events.find(e => e.type === 'commit').quality, 8);
});
test('Bao skill can only hit the foot scene and fires once', () => {
  const back = make('bao_master', 'back'); assert.equal(back.d.startSignature(), false);
  const { d, events } = make('bao_master', 'feet');
  assert.equal(d.startSignature(), true); advance(d, 2.6);
  assert.equal(count(events, 'skillImpact'), 1); assert.equal(count(events, 'contactStart'), 1);
  assert.equal(count(events, 'contactEnd'), 1); assert.equal(d.phase, 'observe');
});
