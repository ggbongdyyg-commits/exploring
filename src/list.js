import { sortItems, status } from './model.js';
import { fullText } from './time.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f = (v) => v.toFixed(1);

function miniDial() {
  const cx = -60, cy = 95, R = 130;
  let t = '';
  for (let i = -6; i <= 6; i++) {
    const th = (i * 6 * Math.PI) / 180, M = i % 5 === 0, len = M ? 14 : 6;
    t += `<line x1="${f(cx + R * Math.cos(th))}" y1="${f(cy + R * Math.sin(th))}" x2="${f(cx + (R - len) * Math.cos(th))}" y2="${f(cy + (R - len) * Math.sin(th))}" stroke="${M ? '#3a3a38' : '#9a9894'}" stroke-width="${M ? 1.6 : 1}" stroke-linecap="round" opacity="${(1 - Math.abs(i) / 8).toFixed(2)}"/>`;
  }
  const a = (40 * Math.PI) / 180;
  const arc = `<path d="M${f(cx + R * Math.cos(a))} ${f(cy - R * Math.sin(a))}A${R} ${R} 0 0 1 ${f(cx + R * Math.cos(a))} ${f(cy + R * Math.sin(a))}" fill="none" stroke="#bdbcb8" stroke-width="1.3" opacity=".6"/>`;
  return `<svg class="mini" width="120" height="190" aria-hidden="true">${arc}${t}<circle cx="${f(cx + R)}" cy="${cy}" r="4" fill="#1b1c1c"/></svg>`;
}

function hero(it, today) {
  const s = status(it, today);
  const pct = Math.min(100, Math.round(((s.total - s.left) / s.total) * 100));
  return `<a class="ev hero" href="#/c/${it.id}">${miniDial()}<div class="big">${s.left}</div><div class="meta"><div class="nm">${esc(it.name)}</div><div class="dt">${fullText(s.target)}</div></div><div class="bar"><i style="width:${pct}%"></i></div></a>`;
}

function compact(it, today) {
  const s = status(it, today);
  const cnt = s.ended ? '已结束' : `${s.left}<small>天</small>`;
  return `<a class="ev c${s.ended ? ' end' : ''}" href="#/c/${it.id}"><div class="meta"><div class="nm">${esc(it.name)}</div><div class="dt">${fullText(s.target)}</div></div><div class="cnt">${cnt}</div></a>`;
}

export function renderList(root, { items, today }) {
  const { active, ended } = sortItems(items, today);
  let body;
  if (!items.length) {
    body = '<div class="empty"><div class="ring">+</div><p>还没有倒计时</p><button type="button" class="go" data-add>添加倒计时</button></div>';
  } else {
    body = '';
    if (active.length) body += hero(active[0], today) + active.slice(1).map((it) => compact(it, today)).join('');
    if (ended.length) body += `<div class="sect">已结束</div>${ended.map((it) => compact(it, today)).join('')}`;
  }
  root.innerHTML = `<div class="hatch"></div><div class="scroll${items.length ? '' : ' none'}"><h1 id="ltitle">倒计时</h1>${body}</div>${items.length ? '<button type="button" class="fab" data-add aria-label="添加倒计时"></button>' : ''}`;
}
