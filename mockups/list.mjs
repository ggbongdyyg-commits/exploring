import { G, shell, face, day, md, wd, W, H } from './lib.mjs';
import { out, main, pick, setup } from './screens.mjs';

const today = day(2026, 11, 9);
const dstr = (dt) => `${dt.getUTCFullYear()}.${md(dt)} ${wd(dt)}`;
const left = (t) => Math.round((t - today) / 864e5);

const events = [
  { name: '研究生考试', start: day(2026, 10, 31), target: day(2026, 12, 26) },
  { name: '省考笔试', start: day(2026, 10, 20), target: day(2027, 3, 14) },
  { name: '英语六级', start: day(2026, 11, 2), target: day(2027, 6, 12) },
];
const ended = { name: '英语四级', target: day(2026, 11, 1) };

function heroDial() {
  const cx = -60, cy = 95, R = 130, f = (v) => v.toFixed(1);
  let t = '';
  for (let i = -6; i <= 6; i++) {
    const th = (i * 6 * Math.PI) / 180, M = i % 5 === 0, len = M ? 14 : 6;
    t += `<line x1="${f(cx + R * Math.cos(th))}" y1="${f(cy + R * Math.sin(th))}" x2="${f(cx + (R - len) * Math.cos(th))}" y2="${f(cy + (R - len) * Math.sin(th))}" stroke="${M ? '#3a3a38' : '#9a9894'}" stroke-width="${M ? 1.6 : 1}" stroke-linecap="round" opacity="${(1 - Math.abs(i) / 8).toFixed(2)}"/>`;
  }
  const a = (40 * Math.PI) / 180;
  const arc = `<path d="M${f(cx + R * Math.cos(a))} ${f(cy - R * Math.sin(a))}A${R} ${R} 0 0 1 ${f(cx + R * Math.cos(a))} ${f(cy + R * Math.sin(a))}" fill="none" stroke="#bdbcb8" stroke-width="1.3" opacity=".6"/>`;
  return `<svg width="350" height="190" style="left:0;top:0">${arc}${t}<circle cx="${f(cx + R)}" cy="${cy}" r="4" fill="#1b1c1c"/></svg>`;
}

function cards() {
  const [h, ...rest] = events;
  const n = left(h.target), total = Math.round((h.target - h.start) / 864e5);
  const pct = Math.round(((total - n) / total) * 100);
  let s = `<div class="ev hero">${heroDial()}<div class="big">${n}</div><div class="nm">${h.name}</div><div class="dt">${dstr(h.target)}</div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
  rest.forEach((e, i) => {
    s += `<div class="ev c" style="top:${340 + i * 92}px"><div class="nm">${e.name}</div><div class="dt">${dstr(e.target)}</div><div class="cnt">${left(e.target)}<small>天</small></div></div>`;
  });
  s += `<div class="sect" style="top:${340 + rest.length * 92 + 14}px">已结束</div>`;
  s += `<div class="ev c end" style="top:${340 + rest.length * 92 + 40}px"><div class="nm">${ended.name}</div><div class="dt">${dstr(ended.target)}</div><div class="cnt">已结束</div></div>`;
  return s;
}

const list = (overlay = '', body = cards(), fab = true) => shell(`<div class="hatch"></div><div id="ltitle">倒计时</div>${body}${fab ? '<div class="fab"></div>' : ''}${overlay}`);

const empty = `<div class="empty"><div class="ring">+</div><p>还没有倒计时</p><div class="go">添加倒计时</div></div>`;

out('06-list.html', list());
out('08-empty.html', list('', empty, false));
out('01-setup.html', list(setup, empty, false));
const t0 = day(2026, 11, 9), tg = day(2026, 12, 26);
out('09-first-pick.html', main({ name: '研究生考试', start: t0, today: t0, target: tg, past: [], now: null, overlay: pick }));
out('07-list-pick.html', list());
console.log('ok list', W, H, G.cy);
