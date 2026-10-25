// Small, independent SVG proxy pieces. Replace with approved transparent held/contact art later.
const common = 'stroke="#3b2a23" stroke-width="3" stroke-linejoin="round"';
const shapes = {
  towel: `<path d="M-27 -12 Q0 -20 26 -12 L27 16 Q0 22 -27 16Z" fill="#f7f0df" ${common}/><path d="M-23 3 Q0 -1 23 3" fill="none" stroke="#c5d2cd" stroke-width="3"/>`,
  oil: `<rect x="-13" y="-18" width="26" height="37" rx="6" fill="#9d612e" ${common}/><rect x="-9" y="-10" width="18" height="19" fill="#ebce84"/><rect x="-6" y="-24" width="12" height="7" rx="2" fill="#3b2a23"/>`,
  massage_cream: `<ellipse cy="13" rx="21" ry="8" fill="#2c2525" ${common}/><path d="M-20 -7 L20 -7 L17 13 Q0 20 -17 13Z" fill="#6f5363" ${common}/><ellipse cy="-8" rx="22" ry="8" fill="#f5e7d5" ${common}/><path d="M-10 -11 Q0 -23 10 -11" fill="none" stroke="#fff9ec" stroke-width="6"/>`,
  cake: `<ellipse cy="14" rx="31" ry="8" fill="#ece3ce" ${common}/><path d="M-21 8 L-13 -14 L17 -12 L25 8Z" fill="#f7e0bb" ${common}/><path d="M-13 -14 Q0 -23 17 -12" fill="none" stroke="#fff9ea" stroke-width="8"/><circle cx="5" cy="-18" r="6" fill="#d8515c"/>`,
  basin: `<path d="M-31 -2 Q-24 23 0 24 Q24 23 31 -2Z" fill="#865833" ${common}/><ellipse cy="-3" rx="31" ry="11" fill="#8ac1ce" ${common}/><path d="M-20 -5 Q0 -10 21 -4" fill="none" stroke="#d8f5ed" stroke-width="3"/>`,
  hot_stone: `<ellipse cx="-10" cy="3" rx="17" ry="12" fill="#555559" ${common}/><ellipse cx="14" cy="-2" rx="16" ry="12" fill="#69696a" ${common}/><path d="M-18 -2 Q-10 -7 -3 -2 M9 -8 Q15 -11 20 -7" stroke="#eea166" fill="none" stroke-width="2"/>`,
  guasha: `<path d="M-26 13 Q-28 -5 -8 -17 Q10 -23 27 -8 Q28 8 10 17 Q-8 22 -26 13Z" fill="#9fb6a0" ${common}/><path d="M-18 6 Q0 -4 19 -2" fill="none" stroke="#dfeadd" stroke-width="3"/>`,
  hammer: `<path d="M-5 -25 L5 -25 L6 23 L-5 23Z" fill="#a16e45" ${common}/><rect x="-23" y="-29" width="46" height="15" rx="7" fill="#5c6c6d" ${common}/>`,
  salt: `<rect x="-15" y="-17" width="30" height="36" rx="4" fill="#e5d0ca" ${common}/><rect x="-16" y="-23" width="32" height="9" rx="3" fill="#8a6d80" ${common}/><circle cy="4" r="8" fill="#fff4eb"/>`,
  scrub: `<path d="M-26 2 Q-24 -14 -8 -16 Q13 -19 27 -3 Q29 14 9 17 Q-11 21 -25 11Z" fill="#756f67" ${common}/><g fill="#a9a196"><circle cx="-13" cy="-4" r="2"/><circle cx="5" cy="-8" r="2"/><circle cx="13" cy="6" r="2"/><circle cx="-6" cy="9" r="2"/></g>`,
  footcare: `<path d="M-7 -24 L8 -24 L12 11 L-11 11Z" fill="#92bdc4" ${common}/><rect x="-19" y="8" width="38" height="13" rx="6" fill="#e1cc99" ${common}/><circle cx="0" cy="-10" r="4" fill="#f7ebd7"/>`,
  milk_tea: `<path d="M-18 -16 L18 -16 L13 20 L-13 20Z" fill="#ba8a64" ${common}/><path d="M-15 -13 L15 -13" stroke="#f2e5d0" stroke-width="4"/><path d="M4 -16 L9 -29" stroke="#744d58" stroke-width="4"/><g fill="#46302c"><circle cx="-7" cy="12" r="3"/><circle cx="2" cy="14" r="3"/><circle cx="8" cy="9" r="3"/></g>`,
  hotpot: `<path d="M-25 -2 Q-22 21 0 21 Q22 21 25 -2Z" fill="#ab5140" ${common}/><ellipse cy="-4" rx="26" ry="8" fill="#eaa459" ${common}/><path d="M-12 -13 Q-20 -23 -9 -27 M8 -13 Q16 -22 6 -28" fill="none" stroke="#f3ddaf" stroke-width="3"/>`,
  healthy_meal: `<path d="M-26 -10 L26 -10 L23 20 L-23 20Z" fill="#dfcf9f" ${common}/><path d="M-27 -12 Q0 -26 27 -12" fill="#ecdcb4" ${common}/><path d="M-10 2 Q-20 -8 -7 -8 Q0 -1 -10 2 M8 3 Q0 -8 13 -7 Q19 0 8 3" fill="#66a566"/>`,
  slipper: `<path d="M-27 13 Q-25 -10 -1 -16 Q16 -16 26 -2 L24 15 Q0 21 -27 13Z" fill="#9d7559" ${common}/><path d="M-18 1 Q0 -7 15 0" fill="none" stroke="#e5c8a7" stroke-width="7"/>`,
  glow_slipper: `<path d="M-27 13 Q-25 -10 -1 -16 Q16 -16 26 -2 L24 15 Q0 21 -27 13Z" fill="#a7785d" stroke="#f9d961" stroke-width="6"/><path d="M-18 1 Q0 -7 15 0" fill="none" stroke="#ffe9a2" stroke-width="7"/>`,
  durian: `<path d="M-27 8 L-22 -3 L-26 -11 L-15 -9 L-9 -19 L-2 -11 L6 -21 L10 -10 L22 -12 L20 -3 L29 4 L18 9 L20 19 L7 15 L0 22 L-7 14 L-21 17Z" fill="#8eaa58" ${common}/><path d="M-13 4 Q0 -3 16 5" fill="none" stroke="#e6c975" stroke-width="6"/>`,
  spatula: `<path d="M-3 -3 L4 -3 L7 23 L-5 23Z" fill="#aa744d" ${common}/><path d="M-20 -23 Q0 -30 20 -23 L18 -8 Q0 0 -17 -8Z" fill="#9ca3a4" ${common}/>`,
  banana: `<path d="M-22 -19 Q-6 0 6 15 Q17 3 22 -18 Q25 8 7 23 Q-9 15 -22 -19Z" fill="#f5cb52" ${common}/><path d="M6 15 Q0 0 1 -13" fill="none" stroke="#fff0a5" stroke-width="3"/>`,
  feather: `<path d="M-3 22 Q-23 0 -15 -21 Q0 -28 12 -16 Q23 0 -3 22Z" fill="#f7eed5" ${common}/><path d="M-3 22 Q1 -3 11 -16 M-8 5 L4 0 M-10 -6 L7 -7" fill="none" stroke="#ba9c86" stroke-width="2"/>`
};
export function heldItemSvg(id, hand, rotation = 0) {
  const shape = shapes[id];
  return shape ? `<g transform="translate(${hand.x.toFixed(1)} ${hand.y.toFixed(1)}) rotate(${rotation.toFixed(1)})">${shape}</g>` : '';
}
export function itemEffectSvg(id, target, time, contact) {
  if (!contact || !shapes[id]) return '';
  const radius = 19 + Math.sin(time * 10) * 3;
  const accent = ['oil','salt','basin'].includes(id) ? '#a7d9da' : ['durian','spatula','banana','slipper','glow_slipper','feather'].includes(id) ? '#f07660' : '#ffd77c';
  return `<g pointer-events="none"><circle cx="${target.x}" cy="${target.y}" r="${radius}" fill="none" stroke="${accent}" stroke-width="4" opacity=".85"/><circle cx="${target.x+29}" cy="${target.y-19}" r="4" fill="${accent}"/></g>`;
}
