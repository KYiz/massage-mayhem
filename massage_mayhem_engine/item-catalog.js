// The 19 named play props in art/视觉概念与资源生产清单.md, plus massage cream from the supplied leg-scene concept.
// UI papers/stamps are deliberately outside this playable inventory.
const all = ['back', 'legs', 'feet'];
export const items = [
  { id:'towel', assetId:'item_towel', name:'热毛巾', icon:'▤', group:'护理', scenes:['back','feet'], service:'gentle', bonus:5, gesture:'铺开包覆' },
  { id:'oil', assetId:'item_oil', name:'琥珀精油', icon:'◈', group:'护理', scenes:all, service:'gentle', bonus:8, gesture:'倾瓶涂抹' },
  { id:'massage_cream', assetId:'item_massage_cream', name:'按摩霜', icon:'▣', group:'护理', scenes:all, service:'gentle', bonus:7, gesture:'开罐取霜再涂抹' },
  { id:'cake', assetId:'item_cake', name:'草莓蛋糕', icon:'🍰', group:'招待', scenes:all, service:'food', bonus:8, gesture:'托盘递送' },
  { id:'basin', assetId:'item_basin', name:'木质泡脚盆', icon:'◡', group:'足疗', scenes:['feet'], service:'gentle', bonus:6, gesture:'双手端盆浸足' },
  { id:'hot_stone', assetId:'item_hot_stone', name:'热石', icon:'●', group:'护理', scenes:['back'], service:'strong', bonus:5, gesture:'包握热石滚压' },
  { id:'guasha', assetId:'item_guasha', name:'刮痧板', icon:'◕', group:'护理', scenes:['back'], service:'strong', bonus:3, gesture:'圆角板沿背滑动' },
  { id:'hammer', assetId:'item_hammer', name:'按摩锤', icon:'⚒', group:'护理', scenes:['back','legs'], service:'strong', bonus:2, gesture:'软头轻敲' },
  { id:'salt', assetId:'item_salt', name:'浴盐瓶', icon:'◈', group:'足疗', scenes:['feet'], service:'gentle', bonus:5, gesture:'撒盐入盆' },
  { id:'scrub', assetId:'item_scrub', name:'磨脚石', icon:'▰', group:'足疗', scenes:['feet'], service:'strong', bonus:3, gesture:'足底打圈' },
  { id:'footcare', assetId:'item_footcare', name:'卡通足部护理器', icon:'✦', group:'足疗', scenes:['feet'], service:'gentle', bonus:4, gesture:'圆角护理头轻触' },
  { id:'milk_tea', assetId:'item_milk_tea', name:'奶茶', icon:'▣', group:'招待', scenes:all, service:'food', bonus:7, gesture:'握杯递送' },
  { id:'hotpot', assetId:'item_hotpot', name:'火锅小份', icon:'♨', group:'招待', scenes:all, service:'food', bonus:6, gesture:'托盘递锅' },
  { id:'healthy_meal', assetId:'item_healthy_meal', name:'健康餐盒', icon:'▱', group:'招待', scenes:all, service:'food', bonus:5, gesture:'双手递餐盒' },
  { id:'slipper', assetId:'item_slipper', name:'普通拖鞋', icon:'◕', group:'整蛊', scenes:['feet'], service:'prank', bonus:2, gesture:'捏后跟轻碰' },
  { id:'glow_slipper', assetId:'item_glow_slipper', name:'发光拖鞋', icon:'✧', group:'整蛊', scenes:['feet'], service:'prank', bonus:3, gesture:'发光贴花弹出' },
  { id:'durian', assetId:'item_durian', name:'榴莲皮', icon:'✹', group:'整蛊', scenes:all, service:'prank', bonus:-8, gesture:'夸张虚碰警示' },
  { id:'spatula', assetId:'item_spatula', name:'炒菜铁铲', icon:'♤', group:'整蛊', scenes:all, service:'prank', bonus:-4, gesture:'非锋利铲面虚碰' },
  { id:'banana', assetId:'item_banana', name:'香蕉皮', icon:'⌣', group:'整蛊', scenes:all, service:'prank', bonus:1, gesture:'滑稽甩皮' },
  { id:'feather', assetId:'item_feather', name:'羽毛', icon:'〃', group:'整蛊', scenes:['feet'], service:'prank', bonus:4, gesture:'羽尖轻扫' }
];
export const itemById = Object.fromEntries(items.map(item => [item.id, item]));
// Item access follows the current battle level, independently of coin-purchased technician ownership.
// Chapters introduce feet at L7 and legs at L13; Bao is revealed after L30 and receives all 20 on purchase.
export const castItemUnlocks = {
  charming_m: { towel:1, oil:1, cake:3, milk_tea:7, feather:10, massage_cream:13, banana:16, healthy_meal:19, hot_stone:22, glow_slipper:28 },
  charming_f: { towel:1, oil:1, massage_cream:3, cake:7, milk_tea:10, footcare:13, healthy_meal:16, feather:19, salt:22, glow_slipper:28 },
  uncle: { towel:1, oil:1, massage_cream:3, hot_stone:7, hammer:10, scrub:13, guasha:16, basin:19, salt:22, footcare:28 },
  aunt: { towel:1, oil:1, cake:3, basin:7, milk_tea:10, salt:13, healthy_meal:16, hotpot:19, footcare:22, feather:28 },
  gentle: { towel:1, oil:1, massage_cream:3, hot_stone:7, guasha:10, footcare:13, healthy_meal:16, hammer:19, salt:22, feather:28 },
  power: { towel:1, oil:1, massage_cream:3, hammer:7, basin:10, scrub:13, footcare:16, hot_stone:19, guasha:22, hotpot:28 },
  joker: { towel:1, oil:1, cake:3, slipper:7, banana:10, feather:13, milk_tea:16, glow_slipper:19, massage_cream:22, durian:25, spatula:28 },
  bao_master: Object.fromEntries(items.map(item => [item.id, 30]))
};
export const castInventory = Object.fromEntries(Object.entries(castItemUnlocks).map(([cast, unlocks]) => [cast, Object.keys(unlocks)]));
export const itemUnlockLevel = (cast, itemId) => castItemUnlocks[cast]?.[itemId] ?? Infinity;
export const playableFor = (cast, scene, level = 30) => items.filter(item => castInventory[cast]?.includes(item.id) && item.scenes.includes(scene) && (cast === 'bao_master' || itemUnlockLevel(cast, item.id) <= level));
export const offerZones = {
  back: { center: { x: 414, y: 348 }, rx: 52, ry: 47, label: '递给顾客' },
  legs: { center: { x: 405, y: 306 }, rx: 48, ry: 44, label: '递给顾客' },
  feet: { center: { x: 507, y: 222 }, rx: 53, ry: 49, label: '递给顾客' }
};
