import { solveTwoBoneIK } from '../animation-prototype/dist/core.js';
import { sceneZones } from './interaction.js';
import { heldItemSvg, itemEffectSvg } from './item-art.js';

const art = {
  back: '../art/concepts/S1_开背_空场景概念.png',
  legs: '../art/concepts/S2_压腿_空场景概念.png',
  feet: '../art/concepts/S3_足疗_空场景概念.png'
};
const specs = {
  charming_m: { name: '阿烈', shirt: '#302125', accent: '#9d2737', skin: '#d79572', hair: '#291b1d', width: 42, head: 34, upper: 68, lower: 63, hand: 13, rest: 'cocky' },
  aunt: { name: '芬姨', shirt: '#e2b187', accent: '#497f56', skin: '#dea47f', hair: '#493025', width: 65, head: 37, upper: 62, lower: 56, hand: 14, rest: 'warm' },
  bao_master: { name: '包师傅', shirt: '#e6ded1', accent: '#bb913f', skin: '#c4835d', hair: '#27231f', width: 67, head: 38, upper: 83, lower: 76, hand: 18, rest: 'heavy' }
};
const baseX = { back: 446, legs: 458, feet: 450 };
const svgNs = 'http://www.w3.org/2000/svg';
const q = (svg, selector) => svg.querySelector(selector);
const set = (element, attrs) => { for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value)); };
const p = (n) => Math.round(n * 10) / 10;

function hairMarkup(id) {
  if (id === 'charming_m') return `<path d="M-37 -215 Q-52 -243 -32 -256 L-39 -270 L-21 -264 Q-8 -284 2 -271 L13 -282 L16 -267 Q35 -275 42 -253 L51 -247 L38 -236 Q43 -220 31 -217 Q11 -244 -4 -234 Q-22 -231 -37 -215Z" fill="#24191c" stroke="#211619" stroke-width="5"/><path d="M-32 -242 Q-18 -257 -11 -244 M5 -263 Q14 -249 23 -251 M34 -243 L39 -224" stroke="#8b2938" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if (id === 'aunt') return `<g fill="#493025" stroke="#30211f" stroke-width="4"><circle cx="-30" cy="-240" r="15"/><circle cx="-14" cy="-259" r="16"/><circle cx="5" cy="-263" r="16"/><circle cx="26" cy="-249" r="17"/><circle cx="35" cy="-229" r="14"/></g><path d="M-29 -262 Q2 -279 31 -258" stroke="#e9b582" stroke-width="8" fill="none"/>`;
  return `<path d="M-40 -242 Q-35 -268 -13 -265 L-1 -273 L11 -264 Q36 -268 41 -240 Q17 -252 2 -244 Q-18 -252 -40 -242Z" fill="#26231f" stroke="#211b1b" stroke-width="5"/><path d="M-21 -264 L-22 -249 M3 -270 L6 -247 M24 -262 L26 -247" stroke="#594037" stroke-width="4"/>`;
}
function costumeMarkup(id, s) {
  if (id === 'charming_m') return `<path d="M-${s.width} -167 Q-14 -188 0 -177 Q21 -190 ${s.width} -166 L${s.width + 9} -53 Q0 -35 -${s.width + 5} -53Z" fill="${s.shirt}" stroke="#261b1d" stroke-width="7"/><path d="M-21 -173 L2 -113 L20 -172 L-1 -152Z" fill="#b87861" stroke="#271d20" stroke-width="4"/><path d="M-28 -169 L-1 -124 L-19 -136 L-45 -166Z M27 -168 L4 -123 L24 -137 L43 -164Z" fill="${s.accent}" stroke="#1c171b" stroke-width="3"/><path d="M-51 -87 Q0 -72 52 -86 L44 -66 Q0 -57 -46 -67Z" fill="#742a34" stroke="#24191d" stroke-width="4"/><path d="M-31 -81 Q-48 -50 -61 -42 M-27 -79 Q-16 -53 -9 -44" stroke="#a83544" stroke-width="9" stroke-linecap="round"/>`;
  if (id === 'aunt') return `<path d="M-59 -167 Q0 -185 61 -165 Q79 -116 66 -52 Q0 -28 -68 -51 Q-79 -115 -59 -167Z" fill="${s.shirt}" stroke="#2e2220" stroke-width="7"/><path d="M-41 -158 Q-52 -120 -50 -54 Q0 -26 54 -57 Q54 -122 39 -159Z" fill="#4f8658" stroke="#2d3830" stroke-width="5"/><path d="M-40 -156 Q0 -130 40 -155 M-49 -90 Q0 -80 52 -88" stroke="#f0d6aa" stroke-width="7" fill="none"/><g fill="#f0ddad"><circle cx="-23" cy="-111" r="5"/><circle cx="8" cy="-95" r="6"/><circle cx="27" cy="-124" r="5"/><circle cx="-5" cy="-65" r="5"/></g><g fill="#edb36e"><circle cx="-23" cy="-111" r="2"/><circle cx="8" cy="-95" r="2"/><circle cx="27" cy="-124" r="2"/></g>`;
  return `<path d="M-63 -168 Q0 -188 65 -168 Q84 -116 70 -51 Q0 -26 -72 -49 Q-87 -112 -63 -168Z" fill="${s.shirt}" stroke="#302621" stroke-width="7"/><path d="M-25 -169 L-2 -146 L22 -170 M-1 -146 L-1 -73" fill="none" stroke="#917f70" stroke-width="4"/><path d="M-67 -64 Q0 -49 71 -64 L63 -49 Q0 -37 -64 -49Z" fill="#2b2929" stroke="#221e1d" stroke-width="4"/><path d="M-35 -61 Q-45 -27 -40 -15 Q-19 -13 -17 -49 M-24 -59 Q-23 -37 -8 -29" stroke="#f3ede2" stroke-width="13" fill="none" stroke-linecap="round"/>`;
}
function actorMarkup(id) {
  const s = specs[id];
  return `<g id="actor" filter="url(#actorShadow)"><g id="actorLegs"><path d="M-33 -58 Q-45 -27 -42 0 L-8 0 L-1 -52 M8 -52 Q14 -25 18 0 L52 0 Q50 -36 40 -61" fill="${id === 'aunt' ? '#a65736' : '#26272c'}" stroke="#242023" stroke-width="7"/><path d="M-45 0 L-5 0 M15 0 L55 0" stroke="#221b1a" stroke-width="12" stroke-linecap="round"/></g><g id="armBack"></g><g id="actorBody">${costumeMarkup(id, s)}</g><g id="actorHead"><path d="M-27 -239 Q-39 -225 -33 -198 Q-20 -174 0 -171 Q28 -171 37 -202 Q40 -228 28 -242 Q0 -256 -27 -239Z" fill="${s.skin}" stroke="#2a1e1c" stroke-width="6"/><path d="M-19 -214 Q-13 -219 -6 -214 M12 -214 Q21 -220 26 -214" stroke="#34231e" stroke-width="4" fill="none" stroke-linecap="round"/><path id="actorMouth" d="M-8 -189 Q2 -184 13 -191" fill="none" stroke="#78392f" stroke-width="4" stroke-linecap="round"/>${hairMarkup(id)}${id === 'charming_m' ? '<circle cx="-38" cy="-204" r="5" fill="#d6d8da" stroke="#2b2525" stroke-width="2"/>' : ''}${id === 'bao_master' ? '<path d="M-19 -189 Q0 -177 20 -190" fill="none" stroke="#664338" stroke-width="5" stroke-linecap="round"/>' : ''}</g><g id="armFront"></g><g id="toolLayer"></g><g id="goldLayer"></g><rect x="-35" y="-142" width="67" height="17" rx="3" fill="#e6d1a9" stroke="#302322" stroke-width="2"/><text x="-1" y="-129" text-anchor="middle" font-size="11" font-weight="700" fill="#2c2220">${s.name}</text></g>`;
}
function guestMarkup(scene) {
  if (scene === 'back') return `<g id="guest" filter="url(#guestShadow)"><g id="guestBody"><path d="M391 337 Q432 285 541 303 Q651 293 747 337 Q770 372 739 404 Q591 430 434 405 Q386 393 391 337Z" fill="url(#skinGrad)" stroke="#43302b" stroke-width="7"/><path d="M570 330 Q670 312 759 334 L770 404 Q672 417 576 401Z" fill="#eee6da" stroke="#725e51" stroke-width="5"/><path id="backSquash" d="M480 328 Q554 312 625 328" fill="none" stroke="#bf8064" stroke-width="3"/></g><g id="guestHead"><path d="M362 322 Q379 289 417 295 Q455 299 462 335 Q459 367 425 377 Q384 383 360 353Z" fill="#e1a079" stroke="#42302a" stroke-width="6"/><g fill="#593c2d" stroke="#352720" stroke-width="3"><circle cx="379" cy="310" r="13"/><circle cx="397" cy="298" r="17"/><circle cx="420" cy="303" r="17"/><circle cx="438" cy="313" r="13"/></g><path id="guestEyes" d="M385 341 Q392 336 398 340 M424 339 Q431 335 437 339" fill="none" stroke="#463029" stroke-width="3"/><path id="guestMouth" d="M401 354 Q414 363 427 353" fill="none" stroke="#b64c4b" stroke-width="4" stroke-linecap="round"/></g><g id="guestFoot"></g></g>`;
  if (scene === 'legs') return `<g id="guest" filter="url(#guestShadow)"><g id="guestBody"><path d="M389 295 Q420 259 473 272 Q522 268 555 304 L666 328 Q691 348 674 368 Q558 381 459 360 Q410 357 389 325Z" fill="url(#skinGrad)" stroke="#43302b" stroke-width="7"/><path d="M470 320 Q536 295 599 321 L591 362 Q532 369 475 353Z" fill="#f0e8db" stroke="#725e51" stroke-width="5"/></g><g id="guestHead"><path d="M357 277 Q389 250 429 269 Q455 292 444 324 Q425 347 394 339 Q365 331 357 304Z" fill="#e1a079" stroke="#42302a" stroke-width="6"/><g fill="#593c2d" stroke="#352720" stroke-width="3"><circle cx="371" cy="274" r="12"/><circle cx="389" cy="263" r="15"/><circle cx="410" cy="263" r="16"/><circle cx="430" cy="275" r="13"/></g><path id="guestEyes" d="M380 302 Q386 299 391 302 M410 301 Q417 298 422 301" fill="none" stroke="#463029" stroke-width="3"/><path id="guestMouth" d="M393 319 Q406 325 417 317" fill="none" stroke="#b64c4b" stroke-width="4"/></g><g id="guestFoot"><path d="M573 328 Q635 311 694 337 Q718 344 718 359 Q712 373 692 372 L576 363Z" fill="#dfa17e" stroke="#493029" stroke-width="6"/></g></g>`;
  return `<g id="guest" filter="url(#guestShadow)"><g id="guestBody"><path d="M464 234 Q516 196 577 227 Q608 249 600 310 L574 346 Q490 350 459 304Z" fill="#f2ece1" stroke="#66524a" stroke-width="7"/><path d="M469 296 Q540 275 593 305 L582 337 Q506 349 472 325Z" fill="#897286" stroke="#5f4b59" stroke-width="5"/></g><g id="guestHead"><path d="M465 201 Q490 172 527 185 Q552 207 543 239 Q531 263 505 260 Q475 254 463 232Z" fill="#e1a079" stroke="#42302a" stroke-width="6"/><g fill="#593c2d" stroke="#352720" stroke-width="3"><circle cx="475" cy="196" r="12"/><circle cx="494" cy="184" r="15"/><circle cx="515" cy="184" r="16"/><circle cx="536" cy="199" r="12"/></g><path id="guestEyes" d="M481 222 Q487 218 493 222 M512 221 Q519 217 525 221" fill="none" stroke="#463029" stroke-width="3"/><path id="guestMouth" d="M496 240 Q508 246 519 238" fill="none" stroke="#b64c4b" stroke-width="4"/></g><g id="guestFoot"><path d="M551 327 Q581 309 613 326 L657 374 Q672 389 659 405 Q647 414 629 407 L568 375Z" fill="#dfa17e" stroke="#493029" stroke-width="6"/><path d="M603 362 Q633 361 648 380" fill="none" stroke="#c78467" stroke-width="3"/></g></g>`;
}
function armSvg(a, e, h, color, shirt, handSize, cuff = false) {
  const upper = `M${p(a.x)} ${p(a.y)} Q${p(e.x - 5)} ${p(e.y - 9)} ${p(e.x)} ${p(e.y)}`;
  const lower = `M${p(e.x)} ${p(e.y)} Q${p((e.x + h.x) / 2 + 4)} ${p((e.y + h.y) / 2 - 4)} ${p(h.x)} ${p(h.y)}`;
  return `<path d="${upper}" stroke="#312522" stroke-width="38" stroke-linecap="round" fill="none"/><path d="${upper}" stroke="${shirt}" stroke-width="31" stroke-linecap="round" fill="none"/><path d="${lower}" stroke="#312522" stroke-width="29" stroke-linecap="round" fill="none"/><path d="${lower}" stroke="${color}" stroke-width="22" stroke-linecap="round" fill="none"/>${cuff ? `<circle cx="${p(e.x)}" cy="${p(e.y)}" r="17" fill="${shirt}" stroke="#2d2321" stroke-width="4"/>` : ''}<path d="M${p(h.x - handSize)} ${p(h.y - handSize * .36)} Q${p(h.x - handSize * .5)} ${p(h.y - handSize * 1.13)} ${p(h.x + handSize * .55)} ${p(h.y - handSize * .75)} Q${p(h.x + handSize * 1.1)} ${p(h.y + handSize * .1)} ${p(h.x + handSize * .35)} ${p(h.y + handSize * .7)} Q${p(h.x - handSize * .7)} ${p(h.y + handSize * .9)} ${p(h.x - handSize)} ${p(h.y - handSize * .36)}Z" fill="${color}" stroke="#32221e" stroke-width="4"/><path d="M${p(h.x - handSize * .5)} ${p(h.y - handSize * .4)} Q${p(h.x)} ${p(h.y - handSize * .72)} ${p(h.x + handSize * .45)} ${p(h.y - handSize * .3)}" stroke="#f4c6a3" stroke-width="3" fill="none"/>`;
}

export class VisualStage {
  constructor(svg) { this.svg = svg; this.scene = null; this.technicianId = null; }
  setCast(technicianId, scene) {
    this.scene = scene; this.technicianId = technicianId;
    this.svg.innerHTML = `<defs><linearGradient id="skinGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f2bc97"/><stop offset="1" stop-color="#d99371"/></linearGradient><filter id="actorShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-opacity=".34"/></filter><filter id="guestShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity=".35"/></filter><radialGradient id="goldGrad"><stop offset="0" stop-color="#fff9c2" stop-opacity=".9"/><stop offset=".4" stop-color="#f9c558" stop-opacity=".7"/><stop offset="1" stop-color="#f19b32" stop-opacity="0"/></radialGradient></defs><image href="${art[scene]}" x="0" y="0" width="960" height="540" preserveAspectRatio="xMidYMid slice"/><rect x="0" y="0" width="960" height="540" fill="#251910" opacity=".12"/>${guestMarkup(scene)}${actorMarkup(technicianId)}<ellipse id="hotspot" cx="${sceneZones[scene].center.x}" cy="${sceneZones[scene].center.y}" rx="${sceneZones[scene].rx}" ry="${sceneZones[scene].ry}" fill="#ffc77a" fill-opacity=".08" stroke="#fff1c4" stroke-width="2" stroke-dasharray="7 6"/><circle id="pointerMark" r="8" fill="#ffe6a1" stroke="#704331" stroke-width="2" opacity="0"/><circle id="contactRing" r="14" fill="none" stroke="#ffe093" stroke-width="5" opacity="0"/><rect x="12" y="12" width="185" height="35" rx="8" fill="#2b1e1b" opacity=".8"/><text id="stageLabel" x="25" y="36" fill="#fce6be" font-size="18" font-weight="700"></text>`;
    this.parts = { actor: q(this.svg, '#actor'), actorLegs: q(this.svg, '#actorLegs'), actorBody: q(this.svg, '#actorBody'), actorHead: q(this.svg, '#actorHead'), actorMouth: q(this.svg, '#actorMouth'), armBack: q(this.svg, '#armBack'), armFront: q(this.svg, '#armFront'), toolLayer: q(this.svg, '#toolLayer'), goldLayer: q(this.svg, '#goldLayer'), guestBody: q(this.svg, '#guestBody'), guestHead: q(this.svg, '#guestHead'), guestFoot: q(this.svg, '#guestFoot'), guestMouth: q(this.svg, '#guestMouth'), guestEyes: q(this.svg, '#guestEyes'), hotspot: q(this.svg, '#hotspot'), pointerMark: q(this.svg, '#pointerMark'), contactRing: q(this.svg, '#contactRing'), stageLabel: q(this.svg, '#stageLabel') };
    this.parts.stageLabel.textContent = `${specs[technicianId].name} · ${sceneZones[scene].label}`;
  }
  render(frame, time) {
    const s = specs[this.technicianId], z = sceneZones[this.scene], b = baseX[this.scene];
    const y = 450, shoulderY = -158;
    const reachNeeded = Math.hypot(frame.target.x - (b + s.width * .78), frame.target.y - (y + shoulderY));
    const shift = Math.max(0, Math.min(180, reachNeeded - (s.upper + s.lower - 10))) * frame.reach;
    const rootX = b + shift - (frame.approach || 0) * (this.technicianId === 'charming_m' ? 105 : this.technicianId === 'aunt' ? 75 : 63);
    const lean = frame.reach * (12 + frame.pressure * 9);
    const gait = (frame.approach || 0) > 0 ? Math.sin(time * (this.technicianId === 'charming_m' ? 17 : this.technicianId === 'aunt' ? 12 : 9)) : 0;
    const idleBob = frame.phase === 'observe' ? Math.sin(time * 1.7) * 2.5 : gait * (this.technicianId === 'aunt' ? 3 : 5);
    set(this.parts.actor, { transform: `translate(${p(rootX)} ${p(y + idleBob)})` });
    set(this.parts.actorLegs, { transform: `translate(${p(gait * 7)} 0) rotate(${p(gait * 3)} 0 -50)` });
    set(this.parts.actorBody, { transform: `translate(${p(lean * .45)} ${p(frame.pressure * 5)}) rotate(${p(frame.reach * 3)} 0 -80)` });
    set(this.parts.actorHead, { transform: `translate(${p(lean * .43)} ${p(frame.pressure * 5 - frame.reach * 4)}) rotate(${p(frame.reach * -4 + (frame.approach || 0) * (this.technicianId === 'aunt' ? 5 : -5))} 0 -205)` });
    const baseRight = { x: s.width * .78 + lean * .6, y: shoulderY + frame.pressure * 5 };
    const baseLeft = { x: -s.width * .78 + lean * .33, y: shoulderY + frame.pressure * 5 };
    const target = { x: frame.target.x - rootX, y: frame.target.y - y + frame.pressure * 4 };
    const idleRight = { x: s.width + 30, y: -75 };
    const idleLeft = { x: -s.width - 21, y: -79 };
    const toolTake = frame.phase === 'toolTake';
    const isOffer = frame.signature && this.technicianId === 'aunt';
    const isKiss = frame.signature && this.technicianId === 'charming_m';
    const rightDest = isKiss ? { x: 54, y: -226 } : isOffer ? { x: 150, y: -167 } : toolTake ? { x: -35, y: -35 } : target;
    const leftDest = isKiss ? { x: 12, y: -197 } : isOffer ? { x: 65, y: -106 } : this.scene === 'feet' ? { x: target.x - 49, y: target.y + 10 } : { x: target.x - 25, y: target.y + 3 };
    const ratio = toolTake ? Math.min(1, frame.phaseProgress) : frame.reach;
    const handR = { x: idleRight.x + (rightDest.x - idleRight.x) * ratio, y: idleRight.y + (rightDest.y - idleRight.y) * ratio };
    const handL = { x: idleLeft.x + (leftDest.x - idleLeft.x) * ratio, y: idleLeft.y + (leftDest.y - idleLeft.y) * ratio };
    const right = solveTwoBoneIK(baseRight, handR, s.upper, s.lower, 1);
    const left = solveTwoBoneIK(baseLeft, handL, s.upper, s.lower, -1);
    this.parts.armBack.innerHTML = armSvg(left.shoulder, left.elbow, left.hand, s.skin, s.shirt, s.hand * .9, true);
    this.parts.armFront.innerHTML = armSvg(right.shoulder, right.elbow, right.hand, s.skin, s.shirt, s.hand, true);
    let tool = '';
    if (frame.toolHeld || toolTake || isOffer) {
      const hand = isOffer ? left.hand : right.hand;
      tool = frame.tool === 'hand' && isOffer ? heldItemSvg('cake', hand) : heldItemSvg(frame.tool, hand, frame.contactActive && frame.tool === 'oil' ? -28 : 0);
    }
    this.parts.toolLayer.innerHTML = tool;
    const gold = frame.gold;
    this.parts.goldLayer.innerHTML = gold > .01 ? `<circle cx="${p(right.hand.x)}" cy="${p(right.hand.y)}" r="${p(29 + gold * 23)}" fill="url(#goldGrad)" opacity="${p(.6 + .35 * gold)}"/><circle cx="${p(right.hand.x)}" cy="${p(right.hand.y)}" r="${p(18 + gold * 7)}" fill="none" stroke="#ffd975" stroke-width="3" opacity="${p(gold)}"/>` : '';
    if (this.technicianId === 'bao_master' && frame.watchOn) this.parts.toolLayer.innerHTML += `<rect x="${p(right.elbow.x + (right.hand.x - right.elbow.x) * .3 - 7)}" y="${p(right.elbow.y + (right.hand.y - right.elbow.y) * .3 - 5)}" width="14" height="10" rx="3" fill="#302b2a" stroke="#e6c878" stroke-width="2"/>`;
    const actorMood = frame.phase === 'interrupted' ? 'shocked' : frame.signature ? 'confident' : frame.contactActive ? 'focused' : 'idle';
    set(this.parts.actorMouth, { d: actorMood === 'shocked' ? 'M-4 -191 Q3 -204 11 -191' : actorMood === 'confident' ? 'M-8 -192 Q5 -179 16 -195' : actorMood === 'focused' ? 'M-6 -187 L10 -188' : 'M-8 -189 Q2 -184 13 -191' });
    // Guest head, body and foot move independently; the entire guest image never follows the pointer.
    const response = frame.contactActive ? Math.min(1, frame.pressure) : 0;
    const recoil = frame.guestRecoil;
    set(this.parts.guestBody, { transform: `translate(0 ${p(response * 3 - recoil * 5)}) scale(1 ${p(1 - response * .022 + recoil * .015)})` });
    set(this.parts.guestHead, { transform: `translate(${p(-recoil * 9)} ${p(-response * 3 - recoil * 5)}) rotate(${p(recoil * -5)} ${this.scene === 'feet' ? 505 : 410} ${this.scene === 'feet' ? 220 : 330})` });
    set(this.parts.guestFoot, { transform: `translate(${p(recoil * -13)} ${p(-response * 7 - recoil * 10)}) rotate(${p(recoil * -7)} 601 380)` });
    const mood = frame.guestMood;
    set(this.parts.guestMouth, { d: mood === 'responding' ? (this.scene === 'feet' ? 'M493 239 Q508 258 523 237' : this.scene === 'legs' ? 'M391 317 Q405 333 421 315' : 'M399 354 Q414 371 430 350') : mood === 'uncomfortable' ? (this.scene === 'feet' ? 'M497 246 Q509 228 522 244' : this.scene === 'legs' ? 'M394 322 Q406 309 419 322' : 'M401 362 Q415 349 427 362') : (this.scene === 'feet' ? 'M496 240 Q508 246 519 238' : this.scene === 'legs' ? 'M393 319 Q406 325 417 317' : 'M401 354 Q414 363 427 353') });
    set(this.parts.hotspot, { cx: frame.zone.center.x, cy: frame.zone.center.y, rx: frame.zone.rx, ry: frame.zone.ry, 'stroke-opacity': frame.phase === 'observe' ? .85 : .25, 'fill-opacity': frame.contactActive ? .03 : .08 });
    set(this.parts.pointerMark, { cx: p(frame.target.x), cy: p(frame.target.y), opacity: frame.phase === 'observe' ? 0 : .82 });
    set(this.parts.contactRing, { cx: p(frame.target.x), cy: p(frame.target.y), opacity: frame.contactActive ? .8 : 0, r: p(15 + response * 9) });
    this.parts.goldLayer.innerHTML += itemEffectSvg(frame.tool, frame.target, time, frame.contactActive);
    return { rightHand: { x: right.hand.x + rootX, y: right.hand.y + y }, target: frame.target, rootX };
  }
}
