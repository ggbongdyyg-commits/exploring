import { moodIcon } from './moods.js';
import { monthsOf } from './model.js';
import { keyOf, mdText, weekdayText } from './time.js';

const WK = ['一', '二', '三', '四', '五', '六', '日'];

// 回看：只看这个项目的日期范围，每天一张脸。
export function createReview(host) {
  let el = null, onClose = null;

  function close() {
    if (!el) return;
    const n = el, cb = onClose;
    el = null; onClose = null;
    n.classList.remove('on');
    setTimeout(() => n.remove(), 220);
    if (cb) cb();
  }

  // edit(n) 返回 Promise<boolean>：该天的心情是否被改过。
  function open({ item: it, today, moods, edit }) {
    close();
    return new Promise((resolve) => {
      onClose = resolve;
      const todayKey = keyOf(today);
      const mark = (n) => { const rec = moods()[keyOf(n)]; return rec ? moodIcon(rec.m) : '<div class="ph"></div>'; };
      let html = '';
      for (const g of monthsOf(it)) {
        html += `<div class="mlab">${g.m} 月</div><div class="mo">${'<i></i>'.repeat(g.lead)}`;
        for (const d of g.days) {
          const fut = d.n > today;
          const cls = ['d', fut ? 'f' : '', d.key === todayKey ? 't' : '', d.key === it.target ? 'g' : ''].join(' ');
          html += `<button type="button" class="${cls}" data-n="${d.n}"${fut ? ' disabled' : ''}><span>${d.d}</span>${fut ? '<div class="ph"></div>' : mark(d.n)}</button>`;
        }
        html += '</div>';
      }
      el = document.createElement('div');
      el.className = 'review';
      el.innerHTML = `<header><span>心情回看</span><button type="button" class="x" aria-label="关闭">×</button></header><div class="wk">${WK.map((w) => `<span>${w}</span>`).join('')}</div><div class="scroll">${html}</div><div class="sel" aria-live="polite"></div>`;
      host.appendChild(el);
      requestAnimationFrame(() => el && el.classList.add('on'));
      const root = el, sel = el.querySelector('.sel');
      let cur = null;

      const paintBar = () => {
        const rec = moods()[keyOf(cur)];
        sel.innerHTML = `<span>${mdText(cur)} ${weekdayText(cur)}</span><button type="button" class="face" aria-label="修改这天的心情">${rec ? moodIcon(rec.m) : '<i class="ph"></i>'}</button>`;
        sel.classList.add('on');
      };
      const show = (n) => {
        cur = n;
        root.querySelectorAll('.d.s').forEach((x) => x.classList.remove('s'));
        const cell = root.querySelector(`.d[data-n="${n}"]`);
        if (cell) cell.classList.add('s');
        paintBar();
      };
      const change = async (n) => {
        if (!(await edit(n)) || el !== root) return;
        const cell = root.querySelector(`.d[data-n="${n}"]`);
        if (cell) cell.lastElementChild.outerHTML = mark(n);
        if (cur === n) paintBar();
      };
      root.addEventListener('click', (e) => {
        if (e.target.closest('.x')) return close();
        if (e.target.closest('button.face')) return change(cur);
        const b = e.target.closest('.d');
        if (b && !b.disabled) { show(+b.dataset.n); change(+b.dataset.n); }
      });
      const tc = root.querySelector('.d.t');
      if (tc) tc.scrollIntoView({ block: 'center' });
      else root.querySelector('.scroll').scrollTop = 0;
    });
  }

  return { open, close, isOpen: () => !!el };
}
