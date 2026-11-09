import { MOODS, BLOBS, body } from '../src/moods.js';

export const W = 390, H = 844;
const u = Math.min(W, H * 0.462);
export const G = { u, cx: -0.2816 * u, cy: H * 0.32, R: 0.5777 * u, off: 0.065 * u, fs: u * 0.17 };
const STEP = Math.PI / 6;
const f = (v) => v.toFixed(2);
export const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const day = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
export const md = (dt) => `${String(dt.getUTCMonth() + 1).padStart(2, '0')}.${String(dt.getUTCDate()).padStart(2, '0')}`;
export const wd = (dt) => WD[dt.getUTCDay()];
export const addDays = (dt, n) => new Date(dt.getTime() + n * 864e5);
export const moodOf = (id) => MOODS.find((m) => m.id === id);

export const sprite = `<svg width="0" height="0" style="position:absolute"><defs>${MOODS.map(
  (m) => `<symbol id="m-${m.id}" viewBox="0 0 100 100" overflow="visible">${body(m)}</symbol>`).join('')}</defs></svg>`;
export const face = (id, s) => `<svg class="face" width="${s}" height="${s}" viewBox="0 0 100 100"><use href="#m-${id}"/></svg>`;

export function dial(total, n) {
  const { cx, cy, R, off, fs } = G;
  const lim = (62 * Math.PI) / 180;
  const ax = cx + R * Math.cos(lim), ay1 = cy - R * Math.sin(lim), ay2 = cy + R * Math.sin(lim);
  let ticks = '';
  for (let i = -10; i <= 10; i++) {
    const th = (i * 6 * Math.PI) / 180, len = i % 5 === 0 ? 14 : 6;
    ticks += `<line class="tk${i % 5 === 0 ? ' M' : ''}" x1="${f(cx + R * Math.cos(th))}" y1="${f(cy + R * Math.sin(th))}" x2="${f(cx + (R - len) * Math.cos(th))}" y2="${f(cy + (R - len) * Math.sin(th))}"/>`;
  }
  const svg = `<svg id="arc" width="${W}" height="${H}"><defs><linearGradient id="mg" gradientUnits="userSpaceOnUse" x1="0" y1="${f(ay1)}" x2="0" y2="${f(ay2)}"><stop offset="0" stop-color="#000"/><stop offset=".22" stop-color="#fff"/><stop offset=".78" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="fm" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#mg)"/></mask></defs><g mask="url(#fm)"><path d="M${f(ax)} ${f(ay1)}A${f(R)} ${f(R)} 0 0 1 ${f(ax)} ${f(ay2)}" fill="none" stroke="#bdbcb8" stroke-width="1.3"/>${ticks}</g><circle cx="${f(cx + R)}" cy="${f(cy)}" r="4" fill="#1b1c1c"/></svg>`;
  const digits = String(total).length;
  let nums = '';
  for (let d = -1; d <= 1; d++) {
    const v = n + d;
    if (v < 0 || v > total) continue;
    const th = d * STEP, ad = Math.abs(d), t = Math.min(ad, 1);
    const x = cx + (R + off) * Math.cos(th), y = cy + (R + off) * Math.sin(th);
    const col = ad === 0 ? '#3a3a38' : '#bdbcb8', op = ad > 1.75 ? 1 - (ad - 1.75) : 1;
    nums += `<span class="num" style="font-size:${f(fs)}px;color:${col};opacity:${f(op)};transform:translate(${f(x)}px,${f(y)}px) rotate(${f(th)}rad) scale(${f(1 - 0.5 * t)}) translateY(-52%)">${String(v).padStart(digits, '0')}</span>`;
  }
  const lx = cx + R + off + digits * 0.6 * fs + u * 0.05;
  return { svg, nums, lx };
}

export function gridFor(N, box = { x: 22, y: 560, w: 346, h: 250 }) {
  let best = null;
  for (let c = 4; c <= 24; c++) {
    const r = Math.ceil(N / c), s = Math.min(box.w / c, box.h / r);
    if (!best || s > best.s) best = { c, r, s };
  }
  const x0 = box.x + (box.w - best.c * best.s) / 2;
  return { ...best, x0, y0: box.y };
}

export function dots(cells) {
  const g = gridFor(cells.length), s = g.s;
  let out = '';
  cells.forEach((c, i) => {
    const cx = g.x0 + (i % g.c) * s + s / 2, cy = g.y0 + Math.floor(i / g.c) * s + s / 2;
    if (c.k === 'mood') {
      const z = s >= 30 ? s * 0.74 : s * 0.62;
      out += s >= 30
        ? `<svg x="${f(cx - z / 2)}" y="${f(cy - z / 2)}" width="${f(z)}" height="${f(z)}" viewBox="0 0 100 100"><use href="#m-${c.id}"/></svg>`
        : `<svg x="${f(cx - z / 2)}" y="${f(cy - z / 2)}" width="${f(z)}" height="${f(z)}" viewBox="0 0 100 100"><path d="${BLOBS[moodOf(c.id).blob]}" fill="${moodOf(c.id).color}"/></svg>`;
    } else if (c.k === 'skip') out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.2)}" fill="none" stroke="#cfcdc7" stroke-width="1.5"/>`;
    else if (c.k === 'future') out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(Math.max(1.8, s * 0.07))}" fill="#d3d0c9"/>`;
    else if (c.k === 'goal') out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.24)}" fill="#1b1c1c"/>`;
    else if (c.k === 'today') {
      const z = s * 0.7;
      out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.46)}" fill="none" stroke="#1b1c1c" stroke-width="1.6"${c.id ? '' : ' stroke-dasharray="3 3"'}/>`;
      if (c.id) out += s >= 30
        ? `<svg x="${f(cx - z / 2)}" y="${f(cy - z / 2)}" width="${f(z)}" height="${f(z)}" viewBox="0 0 100 100"><use href="#m-${c.id}"/></svg>`
        : `<svg x="${f(cx - z / 2)}" y="${f(cy - z / 2)}" width="${f(z)}" height="${f(z)}" viewBox="0 0 100 100"><path d="${BLOBS[moodOf(c.id).blob]}" fill="${moodOf(c.id).color}"/></svg>`;
      else out += `<path d="M${f(cx - 5)} ${f(cy)}h10M${f(cx)} ${f(cy - 5)}v10" stroke="#1b1c1c" stroke-width="1.6" stroke-linecap="round"/>`;
    }
  });
  return `<svg id="grid" width="${W}" height="${H}">${out}</svg>`;
}

export const shell = (inner) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="mock.css"></head><body>${sprite}<div id="stage">${inner}</div></body></html>`;
