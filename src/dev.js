import { DAYS, KEY_COUNT } from './config.js';
import { dateOfIndex, dateKey, WEEKDAYS } from './time.js';
import { MOODS } from './moods.js';
import { derive, countdownOfKey } from './state.js';

const HOURS = { am: 8, pm: 15 };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const randomMood = () => MOODS[Math.floor(Math.random() * MOODS.length)].id;

export function createDev({ stage, store, picker, review, getClock, setClock, read, evaluate, isBusy, reset: resetApp, jumpTo }) {
  let t = { idx: 0, hour: HOURS.am };
  setClock(t);
  let running = false;

  const el = document.createElement('div');
  el.id = 'dev';
  el.innerHTML =
    '<div class="row"><b>DEV</b> <span id="d-out"></span></div>' +
    '<div class="row"><input id="d-day" type="range" min="-1" max="45" step="1"></div>' +
    '<div class="row"><button data-a="prev">-1日</button><button data-a="next">+1日</button>' +
    '<button data-h="am">上午 8:00</button><button data-h="pm">下午 15:00</button></div>' +
    '<div class="row"><button data-a="auto">自动走完 88 键</button><button data-a="fill">瞬间填满</button><button data-a="reset">重置</button></div>';
  stage.appendChild(el);
  const out = el.querySelector('#d-out');
  const range = el.querySelector('#d-day');
  const autoBtn = el.querySelector('[data-a="auto"]');

  function paint() {
    const s = read();
    const o = t.idx >= 0 ? dateOfIndex(t.idx) : null;
    const day = o ? `${String(o.m).padStart(2, '0')}/${String(o.d).padStart(2, '0')} ${WEEKDAYS[o.wd]}` : '开始前';
    out.textContent = `${day} ${t.hour}:00 n=${String(s.n).padStart(2, '0')} 键 ${store.seen()}→${s.key}/88`;
    range.value = t.idx;
    for (const b of el.querySelectorAll('[data-h]')) b.classList.toggle('on', HOURS[b.dataset.h] === t.hour);
  }
  setInterval(paint, 300);

  // 改时钟：往后拖会触发真实的补跳；往前拖直接把小人放回对应的键。
  function apply(next) {
    t = { idx: Math.max(-1, Math.min(DAYS + 1, next.idx)), hour: next.hour };
    setClock(t);
    const s = read();
    if (s.key < store.seen()) jumpTo(s.key, s.n === 0 ? 0 : countdownOfKey(s.key));
    picker.close();
    setTimeout(evaluate, 0);
    paint();
  }

  function pick(id) {
    const b = stage.querySelector(`#pick .mood[data-id="${id}"]`);
    if (!b || !picker.isOpen) return false;
    b.click();
    return true;
  }

  function stop() {
    running = false;
    autoBtn.textContent = '自动走完 88 键';
  }

  async function auto() {
    if (running) return stop();
    running = true;
    autoBtn.textContent = '停止';
    doReset();
    await wait(450);
    for (let k = 0; k < KEY_COUNT && running; k++) {
      t = { idx: Math.floor(k / 2), hour: k % 2 ? HOURS.pm : HOURS.am };
      setClock(t);
      evaluate();
      for (let i = 0; i < 40 && !picker.isOpen; i++) await wait(25);
      await wait(120);
      if (!running) break;
      pick(randomMood());
      await wait(350);
      while (running && isBusy()) await wait(60);
    }
    stop();
  }

  function fill() {
    stop();
    for (let d = 0; d < DAYS; d++) {
      store.setMood(dateKey(d), 'am', randomMood(), d);
      store.setMood(dateKey(d), 'pm', randomMood(), d);
    }
    t = { idx: DAYS - 1, hour: HOURS.pm };
    setClock(t);
    jumpTo(KEY_COUNT, 1);
    picker.close();
    setTimeout(evaluate, 0);
    paint();
  }

  function doReset() {
    resetApp();
    t = { idx: 0, hour: HOURS.am };
    setClock(t);
    setTimeout(evaluate, 0);
    paint();
  }

  function reset() {
    stop();
    doReset();
  }

  range.addEventListener('input', () => apply({ idx: Number(range.value), hour: t.hour }));
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.h) return apply({ idx: t.idx, hour: HOURS[b.dataset.h] });
    const a = b.dataset.a;
    if (a === 'prev') apply({ idx: t.idx - 1, hour: t.hour });
    else if (a === 'next') apply({ idx: t.idx + 1, hour: t.hour });
    else if (a === 'auto') auto();
    else if (a === 'fill') fill();
    else if (a === 'reset') reset();
  });

  window.__keys88 = { state: read, clock: getClock, apply, reset, fill, pick, derive, store };
  paint();
}
