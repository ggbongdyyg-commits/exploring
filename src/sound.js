// 第 k 键（1 = A0 = 27.5Hz，49 = A4 = 440Hz）的基频。
export const freqOfKey = (k) => 27.5 * Math.pow(2, (k - 1) / 12);

let ctx = null;
let master = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(comp);
  comp.connect(ctx.destination);
  return ctx;
}

// 浏览器要求先有一次用户手势才能出声；首次点按/触摸时解锁。
export function unlockOnGesture() {
  const go = () => {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume();
  };
  ['pointerdown', 'touchend', 'keydown'].forEach((t) =>
    document.addEventListener(t, go, { once: true, passive: true, capture: true })
  );
}

// 用几根泛音叠出钢琴的音色：高音衰减快，低音更长更厚。
export function playKey(k) {
  const c = ensure();
  if (!c || c.state !== 'running') return;
  const f = freqOfKey(k);
  const t0 = c.currentTime;
  const hold = Math.max(0.7, Math.min(2.6, 3.2 - k * 0.028));
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(0.9, t0 + 0.006);
  out.gain.exponentialRampToValueAtTime(0.28, t0 + 0.14);
  out.gain.exponentialRampToValueAtTime(0.0001, t0 + hold);
  out.connect(master);
  [[1, 1], [2, 0.5], [3, 0.28], [4, 0.14], [5, 0.07]].forEach(([mul, amp]) => {
    const hz = f * mul;
    if (hz > 12000) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = hz;
    g.gain.value = amp * (mul === 1 ? 1 : 1 / (1 + k / 60));
    o.connect(g);
    g.connect(out);
    o.start(t0);
    o.stop(t0 + hold + 0.05);
  });
}
