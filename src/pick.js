import { MOODS, moodIcon } from './moods.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// 心情面板。open() 返回 Promise：{ id } 选了表情 / { skip: true } 点了跳过 / null 被外部关闭。
export function createPicker(root) {
  root.innerHTML =
    '<div class="card" role="dialog" aria-modal="true" aria-labelledby="pick-title">' +
    '<h2 id="pick-title"></h2><p class="sub"></p><div class="grid"></div>' +
    '<button type="button" class="skip"></button></div>';
  const title = root.querySelector('h2');
  const sub = root.querySelector('.sub');
  const grid = root.querySelector('.grid');
  const skip = root.querySelector('.skip');

  grid.innerHTML = MOODS.map(
    (m) => `<button type="button" class="mood" data-id="${m.id}" aria-label="${m.zh}">${moodIcon(m.id)}</button>`
  ).join('');

  let settle = null;
  let locked = false;
  let hideTimer = 0;

  function done(value) {
    if (!settle) return;
    const fn = settle;
    settle = null;
    locked = false;
    root.classList.remove('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (!settle) root.hidden = true; }, reduce() ? 0 : 240);
    fn(value);
  }

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.mood');
    if (!b || !settle || locked) return;
    locked = true;
    b.classList.add('chosen');
    const run = settle;
    setTimeout(() => { if (settle === run) done({ id: b.dataset.id }); }, reduce() ? 0 : 280);
  });
  skip.addEventListener('click', () => { if (!locked) done({ skip: true }); });

  function open({ heading, subtitle, current = null, skipLabel = '先不说啦' }) {
    if (settle) done(null);
    clearTimeout(hideTimer);
    title.textContent = heading;
    sub.textContent = subtitle;
    skip.textContent = skipLabel;
    for (const b of grid.children) {
      b.classList.remove('chosen');
      b.classList.toggle('current', b.dataset.id === current);
    }
    root.hidden = false;
    void root.offsetWidth;
    root.classList.add('show');
    return new Promise((resolve) => { settle = resolve; });
  }

  function layout({ top, height }) {
    root.style.top = `${top}px`;
    root.style.height = `${height}px`;
    root.style.setProperty('--face', `${Math.max(44, Math.min(72, (height - 190) / 3))}px`);
  }

  return { open, close: () => done(null), layout, get isOpen() { return !!settle; } };
}
