import { writeFileSync } from 'node:fs';
import { MOODS, } from '../src/moods.js';
import { G, dial, dots, face, shell, day, md, wd, addDays, moodOf, WD } from './lib.mjs';

export const out = (n, html) => writeFileSync(new URL(n, import.meta.url), html);
const dstr = (dt) => `${dt.getUTCFullYear()}.${md(dt)} ${wd(dt)}`;

export function main({ name, start, today, target, past, now, overlay = '' }) {
  const idx = Math.round((today - start) / 864e5), total = Math.round((target - start) / 864e5), n = total - idx;
  const cells = [];
  for (let i = 0; i <= total; i++) {
    if (i < idx) cells.push(past[i] ? { k: 'mood', id: past[i] } : { k: 'skip' });
    else if (i === idx) cells.push({ k: 'today', id: now });
    else if (i === total) cells.push({ k: 'goal' });
    else cells.push({ k: 'future' });
  }
  const d = dial(total, n);
  return shell(`<div class="hatch"></div>${d.svg}${d.nums}
<div id="label" style="left:${d.lx.toFixed(1)}px;top:${G.cy}px"><b>${md(today)}</b><i>${wd(today)}</i></div>
<div id="goal"><b>${name}</b><i>${dstr(target)}</i></div>
<div id="back"></div><div id="peek"><span></span></div>${dots(cells)}${overlay}`);
}

export const start = day(2026, 10, 31), today = day(2026, 11, 9), target = day(2026, 12, 26);
const past = ['worried', 'tired', 'calm', 'happy', 'tired', 'calm', null, 'happy', 'loving'];
const base = { name: '研究生考试', start, today, target, past, now: 'calm' };

const faces = MOODS.map((m) => `<div>${face(m.id, 64)}</div>`).join('');
export const pick = `<div class="scrim"></div><div class="card" id="pick"><h2>今天的心情</h2><p>${md(today)} ${wd(today)}</p><div class="faces">${faces}</div><div class="skip">跳过</div></div>`;
export const setup = `<div class="scrim"></div><div class="card" id="setup"><h2>新的倒计时</h2>
<div class="fld"><small>倒计时的目标</small><div>研究生考试</div></div>
<div class="fld"><small>目标日期</small><div class="mono">2026.12.26<em>周六</em></div></div>
<div class="go">开始</div></div>`;

out('01-setup.html', main({ ...base, past: [], today: start, now: null, overlay: setup }));
out('02-main.html', main(base));
out('03-pick.html', main({ ...base, now: null, overlay: pick }));

const long = main({ name: '省考笔试', start: day(2026, 10, 20), today, target: day(2027, 3, 14),
  past: ['calm', 'tired', 'worried', 'happy', 'happy', 'calm', 'sad', 'tired', 'calm', 'confused', 'worried', 'calm', 'happy', 'loving', 'tired', null, 'calm', 'worried', 'happy'], now: 'tired' });
out('04-long.html', long);

const rec = { '10-31': 'worried', '11-01': 'tired', '11-02': 'calm', '11-03': 'happy', '11-04': 'tired', '11-05': 'calm', '11-07': 'happy', '11-08': 'loving', '11-09': 'calm' };
function month(y, m, from, to) {
  const first = day(y, m, from), lead = (first.getUTCDay() + 6) % 7;
  let h = `<div class="mlab">${m} 月</div><div class="mo">` + '<i></i>'.repeat(lead);
  for (let dd = from; dd <= to; dd++) {
    const dt = day(y, m, dd), key = `${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const id = rec[key], isT = dt.getTime() === today.getTime(), isG = dt.getTime() === target.getTime(), fut = dt > today;
    const cls = ['d', fut ? 'f' : '', isT ? 't' : '', isG ? 'g' : '', key === '11-07' ? 's' : ''].join(' ');
    const mk = fut ? '<div class="ph"></div>' : id ? face(id, 24) : '<div class="ph"></div>';
    h += `<div class="${cls}"><span>${dd}</span>${mk}</div>`;
  }
  return h + '</div>';
}
const wk = '<div class="wk">' + ['一', '二', '三', '四', '五', '六', '日'].map((s) => `<span>${s}</span>`).join('') + '</div>';
const sel = `<div id="sel">11.07 周六 ${face('happy', 26)}</div>`;
out('05-review.html', shell(`<div id="review"><header><span>心情回看</span><u>×</u></header>${wk}${month(2026, 10, 31, 31)}${month(2026, 11, 1, 30)}${month(2026, 12, 1, 26)}</div>${sel}`));
console.log('ok', WD.length);
