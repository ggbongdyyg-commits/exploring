// 9 个心情表情：不规则圆团 + 简笔五官，全部用代码绘制。viewBox 0 0 100 100。
const BLOBS = [
  'M50 6C75 4 95 23 95 49C95 75 77 95 50 94C24 93 5 75 6 50C7 25 26 8 50 6Z',
  'M53 5C78 8 95 27 93 53C91 78 73 96 47 94C22 92 7 73 8 47C10 22 29 3 53 5Z',
  'M48 7C73 4 96 24 94 51C92 77 75 93 50 95C24 97 5 77 7 49C9 25 24 9 48 7Z',
];

const heart = (x, y) =>
  `<path d="M${x} ${y + 5}C${x - 10} ${y - 2} ${x - 4} ${y - 8} ${x} ${y - 3}C${x + 4} ${y - 8} ${x + 10} ${y - 2} ${x} ${y + 5}Z" fill="#1b1c1c" stroke="none"/>`;
const dot = (x, y, r = 3.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1b1c1c" stroke="none"/>`;
const swirl = (x, y) => `<path d="M${x - 1} ${y}a1 1 0 1 0 2 0a3 3 0 1 0-6 0a5 5 0 1 0 10 0"/>`;

export const MOODS = [
  {
    id: 'happy', zh: '开心', color: '#fde07f', blob: 0,
    face: '<path d="M36 40v7M64 40v7"/><path d="M35 57Q50 76 65 57"/>',
  },
  {
    id: 'loving', zh: '喜欢', color: '#ffb3c8', blob: 1,
    face: `${heart(35, 45)}${heart(65, 45)}<path d="M45 63Q50 68 55 63"/>`,
  },
  {
    id: 'surprised', zh: '惊喜', color: '#9fc23f', blob: 2,
    face: `${dot(35, 42)}${dot(65, 42)}<path d="M30 56Q50 52 70 56Q68 80 50 80Q32 80 30 56Z" fill="#1b1c1c"/>` +
      '<path d="M16 23L6 17M27 12L22 2M41 8L40 -2"/>',
  },
  {
    id: 'calm', zh: '平静', color: '#8cbfff', blob: 1,
    face: `${dot(38, 42, 2.6)}${dot(62, 42, 2.6)}<path d="M44 60h12"/>`,
  },
  {
    id: 'tired', zh: '疲惫', color: '#84a9bf', blob: 0,
    face: '<path d="M28 44Q35 51 42 44M58 44Q65 51 72 44"/><circle cx="46" cy="64" r="3.4"/>',
  },
  {
    id: 'worried', zh: '担心', color: '#3f9096', blob: 2,
    face: '<path d="M27 48Q35 38 43 48M57 48Q65 38 73 48"/><path d="M41 68Q50 58 59 68"/>',
  },
  {
    id: 'sad', zh: '难过', color: '#b05a96', blob: 1,
    face: `${dot(35, 44)}${dot(65, 44)}<path d="M41 67Q50 57 59 67"/>`,
  },
  {
    id: 'angry', zh: '生气', color: '#f27a52', blob: 0,
    face: `<path d="M27 34L45 43M73 34L55 43"/>${dot(37, 52)}${dot(63, 52)}` +
      '<path d="M35 70L42 63L50 70L58 63L65 70"/>',
  },
  {
    id: 'confused', zh: '迷茫', color: '#a99ae0', blob: 2,
    face: `${swirl(35, 44)}${swirl(65, 44)}<path d="M38 66q3-4 6 0t6 0t6 0t6 0"/>`,
  },
];

export const moodById = (id) => MOODS.find((m) => m.id === id) || null;

const body = (m) =>
  `<g transform="translate(50 52) scale(.88) translate(-50 -50)"><path d="${BLOBS[m.blob]}" fill="${m.color}" stroke="none"/></g>` +
  `<g fill="none" stroke="#1b1c1c" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${m.face}</g>`;

// 在页面里放一份隐藏精灵，之后用 <use> 复用。
export function installSprite() {
  if (document.getElementById('mood-sprite')) return;
  const el = document.createElement('div');
  el.id = 'mood-sprite';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  el.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><defs>' +
    MOODS.map((m) => `<symbol id="m-${m.id}" viewBox="0 0 100 100" overflow="visible">${body(m)}</symbol>`).join('') +
    '</defs></svg>';
  document.body.appendChild(el);
}

export const moodIcon = (id, cls = 'face') =>
  `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><use href="#m-${id}"/></svg>`;
