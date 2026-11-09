import { MOODS, moodIcon } from './moods.js';

const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// 心情面板。resolve: { id } | { skip: true } | null（被外部关闭）
export function createPicker(host) {
  let el = null, done = null;

  function close(result) {
    if (!el) return;
    const node = el, cb = done;
    el = null; done = null;
    node.classList.remove('on');
    setTimeout(() => node.remove(), reduce() ? 0 : 220);
    if (cb) cb(result);
  }

  function open({ title = '今天的心情', subtitle, current = null, skipLabel = '跳过' }) {
    close(null);
    return new Promise((resolve) => {
      done = resolve;
      el = document.createElement('div');
      el.className = 'overlay';
      el.innerHTML = `<div class="scrim"></div><div class="card pick" role="dialog" aria-modal="true" aria-label="${title}"><h2>${title}</h2><p>${subtitle}</p><div class="faces">${MOODS.map(
        (m) => `<button type="button" class="face-btn${m.id === current ? ' cur' : ''}" data-id="${m.id}" aria-label="${m.zh}">${moodIcon(m.id)}</button>`).join('')}</div><button type="button" class="skip">${skipLabel}</button></div>`;
      host.appendChild(el);
      requestAnimationFrame(() => el && el.classList.add('on'));
      let locked = false;
      el.addEventListener('click', (e) => {
        if (locked) return;
        const b = e.target.closest('.face-btn'), s = e.target.closest('.skip');
        if (b) {
          locked = true;
          b.classList.add('chosen');
          setTimeout(() => close({ id: b.dataset.id }), reduce() ? 0 : 260);
        } else if (s) close({ skip: true });
      });
    });
  }

  return { open, close: () => close(null), isOpen: () => !!el };
}
