import { guestFaceUrl, guestPoseUrl, scenePose, technicianPartUrl, type GuestProfile, type Mood, type SceneId, type TechnicianProfile } from './data.js';
import type { FramePose, GuestFrame, JointPose, Point } from './core.js';

class ImageBank {
  private cache = new Map<string, HTMLImageElement | null>();
  enabled = false;
  get(url: string): HTMLImageElement | null {
    if (!this.enabled) return null;
    if (this.cache.has(url)) {
      const image = this.cache.get(url);
      return image?.complete && image.naturalWidth ? image : null;
    }
    const image = new Image();
    this.cache.set(url, image);
    image.onerror = () => this.cache.set(url, null);
    image.src = url;
    return null;
  }
}

const bank = new ImageBank();
export function setAssetMode(enabled: boolean) { bank.enabled = enabled; }
const ellipse = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke = '#372722') => {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = stroke; ctx.stroke();
};
const line = (ctx: CanvasRenderingContext2D, a: Point, b: Point, width: number, color: string) => {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#342520'; ctx.lineWidth = width + 6;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
};
const part = (ctx: CanvasRenderingContext2D, profile: TechnicianProfile, key: string, x: number, y: number, w: number, h: number, fallback: () => void, rotation = 0) => {
  const img = bank.get(technicianPartUrl(profile, key));
  if (!img) { fallback(); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
};
const drawLimb = (ctx: CanvasRenderingContext2D, profile: TechnicianProfile, key: string, a: Point, b: Point, width: number, color: string) => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  part(ctx, profile, key, (a.x + b.x) / 2, (a.y + b.y) / 2, len + 8, width + 8, () => line(ctx, a, b, width, color), Math.atan2(dy, dx));
};
const drawArm = (ctx: CanvasRenderingContext2D, profile: TechnicianProfile, joints: JointPose, suffix: 'L' | 'R', glow: number) => {
  const w = 19 * profile.body.handScale;
  drawLimb(ctx, profile, `upperArm${suffix}`, joints.shoulder, joints.elbow, w + 4, profile.palette.shirt);
  drawLimb(ctx, profile, `forearm${suffix}`, joints.elbow, joints.hand, w, profile.palette.skin);
  part(ctx, profile, `hand${suffix}`, joints.hand.x, joints.hand.y, 30 * profile.body.handScale, 28 * profile.body.handScale,
    () => ellipse(ctx, joints.hand.x, joints.hand.y, 14 * profile.body.handScale, 12 * profile.body.handScale, glow > 0 ? '#F4C953' : profile.palette.skin));
};

function drawBackground(ctx: CanvasRenderingContext2D, scene: SceneId) {
  const grad = ctx.createLinearGradient(0, 0, 0, 540); grad.addColorStop(0, '#382721'); grad.addColorStop(1, '#755139');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = '#263544'; ctx.fillRect(61, 35, 210, 250);
  ctx.strokeStyle = '#896447'; ctx.lineWidth = 13; ctx.strokeRect(61, 35, 210, 250);
  ctx.beginPath(); ctx.moveTo(165, 35); ctx.lineTo(165, 285); ctx.moveTo(61, 150); ctx.lineTo(271, 150); ctx.stroke();
  for (const x of [41, 910]) { ctx.fillStyle = '#F2B959'; ctx.fillRect(x, 75, 36, 90); ctx.shadowColor = '#F6AF43'; ctx.shadowBlur = 35; ctx.fillRect(x + 7, 84, 22, 72); ctx.shadowBlur = 0; }
  ctx.fillStyle = '#62452E'; ctx.fillRect(0, 445, 960, 95);
  if (scene === 'feet') {
    ctx.fillStyle = '#99734F'; ctx.fillRect(475, 300, 300, 95);
    ellipse(ctx, 733, 431, 138, 43, '#9B663A'); ellipse(ctx, 733, 422, 122, 32, '#77B2BA');
  } else {
    ctx.fillStyle = '#765448'; ctx.fillRect(480, 398, 410, 57);
    ctx.fillStyle = '#F1E5D6'; ctx.fillRect(490, 380, 390, 35);
  }
  ctx.fillStyle = '#A37A54'; ctx.fillRect(338, 411, 110, 34);
  ctx.fillStyle = '#E7D2A7'; ctx.fillRect(348, 398, 90, 16);
}

function drawGuest(ctx: CanvasRenderingContext2D, profile: GuestProfile, scene: SceneId, mood: Mood) {
  const spec = scenePose[scene], [x, y] = spec.guest;
  const { width, height, head, skin, hair, cover } = profile.body;
  const img = bank.get(guestPoseUrl(profile, scene));
  if (img) ctx.drawImage(img, x - width / 2 - 35, y - height / 2 - 50, width + 70, height + 90);
  else {
    if (scene === 'feet') {
      ellipse(ctx, x, y, width * .43, height * .55, cover);
      ellipse(ctx, x - 95, y - 48, head, head, skin);
      ellipse(ctx, 728, 403, 39, 18, skin);
    } else {
      ellipse(ctx, x, y, width * .5, height * .5, skin);
      ctx.fillStyle = cover; ctx.fillRect(x - width * .23, y - 8, width * .72, height * .47);
      ellipse(ctx, x - width * .49, y + 8, head, head * .9, skin);
    }
  }
  const faceX = scene === 'feet' ? x - 94 : x - width * .49, faceY = scene === 'feet' ? y - 48 : y + 8;
  const faceImg = bank.get(guestFaceUrl(profile, mood));
  if (faceImg) ctx.drawImage(faceImg, faceX - head, faceY - head, head * 2, head * 2);
  else {
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(faceX, faceY - head * .34, head * .85, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#36261F'; ctx.fillRect(faceX - 12, faceY - 2, 5, 3); ctx.fillRect(faceX + 7, faceY - 2, 5, 3);
    ctx.strokeStyle = mood === 'angry' || mood === 'refused' ? '#B23E3D' : '#803B3B'; ctx.lineWidth = 3;
    ctx.beginPath(); mood === 'uncomfortable' || mood === 'angry' || mood === 'refused' ? ctx.arc(faceX, faceY + 15, 8, Math.PI, 2 * Math.PI) : ctx.arc(faceX, faceY + 5, 9, 0, Math.PI); ctx.stroke();
  }
}

function drawTechnician(ctx: CanvasRenderingContext2D, profile: TechnicianProfile, pose: FramePose) {
  const { x, y } = pose, b = profile.body;
  ctx.save(); ctx.translate(x, y); ctx.rotate(pose.bodyAngle);
  part(ctx, profile, 'torso', 0, -b.torsoHeight * .55, b.torsoWidth, b.torsoHeight,
    () => ellipse(ctx, 0, -b.torsoHeight * .55, b.torsoWidth / 2, b.torsoHeight / 2, profile.palette.shirt));
  if (profile.id === 'aunt') part(ctx, profile, 'apron', 0, -b.torsoHeight * .45, b.torsoWidth * .7, b.torsoHeight * .75,
    () => ellipse(ctx, 0, -b.torsoHeight * .4, b.torsoWidth * .31, b.torsoHeight * .38, profile.palette.trim));
  part(ctx, profile, 'head', 0, -b.torsoHeight - b.head * .57, b.head * 2, b.head * 2,
    () => ellipse(ctx, 0, -b.torsoHeight - b.head * .57, b.head, b.head, profile.palette.skin));
  part(ctx, profile, 'frontHair', 0, -b.torsoHeight - b.head * 1.19, b.head * 2.15, b.head * .75,
    () => ellipse(ctx, 0, -b.torsoHeight - b.head * 1.17, b.head * .98, b.head * .39, profile.palette.hair));
  ctx.fillStyle = '#30221F'; ctx.fillRect(-12, -b.torsoHeight - b.head * .67, 4, 3); ctx.fillRect(8, -b.torsoHeight - b.head * .67, 4, 3);
  ctx.restore();
  drawArm(ctx, profile, pose.left, 'L', 0);
  drawArm(ctx, profile, pose.right, 'R', pose.goldPower);
  if (pose.watchVisible && profile.id === 'bao_master') {
    ellipse(ctx, pose.right.elbow.x * .25 + pose.right.hand.x * .75, pose.right.elbow.y * .25 + pose.right.hand.y * .75, 8, 7, '#323235');
  }
  if (pose.toolVisible) ellipse(ctx, pose.left.hand.x + 11, pose.left.hand.y - 9, 15, 10, '#F7D59B');
  if (pose.goldPower > 0) {
    ctx.save(); ctx.shadowBlur = 36 * pose.goldPower; ctx.shadowColor = '#FFD04E';
    ellipse(ctx, pose.right.hand.x, pose.right.hand.y, 17 + 17 * pose.goldPower, 16 + 17 * pose.goldPower, `rgba(255,206,63,${.12 + .18 * pose.goldPower})`, 'rgba(255,210,85,.8)'); ctx.restore();
  }
}

export function render(ctx: CanvasRenderingContext2D, profile: TechnicianProfile, guest: GuestProfile, scene: SceneId, pose: FramePose, guestFrame: GuestFrame) {
  ctx.clearRect(0, 0, 960, 540);
  drawBackground(ctx, scene);
  const guestCenter = scenePose[scene].guest;
  ctx.save(); ctx.translate(guestCenter[0] + guestFrame.dx, guestCenter[1] + guestFrame.dy); ctx.rotate(guestFrame.angle); ctx.translate(-guestCenter[0], -guestCenter[1]);
  drawGuest(ctx, guest, scene, guestFrame.mood); ctx.restore();
  drawTechnician(ctx, profile, pose);
  if (pose.contactActive) {
    ctx.beginPath(); ctx.arc(pose.contact.x, pose.contact.y, 26, 0, Math.PI * 2);
    ctx.strokeStyle = profile.id === 'bao_master' ? '#FFD15D' : '#97E7BB'; ctx.lineWidth = 5; ctx.stroke();
  }
  ctx.font = '15px system-ui'; ctx.fillStyle = '#FFE8C3';
  ctx.fillText(`技术占位图形 · ${scenePose[scene].label} · ${profile.name} · ${guest.name}`, 25, 515);
}
