import { BLOBS, moodById } from './moods.js';
import { gridFor } from './model.js';

const f = (v) => v.toFixed(2);

function blob(id, x, y, z) {
  const m = moodById(id);
  return `<svg x="${f(x)}" y="${f(y)}" width="${f(z)}" height="${f(z)}" viewBox="0 0 100 100"><path d="${BLOBS[m.blob]}" fill="${m.color}"/></svg>`;
}
const face = (id, x, y, z) =>
  `<svg x="${f(x)}" y="${f(y)}" width="${f(z)}" height="${f(z)}" viewBox="0 0 100 100"><use href="#m-${id}"/></svg>`;

// 在容器里画点阵。onCell(n) 在今天及以前的格子被点时调用；fresh 是刚改过的那一天。
export function renderDots(box, cells, { onCell, fresh } = {}) {
  const W = box.clientWidth, H = box.clientHeight;
  if (!W || !H) return;
  const g = gridFor(cells.length, W, H), s = g.s, big = s >= 30;
  let out = '';
  cells.forEach((c, i) => {
    const cx = g.x0 + (i % g.c) * s + s / 2, cy = g.y0 + Math.floor(i / g.c) * s + s / 2;
    const pic = (id, z) => (big ? face(id, cx - z / 2, cy - z / 2, z) : blob(id, cx - z / 2, cy - z / 2, z));
    const pop = (id, z) => `<g class="${c.n === fresh ? 'pop' : ''}" style="transform-origin:${f(cx)}px ${f(cy)}px">${pic(id, z)}</g>`;
    let cell = '';
    if (c.k === 'mood') cell = pop(c.id, big ? s * 0.74 : s * 0.62);
    else if (c.k === 'skip') cell = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.2)}" fill="none" stroke="#cfcdc7" stroke-width="1.5"/>`;
    else if (c.k === 'future') cell = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(Math.max(1.8, s * 0.07))}" fill="#d3d0c9"/>`;
    else if (c.k === 'goal') cell = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.24)}" fill="#1b1c1c"/>`;
    else if (c.k === 'today') {
      const dash = c.id ? '' : ' stroke-dasharray="3 3"';
      cell = `<g class="today"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.46)}" fill="none" stroke="#1b1c1c" stroke-width="1.6"${dash}/>`;
      if (c.id) cell += pop(c.id, s * 0.7);
      else cell += `<path d="M${f(cx - 5)} ${f(cy)}h10M${f(cx)} ${f(cy - 5)}v10" stroke="#1b1c1c" stroke-width="1.6" stroke-linecap="round"/>`;
      cell += '</g>';
    }
    if (onCell && c.tap) {
      const a = c.k === 'today' ? ' tabindex="0"' : '';
      out += `<g class="hit" data-n="${c.n}" role="button" aria-label="修改这天的心情"${a}>${cell}<rect x="${f(cx - s / 2)}" y="${f(cy - s / 2)}" width="${f(s)}" height="${f(s)}" fill="transparent"/></g>`;
    } else out += cell;
  });
  box.innerHTML = `<svg width="${W}" height="${H}">${out}</svg>`;
  const hit = (e) => {
    const t = e.target.closest && e.target.closest('.hit');
    return t ? +t.dataset.n : null;
  };
  box.onclick = (e) => { const n = hit(e); if (n !== null && onCell) onCell(n); };
  box.onkeydown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const n = hit(e);
    if (n !== null && onCell) { e.preventDefault(); onCell(n); }
  };
}
