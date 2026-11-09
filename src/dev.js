import { MOODS } from './moods.js';
import { keyOf } from './time.js';

const pickId = () => MOODS[Math.floor(Math.random() * MOODS.length)].id;

function seed(t) {
  const defs = [
    { id: 'demo-a', name: '研究生考试', start: t - 9, target: t + 47, today: false },
    { id: 'demo-b', name: '省考笔试', start: t - 20, target: t + 125, today: true },
    { id: 'demo-c', name: '英语六级', start: t - 3, target: t + 215, today: true },
    { id: 'demo-d', name: '英语四级', start: t - 60, target: t - 5, today: true },
  ];
  const raw = { v: 1, items: [], moods: {}, asked: {}, reviewed: {}, shown: {} };
  for (const d of defs) {
    raw.items.push({ id: d.id, name: d.name, start: keyOf(d.start), target: keyOf(d.target) });
    const m = {};
    const last = Math.min(d.target, d.today ? t : t - 1);
    for (let n = d.start; n <= last; n++) {
      if (n === t || Math.random() < 0.85) m[keyOf(n)] = { m: pickId(), t: Date.now() };
    }
    raw.moods[d.id] = m;
  }
  return raw;
}

export function initDev({ store, now, setOffset, getOffset, reroute }) {
  const app = document.getElementById('app');
  const box = document.createElement('div');
  box.id = 'devp';
  app.appendChild(box);

  const btn = (label, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', fn);
    box.appendChild(b);
  };
  const info = document.createElement('span');
  box.appendChild(info);
  const paint = () => { info.textContent = `${keyOf(now())} (${getOffset() >= 0 ? '+' : ''}${getOffset()}d)`; };

  btn('-1d', () => { setOffset(getOffset() - 1); paint(); });
  btn('+1d', () => { setOffset(getOffset() + 1); paint(); });
  btn('+7d', () => { setOffset(getOffset() + 7); paint(); });
  btn('今天', () => { setOffset(0); paint(); });
  btn('填充示例', () => { store.replaceAll(seed(now())); location.hash = '#/'; reroute(); });
  btn('清空', () => { store.clear(); location.hash = '#/'; reroute(); });
  paint();
}
