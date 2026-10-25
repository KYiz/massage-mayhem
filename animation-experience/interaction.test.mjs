import test from 'node:test';
import assert from 'node:assert/strict';
import { InteractionDirector, sceneZones } from './interaction.js';
import { castInventory, items } from './items.js';
import { heldItemSvg } from './item-art.js';
import { beginBattle } from '../massage_mayhem_engine/game-rules.js';
import { itemAvailability, itemTuning, performItem } from './item-rules.js';

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
test('tool quality is scored once, then tuned by its item rule', () => {
  const bare = make(), oil = make();
  bare.d.pointerDown(sceneZones.back.center); bare.d.pointerUp(); advance(bare.d, 1);
  oil.d.selectTool('oil'); advance(oil.d, .45);
  oil.d.pointerDown(sceneZones.back.center); oil.d.pointerUp(); advance(oil.d, 1);
  assert.equal(oil.events.find(e => e.type === 'commit').quality, bare.events.find(e => e.type === 'commit').quality);
});
test('Bao skill can only hit the foot scene and fires once', () => {
  const back = make('bao_master', 'back'); assert.equal(back.d.startSignature(), false);
  const { d, events } = make('bao_master', 'feet');
  assert.equal(d.startSignature(), true); advance(d, 2.6);
  assert.equal(count(events, 'skillImpact'), 1); assert.equal(count(events, 'contactStart'), 1);
  assert.equal(count(events, 'contactEnd'), 1); assert.equal(d.phase, 'observe');
});
test('Bao can use all 19 documented props plus concept-image massage cream', () => {
  assert.equal(items.length, 20);
  assert.equal(new Set(items.map(item => item.assetId)).size, 20);
  assert.equal(castInventory.bao_master.length, 20);
  for (const item of items) {
    assert.ok(heldItemSvg(item.id, { x: 0, y: 0 }).includes('<g'), `missing held art for ${item.id}`);
    const { d, events } = make('bao_master', item.scenes[0]);
    assert.equal(d.selectTool(item.id), true, item.id);
    advance(d, .45);
    d.pointerDown(d.activeZone().center); d.pointerUp(); advance(d, 1.5);
    assert.equal(count(events, 'toolHeld'), 1, item.id);
    assert.equal(count(events, 'contactStart'), 1, item.id);
    assert.equal(count(events, 'commit'), 1, item.id);
    assert.equal(events.find(e => e.type === 'commit').service, item.service, item.id);
    assert.equal(count(events, 'toolReturned'), 1, item.id);
    assert.equal(d.tool, 'hand', item.id);
  }
});
test('scene restrictions and smaller inventories remain enforced', () => {
  const baoBack = make('bao_master', 'back').d;
  assert.equal(baoBack.selectTool('basin'), false);
  assert.equal(baoBack.selectTool('hot_stone'), true);
  const ale = make('charming_m', 'feet').d;
  assert.equal(ale.selectTool('feather'), false);
  assert.equal(ale.selectTool('cake'), true);
});
test('a held item can be deliberately returned before choosing another', () => {
  const { d, events } = make('bao_master', 'feet');
  d.selectTool('salt'); advance(d, .45);
  assert.equal(d.selectTool('feather'), false);
  assert.equal(d.selectTool('hand'), true);
  advance(d, .7);
  assert.equal(d.tool, 'hand'); assert.equal(count(events, 'toolReturned'), 1);
  assert.equal(d.selectTool('feather'), true);
});
test('all Bao items have distinct rule settings and produce a traceable item result', () => {
  const levels = [{ level:1, comfortGoal:99, patience:90, maxActions:50, servicePool:['gentle','strong','food','prank'], scenePool:['back','legs','feet'] }];
  assert.equal(Object.keys(itemTuning).length, 20);
  for (const item of items) {
    const battle = beginBattle({ id:`qa-${item.id}`, level:1, therapistId:'bao_master', guestId:'foodie', scene:item.scenes[0], rareOffered:false }, levels);
    assert.equal(itemAvailability(battle, item.id, 999).ok, true, item.id);
    const result = performItem(battle, levels, item.id, 70, 999);
    assert.equal(result.turns, 1, item.id);
    assert.equal(result.itemUses[item.id], 1, item.id);
    assert.ok(result.log.some(entry => entry.type === 'item' && entry.itemId === item.id), item.id);
    assert.equal(battle.itemUses, undefined, 'the original battle must stay unchanged');
  }
});
test('item stock, cooldown, scene and affordability block invalid use', () => {
  const levels = [{ level:1, comfortGoal:99, patience:90, maxActions:50, servicePool:['gentle','strong','food','prank'], scenePool:['back','legs','feet'] }];
  const fresh = beginBattle({ id:'qa-stock', level:1, therapistId:'bao_master', guestId:'foodie', scene:'feet', rareOffered:false }, levels);
  assert.equal(itemAvailability(fresh, 'hot_stone').reason, '此场景不可用');
  assert.equal(itemAvailability(fresh, 'cake', 5).reason, '金币不足');
  const used = performItem(fresh, levels, 'oil', 70, 999);
  assert.match(itemAvailability(used, 'oil', 999).reason, /冷却/);
  const exhausted = { ...fresh, itemUses: { oil: itemTuning.oil.stock } };
  assert.equal(itemAvailability(exhausted, 'oil').reason, '本局用尽');
});
test('Bao can use a personally owned item even when an early level omits its service family', () => {
  const levels = [{ level:1, comfortGoal:99, patience:90, maxActions:50, servicePool:['gentle'], scenePool:['back'] }];
  const battle = beginBattle({ id:'qa-early', level:1, therapistId:'bao_master', guestId:'foodie', scene:'back', rareOffered:false }, levels);
  const result = performItem(battle, levels, 'durian', 70, 999);
  assert.equal(result.turns, 1);
  assert.ok(result.log.some(entry => entry.type === 'item' && entry.itemId === 'durian'));
  assert.deepEqual(levels[0].servicePool, ['gentle']);
});
test('an item risk modifier can override a comfort win with a complaint failure', () => {
  const levels = [{ level:1, comfortGoal:1, patience:90, maxActions:50, servicePool:['prank'], scenePool:['back'] }];
  const start = beginBattle({ id:'qa-risk', level:1, therapistId:'bao_master', guestId:'foodie', scene:'back', rareOffered:false }, levels);
  const result = performItem({ ...start, complaint:98 }, levels, 'durian', 80, 999);
  assert.equal(result.status, 'complaint_failed');
  assert.equal(result.log.filter(entry => entry.type === 'end').length, 1);
});
