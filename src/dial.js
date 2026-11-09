const STEP = Math.PI / 6;
const f = (v) => v.toFixed(2);
const mix = (a, b, t) => Math.round(a + (b - a) * t);
const INK = [0x3a, 0x3a, 0x38], SOFT = [0xbd, 0xbc, 0xb8];

export function metrics(W, H) {
  const u = Math.min(W, H * 0.462);
  return { u, cx: -0.2816 * u, cy: H * 0.32, R: 0.5777 * u, off: 0.065 * u, fs: u * 0.17 };
}

// 滚轮：只负责画，不接受拖动。x 是连续值，整数时某个数字正对着圆心。
export function createDial(root) {
  root.innerHTML = '<svg class="arc" aria-hidden="true"></svg><div class="nums" aria-hidden="true"></div>';
  const svg = root.firstChild, nums = root.lastChild;
  let G = null, total = 0, digits = 2, rotG = null, raf = 0, cur = 0;

  function layout(W, H, tot) {
    G = metrics(W, H);
    total = tot;
    digits = String(tot).length;
    const { cx, cy, R } = G, lim = (62 * Math.PI) / 180;
    const ax = cx + R * Math.cos(lim), ay1 = cy - R * Math.sin(lim), ay2 = cy + R * Math.sin(lim);
    let ticks = '';
    for (let i = -22; i <= 22; i++) {
      const th = (i * 6 * Math.PI) / 180, len = i % 5 === 0 ? 14 : 6;
      ticks += `<line class="tk${i % 5 === 0 ? ' M' : ''}" x1="${f(cx + R * Math.cos(th))}" y1="${f(cy + R * Math.sin(th))}" x2="${f(cx + (R - len) * Math.cos(th))}" y2="${f(cy + (R - len) * Math.sin(th))}"/>`;
    }
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.innerHTML = `<defs><linearGradient id="mg" gradientUnits="userSpaceOnUse" x1="0" y1="${f(ay1)}" x2="0" y2="${f(ay2)}"><stop offset="0" stop-color="#000"/><stop offset=".22" stop-color="#fff"/><stop offset=".78" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="fm" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#mg)"/></mask></defs><g mask="url(#fm)"><path d="M${f(ax)} ${f(ay1)}A${f(R)} ${f(R)} 0 0 1 ${f(ax)} ${f(ay2)}" fill="none" stroke="#bdbcb8" stroke-width="1.3"/><g class="rot">${ticks}</g></g><circle cx="${f(cx + R)}" cy="${f(cy)}" r="4" fill="#1b1c1c"/>`;
    rotG = svg.querySelector('.rot');
    set(cur);
  }

  function set(x) {
    cur = x;
    if (!G) return;
    const { cx, cy, R, off, fs } = G;
    rotG.setAttribute('transform', `rotate(${f(((-x * 30) % 30))} ${f(cx)} ${f(cy)})`);
    let html = '';
    for (let v = Math.floor(x) - 2; v <= Math.ceil(x) + 2; v++) {
      if (v < 0 || v > total) continue;
      const d = v - x, ad = Math.abs(d), t = Math.min(ad, 1);
      const op = ad <= 1.2 ? 1 : Math.max(0, 1 - (ad - 1.2) / 0.8);
      if (op <= 0) continue;
      const th = d * STEP, px = cx + (R + off) * Math.cos(th), py = cy + (R + off) * Math.sin(th);
      const col = `rgb(${mix(INK[0], SOFT[0], t)},${mix(INK[1], SOFT[1], t)},${mix(INK[2], SOFT[2], t)})`;
      html += `<span class="num" style="font-size:${f(fs)}px;color:${col};opacity:${f(op)};transform:translate(${f(px)}px,${f(py)}px) rotate(${f(th)}rad) scale(${f(1 - 0.5 * t)}) translateY(-52%)">${String(v).padStart(digits, '0')}</span>`;
    }
    nums.innerHTML = html;
  }

  function roll(from, to, ms) {
    cancelAnimationFrame(raf);
    if (!ms || from === to) { set(to); return Promise.resolve(); }
    return new Promise((res) => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
        set(from + (to - from) * e);
        if (p < 1) raf = requestAnimationFrame(tick);
        else res();
      };
      set(from);
      raf = requestAnimationFrame(tick);
    });
  }

  // 日期标签放在当前数字右侧。
  const labelX = () => G.cx + G.R + G.off + digits * 0.6 * G.fs + G.u * 0.05;
  const stop = () => cancelAnimationFrame(raf);
  return { layout, set, roll, labelX, stop, get cy() { return G.cy; } };
}
