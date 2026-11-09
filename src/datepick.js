import { monthGrid } from './model.js';
import { keyOf, numOfKey, parts } from './time.js';

const WK = ['一', '二', '三', '四', '五', '六', '日'];
const YEARS_AHEAD = 10;
const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// 底部月历。日期范围以应用自己的“今天”为准，不用系统时钟。
// resolve: 'YYYY-MM-DD' | null
export function createDatePicker(host) {
  let el = null, done = null;

  function close(result) {
    if (!el) return;
    const node = el, cb = done;
    el = null; done = null;
    node.classList.remove('on');
    setTimeout(() => node.remove(), reduce() ? 0 : 260);
    if (cb) cb(result);
  }

  function open({ value, min, today }) {
    close(null);
    return new Promise((resolve) => {
      done = resolve;
      const sel = numOfKey(value);
      const seed = parts(Number.isNaN(sel) ? min : sel);
      const lo = parts(min), maxY = parts(today).y + YEARS_AHEAD;
      let y = seed.y, m = seed.m;

      el = document.createElement('div');
      el.className = 'overlay top';
      el.innerHTML = '<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="选择目标日期"></div>';
      host.appendChild(el);
      requestAnimationFrame(() => el && el.classList.add('on'));
      const root = el, sheet = el.querySelector('.sheet');

      const paint = () => {
        const g = monthGrid(y, m);
        const atMin = y < lo.y || (y === lo.y && m <= lo.m);
        const atMax = y >= maxY && m >= 12;
        let cells = '<i></i>'.repeat(g.lead);
        for (let d = 1; d <= g.days; d++) {
          const n = g.first + d - 1, off = n < min;
          const cls = [n === numOfKey(value) ? 's' : '', n === today ? 't' : ''].join(' ');
          cells += `<button type="button" class="${cls}" data-n="${n}"${off ? ' disabled' : ''}><span>${d}</span></button>`;
        }
        sheet.innerHTML = `<div class="dh"><button type="button" class="nav" data-d="-1" aria-label="上个月"${atMin ? ' disabled' : ''}>‹</button><b>${y} 年 ${m} 月</b><button type="button" class="nav" data-d="1" aria-label="下个月"${atMax ? ' disabled' : ''}>›</button></div>
<div class="dw">${WK.map((w) => `<span>${w}</span>`).join('')}</div><div class="dg">${cells}</div>`;
      };
      paint();

      sheet.addEventListener('click', (e) => {
        const nav = e.target.closest('.nav');
        if (nav) {
          m += +nav.dataset.d;
          if (m < 1) { m = 12; y -= 1; } else if (m > 12) { m = 1; y += 1; }
          paint();
          return;
        }
        const b = e.target.closest('.dg button');
        if (b && !b.disabled) {
          sheet.querySelectorAll('.dg .s').forEach((x) => x.classList.remove('s'));
          b.classList.add('s');
          const key = keyOf(+b.dataset.n);
          setTimeout(() => { if (el === root) close(key); }, reduce() ? 0 : 140);
        }
      });
      el.querySelector('.scrim').addEventListener('click', () => close(null));
    });
  }

  return { open, close: () => close(null), isOpen: () => !!el };
}
