import { DAYS } from './config.js';
import { dateOfIndex, dateKey, weekGrid, WEEKDAYS } from './time.js';
import { moodById, moodIcon } from './moods.js';

const pad = (n) => String(n).padStart(2, '0');
const HEAD = ['一', '二', '三', '四', '五', '六', '日'];

// 回看页：周历，每天上午、下午各一个表情。
export function createReview(root, { getMoods, getTodayIdx, canEdit = () => false, onEdit = async () => {} }) {
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', '心情回看');
  root.innerHTML =
    '<header><h2>心情回看</h2><button type="button" class="x" aria-label="关闭"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>' +
    `<div class="week">${HEAD.map((h) => `<span>${h}</span>`).join('')}</div>` +
    '<div class="cal"></div><p class="detail"></p>' +
    '<div class="note" aria-label="手写便签"><p class="to">To 小北</p><p class="say">慢慢来，<br>此刻重要也只有此刻~</p><p class="sign">YG<br>26.秋</p></div>';
  const cal = root.querySelector('.cal');
  const detail = root.querySelector('.detail');
  let selected = -1;

  const face = (rec) => {
    const m = rec ? moodById(rec.m) : null;
    return m ? moodIcon(m.id, 'f') : '<i class="ring"></i>';
  };

  function render() {
    const moods = getMoods();
    const today = getTodayIdx();
    const { blanks, days } = weekGrid();
    let html = '<i></i>'.repeat(blanks);
    for (const i of days) {
      const o = dateOfIndex(i);
      const rec = moods[dateKey(i)] || {};
      const label = o.d === 1 || i === 0 ? `${o.m}/${o.d}` : String(o.d);
      const cls = ['day', i > today ? 'future' : '', i === today ? 'today' : '', i === selected ? 'sel' : ''].join(' ');
      html += `<button type="button" class="${cls}" data-i="${i}"><b>${label}</b><span>${face(rec.am)}${face(rec.pm)}</span></button>`;
    }
    cal.innerHTML = html;
    if (selected >= 0) {
      const o = dateOfIndex(selected);
      const rec = moods[dateKey(selected)] || {};
      const part = (label, slot, r) => {
        const m = r ? moodById(r.m) : null;
        if (!canEdit(selected, slot)) return `<span>${label}</span>${face(r)}${m ? `<span class="sr">${m.zh}</span>` : ''}`;
        const aria = `${label}${m ? m.zh : '没有记录'}，点按改选`;
        return `<span>${label}</span><button type="button" class="edit" data-slot="${slot}" aria-label="${aria}">${face(r)}</button>`;
      };
      detail.innerHTML =
        `<span>${pad(o.m)}.${pad(o.d)} ${WEEKDAYS[o.wd]}</span><i class="gap"></i>` +
        `${part('上午', 'am', rec.am)}<i class="gap"></i>${part('下午', 'pm', rec.pm)}`;
    } else {
      detail.textContent = '点一天看看';
    }
  }

  cal.addEventListener('click', (e) => {
    const b = e.target.closest('.day');
    if (!b) return;
    selected = Number(b.dataset.i);
    render();
  });
  detail.addEventListener('click', async (e) => {
    const b = e.target.closest('.edit');
    if (!b || selected < 0) return;
    await onEdit(selected, b.dataset.slot);
    render();
    detail.querySelector(`.edit[data-slot="${b.dataset.slot}"]`)?.focus();
  });
  root.querySelector('.x').addEventListener('click', close);
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  function open() {
    const t = getTodayIdx();
    selected = t >= 0 && t < DAYS ? t : -1;
    render();
    root.hidden = false;
    void root.offsetWidth;
    root.classList.add('show');
    root.querySelector('.x').focus();
  }

  function close() {
    root.classList.remove('show');
    setTimeout(() => { if (!root.classList.contains('show')) root.hidden = true; }, 220);
  }

  return { open, close, refresh: render, get isOpen() { return !root.hidden; } };
}
