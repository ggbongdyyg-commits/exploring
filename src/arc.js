import { DAYS } from './config.js';
import { dateOfIndex, WEEKDAYS } from './time.js';

const NS = 'http://www.w3.org/2000/svg';
const STEP = 0.435; // 相邻编号沿弧的夹角（弧度），取自参考图 A
const DARK = [58, 58, 56];
const LIGHT = [189, 188, 184];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createArc({ svg, nums, label }) {
  svg.innerHTML =
    '<defs><linearGradient id="arcfade" gradientUnits="userSpaceOnUse" x1="0" x2="0">' +
    '<stop offset="0" stop-color="#bdbcb8" stop-opacity="0"/><stop offset=".25" stop-color="#bdbcb8"/>' +
    '<stop offset=".75" stop-color="#bdbcb8"/><stop offset="1" stop-color="#bdbcb8" stop-opacity="0"/>' +
    '</linearGradient></defs><path fill="none" stroke="url(#arcfade)" stroke-width="1.3"/><g></g>';
  const grad = svg.querySelector('linearGradient');
  const path = svg.querySelector('path');
  const dotLayer = svg.querySelector('g');

  const spans = [];
  const dots = [];
  for (let n = 0; n <= DAYS; n++) {
    const s = document.createElement('span');
    s.textContent = String(n).padStart(2, '0');
    s.style.visibility = 'hidden';
    nums.appendChild(s);
    spans.push(s);
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('opacity', '0');
    dotLayer.appendChild(c);
    dots.push(c);
  }
  const strong = label.querySelector('b');
  const light = label.querySelector('span');

  let m = null;
  let value = DAYS;
  let shownLabel = -1;

  function layout(metrics) {
    m = metrics;
    const a = (62 * Math.PI) / 180;
    const x = m.cx + m.R * Math.cos(a);
    const y1 = m.cy - m.R * Math.sin(a);
    const y2 = m.cy + m.R * Math.sin(a);
    path.setAttribute('d', `M${x} ${y1} A${m.R} ${m.R} 0 0 1 ${x} ${y2}`);
    grad.setAttribute('y1', y1);
    grad.setAttribute('y2', y2);
    svg.setAttribute('viewBox', `0 0 ${m.W} ${m.H}`);
    nums.style.setProperty('--fs', `${m.fs}px`);
    label.style.left = `${m.cx + m.R + m.off + m.fs * 1.2 + m.u * 0.05}px`;
    label.style.top = `${m.cy}px`;
    label.style.fontSize = `${m.u * 0.04}px`;
    shownLabel = -1;
    render(value);
  }

  function setLabel(n) {
    const i = DAYS - n;
    const o = dateOfIndex(i);
    strong.textContent = `${String(o.m).padStart(2, '0')}.${String(o.d).padStart(2, '0')}`;
    light.textContent = WEEKDAYS[o.wd];
    shownLabel = n;
  }

  function render(p) {
    value = p;
    if (!m) return;
    for (let n = 0; n <= DAYS; n++) {
      const d = n - p;
      const ad = Math.abs(d);
      const span = spans[n];
      const dot = dots[n];
      if (ad > 2.75) {
        if (span.style.visibility !== 'hidden') {
          span.style.visibility = 'hidden';
          dot.setAttribute('opacity', '0');
        }
        continue;
      }
      const th = d * STEP;
      const c = Math.cos(th);
      const s = Math.sin(th);
      const t = Math.min(ad, 1);
      const col = `rgb(${DARK.map((v, k) => Math.round(v + (LIGHT[k] - v) * t)).join()})`;
      const op = ad <= 1.75 ? 1 : 1 - (ad - 1.75) / 1;
      span.style.visibility = 'visible';
      span.style.opacity = op;
      span.style.color = col;
      span.style.transform =
        `translate(${m.cx + (m.R + m.off) * c}px,${m.cy + (m.R + m.off) * s}px) ` +
        `rotate(${th}rad) scale(${1 - 0.5 * t}) translateY(-52%)`;
      dot.setAttribute('cx', m.cx + m.R * c);
      dot.setAttribute('cy', m.cy + m.R * s);
      dot.setAttribute('r', 2.4 + (1 - t) * 1.2);
      dot.setAttribute('fill', col);
      dot.setAttribute('opacity', op);
    }
    const near = Math.round(p);
    if (near !== shownLabel) setLabel(near);
    label.style.opacity = Math.max(0, 1 - Math.abs(p - near) * 2.4);
  }

  let raf = 0;
  function to(target, { immediate = false, ms = 0 } = {}) {
    cancelAnimationFrame(raf);
    if (immediate || target === value) {
      render(target);
      return;
    }
    const from = value;
    const dist = Math.abs(target - from);
    const dur = ms > 0 ? ms : Math.min(1800, 1000 * Math.sqrt(dist));
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      render(k >= 1 ? target : from + (target - from) * ease(k));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  return { layout, to, render, get value() { return value; } };
}
