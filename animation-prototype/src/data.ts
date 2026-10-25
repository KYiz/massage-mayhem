export type SceneId = 'back' | 'legs' | 'feet';
export type Mood = 'neutral' | 'relaxed' | 'delighted' | 'uncomfortable' | 'angry' | 'refused' | 'shocked';
export type ActionId = 'idle' | 'walk' | 'turn' | 'reach' | 'massage' | 'take_tool' | 'happy' | 'angry' | 'fail' | 'signature';
export type GuestActionId = 'enter' | 'idle' | 'relaxed' | 'pain' | 'refuse' | 'complain' | 'leave';

export interface TechnicianProfile {
  id: string;
  name: string;
  silhouette: string;
  costume: string;
  body: { head: number; torsoWidth: number; torsoHeight: number; upperArm: number; forearm: number; hipWidth: number; height: number; handScale: number };
  handAnchor: { left: [number, number]; right: [number, number] };
  palette: { skin: string; shirt: string; trim: string; hair: string };
  bend: { left: 1 | -1; right: 1 | -1 };
  animationRoot: string;
  signature: { id: string; clip: string; contactAt: number; scene?: SceneId };
  verification: boolean;
}

export interface GuestProfile {
  id: string;
  name: string;
  body: { width: number; height: number; head: number; skin: string; hair: string; cover: string };
  poseRoot: string;
  expressionRoot: string;
  moods: readonly Mood[];
}

const moods: readonly Mood[] = ['neutral', 'relaxed', 'delighted', 'uncomfortable', 'angry', 'refused', 'shocked'];
const t = (id: string, name: string, silhouette: string, costume: string, body: TechnicianProfile['body'], palette: TechnicianProfile['palette'], signature: TechnicianProfile['signature'], verification = false): TechnicianProfile => ({
  id, name, silhouette, costume, body, palette, signature, verification,
  handAnchor: { left: [-body.torsoWidth * .45, -body.torsoHeight * .72], right: [body.torsoWidth * .45, -body.torsoHeight * .72] },
  bend: { left: -1, right: 1 }, animationRoot: `assets/technicians/${id}`
});

// Eight distinct rigs share the action contract; only verification=true is animated in this sample.
export const technicians: readonly TechnicianProfile[] = [
  t('charming_m', '阿烈', '狼尾、窄腰', '黑红修身制服', { head: 31, torsoWidth: 78, torsoHeight: 112, upperArm: 67, forearm: 62, hipWidth: 58, height: 188, handScale: 1 }, { skin: '#D99878', shirt: '#30242A', trim: '#A93947', hair: '#2A2022' }, { id: 'flying_kiss', clip: 'signature/flying_kiss', contactAt: .69 }, true),
  t('charming_f', '小曼', '高马尾、星发夹', '粉黑制服', { head: 30, torsoWidth: 66, torsoHeight: 99, upperArm: 59, forearm: 56, hipWidth: 58, height: 174, handScale: .88 }, { skin: '#E4A48B', shirt: '#282128', trim: '#DC6E89', hair: '#302027' }, { id: 'heart_gesture', clip: 'signature/heart_gesture', contactAt: .68 }),
  t('uncle', '老冯', '浓眉、方手掌', '旧白背心', { head: 36, torsoWidth: 110, torsoHeight: 115, upperArm: 78, forearm: 70, hipWidth: 76, height: 183, handScale: 1.35 }, { skin: '#BA8267', shirt: '#D8D2C6', trim: '#344760', hair: '#63666A' }, { id: 'charged_press', clip: 'signature/charged_press', contactAt: .78 }),
  t('aunt', '芬姨', '短卷发、圆润轮廓', '花围裙', { head: 37, torsoWidth: 112, torsoHeight: 105, upperArm: 61, forearm: 55, hipWidth: 100, height: 164, handScale: 1.04 }, { skin: '#D9A17B', shirt: '#EFC9A2', trim: '#5D8A61', hair: '#52342A' }, { id: 'offer_food', clip: 'signature/offer_food', contactAt: .64 }, true),
  t('gentle', '岚姐', '眼镜、锐角肩线', '黑酒红制服', { head: 29, torsoWidth: 69, torsoHeight: 107, upperArm: 65, forearm: 58, hipWidth: 61, height: 182, handScale: .9 }, { skin: '#DDA386', shirt: '#29252B', trim: '#8F3945', hair: '#252329' }, { id: 'glasses_precision', clip: 'signature/glasses_precision', contactAt: .75 }),
  t('power', '阿虎', '宽肩、护腕', '蓝色运动制服', { head: 33, torsoWidth: 124, torsoHeight: 120, upperArm: 82, forearm: 74, hipWidth: 72, height: 197, handScale: 1.3 }, { skin: '#C58A69', shirt: '#315177', trim: '#E39643', hair: '#272528' }, { id: 'heavy_foot_press', clip: 'signature/heavy_foot_press', contactAt: .78, scene: 'feet' }),
  t('joker', '小周', '蘑菇头、大工服', '浅蓝卡其工服', { head: 34, torsoWidth: 73, torsoHeight: 104, upperArm: 57, forearm: 54, hipWidth: 65, height: 168, handScale: .92 }, { skin: '#E0AD90', shirt: '#A9BDCB', trim: '#D0B38C', hair: '#4A3530' }, { id: 'prank_freeze', clip: 'signature/prank_freeze', contactAt: .7 }),
  t('bao_master', '包师傅', '宽肩、黄金右手', '米白衫、深灰裤', { head: 37, torsoWidth: 121, torsoHeight: 115, upperArm: 82, forearm: 74, hipWidth: 101, height: 178, handScale: 1.43 }, { skin: '#C78762', shirt: '#E6DFD3', trim: '#B68B3B', hair: '#302B29' }, { id: 'golden_right_hand', clip: 'signature/golden_right_hand', contactAt: .82, scene: 'feet' }, true)
];

const g = (id: string, name: string, width: number, height: number, head: number, skin: string, hair: string, cover: string): GuestProfile => ({
  id, name, body: { width, height, head, skin, hair, cover }, poseRoot: `assets/guests/${id}/poses`, expressionRoot: `assets/guests/${id}/expressions`, moods
});
export const guests: readonly GuestProfile[] = [
  g('foodie', '吃货', 218, 92, 31, '#E5AA86', '#613F30', '#F3E9DC'),
  g('gentle_fan', '轻柔控', 185, 76, 29, '#DFA786', '#3E302B', '#E9E2D9'),
  g('strong_fan', '大力控', 227, 96, 32, '#C88C69', '#272629', '#DFE3E5'),
  g('playful', '爱玩型', 194, 82, 30, '#E4A782', '#593B2E', '#E6D9D5'),
  g('picky', '挑剔型', 182, 77, 29, '#E3B397', '#3A2926', '#EEE9E2'),
  g('easygoing', '憨憨型', 205, 91, 33, '#DFA47D', '#483328', '#EDE4D8'),
  g('tricky', '稀有客', 200, 85, 32, '#BA8E6C', '#292429', '#E8DDBD')
];

export const scenePose = {
  back: { label: '开背／趴卧', contact: [584, 326] as [number, number], guest: [654, 361] as [number, number] },
  legs: { label: '压腿／仰卧', contact: [665, 345] as [number, number], guest: [654, 363] as [number, number] },
  feet: { label: '足疗／坐卧', contact: [730, 396] as [number, number], guest: [628, 326] as [number, number] }
} satisfies Record<SceneId, {label: string; contact: [number, number]; guest: [number, number]}>;

export const partNames = ['backHair', 'torso', 'apron', 'head', 'frontHair', 'upperArmL', 'forearmL', 'handL', 'upperArmR', 'forearmR', 'handR', 'watch'] as const;
export const technicianPartUrl = (profile: TechnicianProfile, part: string) => `${profile.animationRoot}/parts/${part}.png`;
export const guestPoseUrl = (profile: GuestProfile, scene: SceneId) => `${profile.poseRoot}/${scene}.png`;
export const guestFaceUrl = (profile: GuestProfile, mood: Mood) => `${profile.expressionRoot}/${mood}.png`;
