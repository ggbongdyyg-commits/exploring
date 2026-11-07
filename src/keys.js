import { KEY_COUNT } from './config.js';

// 真实 88 键（A0..C8，MIDI 21..108）。单位：白键宽度 = 1。
export const BLACK_W = 0.58;
// 黑键中心相对其所在两白键分界线的偏移（C#/D# 与 F#/G#/A# 两组的真实错位）
const BLACK_SHIFT = { 1: -0.09, 3: 0.09, 6: -0.11, 8: 0, 10: 0.11 };

export const KEYS = [];
export let WHITE_COUNT = 0;

(function build() {
  let whites = 0;
  for (let k = 1; k <= KEY_COUNT; k++) {
    const midi = 20 + k;
    const pc = midi % 12;
    if (pc in BLACK_SHIFT) {
      const cx = whites + BLACK_SHIFT[pc];
      KEYS.push({ k, midi, black: true, x0: cx - BLACK_W / 2, x1: cx + BLACK_W / 2, foot: cx });
    } else {
      KEYS.push({ k, midi, black: false, x0: whites, x1: whites + 1, foot: 0 });
      whites++;
    }
  }
  WHITE_COUNT = whites;
  // 白键落脚点 = 键首可见窄段（两侧黑键之间）的中心
  KEYS.forEach((key, i) => {
    if (key.black) return;
    const l = KEYS[i - 1];
    const r = KEYS[i + 1];
    const a = l && l.black ? Math.max(key.x0, l.x1) : key.x0;
    const b = r && r.black ? Math.min(key.x1, r.x0) : key.x1;
    key.foot = (a + b) / 2;
  });
})();

// 位置 0 是第一个键之前的「起点」，站在键盘左端外侧。
export const footX = (pos) => (pos <= 0 ? -0.45 : KEYS[Math.min(pos, KEY_COUNT) - 1].foot);
