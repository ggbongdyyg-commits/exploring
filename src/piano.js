import { KEYS, WHITE_COUNT, BLACK_W, footX } from './keys.js';

const NS = 'http://www.w3.org/2000/svg';

export function createPiano({ kb, track, walker }) {
  let m = null;
  let pad = 0;
  let pos = 0;
  let timer = 0;
  let landTimer = 0;
  let pending = null;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build() {
    const { w, kbH } = m;
    pad = m.W + 24;
    const total = WHITE_COUNT * w;
    const blackH = kbH * 0.66;
    const parts = [
      `<rect class="cheek" x="${-pad}" y="0" width="${pad}" height="${kbH}"/>`,
      `<rect class="cheek" x="${total}" y="0" width="${pad}" height="${kbH}"/>`,
    ];
    KEYS.forEach((k) => {
      if (!k.black) parts.push(`<rect class="wk" id="k${k.k}" x="${k.x0 * w}" y="-1" width="${w}" height="${kbH + 1}"/>`);
    });
    parts.push(`<rect class="band" x="0" y="0" width="${total}" height="${kbH * 0.05}"/>`);
    KEYS.forEach((k) => {
      if (!k.black) return;
      const x = k.x0 * w;
      const bw = BLACK_W * w;
      parts.push(
        `<rect class="bk" id="k${k.k}" x="${x}" y="-1" width="${bw}" height="${blackH}" rx="2"/>` +
          `<rect class="bkb" x="${x + 1}" y="${blackH * 0.9}" width="${bw - 2}" height="${blackH * 0.1 - 1}" rx="1.5"/>`
      );
    });
    parts.push(`<line class="ledge" x1="${-pad}" x2="0" y1="0.5" y2="0.5"/><line class="ledge" x1="${total}" x2="${total + pad}" y1="0.5" y2="0.5"/>`);
    track.innerHTML =
      `<svg xmlns="${NS}" width="${total + pad * 2}" height="${kbH}" viewBox="${-pad} 0 ${total + pad * 2} ${kbH}">${parts.join('')}</svg>`;
  }

  const trackX = (p) => m.figX - footX(p) * m.w - pad;

  function mark(p) {
    track.querySelectorAll('.on').forEach((e) => e.classList.remove('on'));
    const el = track.querySelector(`#k${p}`);
    if (el && p >= 1) el.classList.add('on');
  }

  function layout(metrics) {
    m = metrics;
    kb.style.top = `${m.kbTop}px`;
    kb.style.height = `${m.kbH}px`;
    walker.style.left = `${m.figX - m.figW / 2}px`;
    walker.style.top = `${m.kbTop - m.figH + 1}px`;
    walker.style.width = `${m.figW}px`;
    walker.style.height = `${m.figH}px`;
    build();
    place(pos);
  }

  function place(p) {
    clearTimeout(timer);
    clearTimeout(landTimer);
    if (!m) { pos = p; return; }
    walker.getAnimations().forEach((a) => a.cancel());
    pos = p;
    track.style.transition = 'none';
    track.style.transform = `translateX(${trackX(p)}px)`;
    mark(p);
    if (pending) {
      const done = pending;
      pending = null;
      done();
    }
  }

  // 向前走一键：小人原地起跳，琴键轨道平移。连续多步时 linear 让轨道不在每步之间停顿。
  function step(p, ms, { linear = false, onLand = null } = {}) {
    return new Promise((resolve) => {
      if (!m || reduce() || ms <= 0 || p === pos) {
        place(p);
        resolve();
        return;
      }
      if (pending) place(pos);
      pending = resolve;
      pos = p;
      void track.getBoundingClientRect();
      track.style.transition = `transform ${ms}ms ${linear ? 'cubic-bezier(.3,.1,.7,.9)' : 'cubic-bezier(.45,.05,.2,1)'}`;
      track.style.transform = `translateX(${trackX(p)}px)`;
      const up = m.figH * 0.5;
      walker.animate(
        [
          { transform: 'translateY(0) scale(1,1)', offset: 0, easing: 'cubic-bezier(.3,0,.4,1)' },
          { transform: 'translateY(0) scale(1.06,.92)', offset: 0.14, easing: 'cubic-bezier(.2,.6,.3,1)' },
          { transform: `translateY(${-up}px) scale(.97,1.04)`, offset: 0.5, easing: 'cubic-bezier(.6,0,.8,.4)' },
          { transform: 'translateY(0) scale(1.07,.91)', offset: 0.88, easing: 'ease-out' },
          { transform: 'translateY(0) scale(1,1)', offset: 1 },
        ],
        { duration: ms }
      );
      if (onLand) landTimer = setTimeout(onLand, ms * 0.88);
      timer = setTimeout(() => {
        mark(p);
        pending = null;
        resolve();
      }, ms);
    });
  }

  // 回看时只滑动琴键轨道，不改变小人真正所在的键（pos）。
  function look(p, { instant = false } = {}) {
    if (!m) return;
    track.style.transition = instant || reduce() ? 'none' : 'transform 260ms cubic-bezier(.3,.1,.3,1)';
    track.style.transform = `translateX(${trackX(p)}px)`;
    mark(p);
  }

  return { layout, step, place, look, get pos() { return pos; } };
}
