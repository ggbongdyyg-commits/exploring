import { WHITE_COUNT } from './keys.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// 由舞台宽高推出所有尺寸。u 是 390×844 基准下的统一比例尺。
export function metrics(W, H) {
  const u = Math.min(W, H * 0.462);
  const kbH = clamp(H * 0.205, 124, u * 0.46);
  const kbTop = H - kbH;
  const figH = u * 0.14;
  const btn = clamp(u * 0.145, 50, 62);
  const gap = Math.round(btn * 0.28);
  const rowW = btn * 2 + gap;
  const btnLeft = Math.max(W * 0.5, Math.min(W * 0.608, W - u * 0.06 - rowW));
  const edgeR = H * 0.675; // 钢琴盖右端的高度
  return {
    W, H, u, kbH, kbTop,
    w: W / 9.5, // 白键宽
    figX: W * 0.37,
    figH, figW: (figH * 24) / 56,
    btn, gap, btnLeft,
    btnTop: (edgeR + kbTop) / 2 - btn / 2,
    // 弧线：圆心在屏幕左外侧，尺寸比例取自参考图 A
    cx: -0.2816 * u, cy: H * 0.32, R: 0.5777 * u, off: 0.065 * u,
    fs: u * 0.17,
    whiteTotal: WHITE_COUNT,
  };
}

// 钢琴盖轮廓：左侧隆起、向右缓缓下滑，呼应参考图 B 的曲线。
export function bodyPath(W, H) {
  const X = (f) => (f * W).toFixed(1);
  const Y = (f) => (f * H).toFixed(1);
  return (
    `M0 ${Y(0.62)} C${X(0.1)} ${Y(0.57)} ${X(0.3)} ${Y(0.55)} ${X(0.5)} ${Y(0.62)} ` +
    `S${X(0.88)} ${Y(0.72)} ${X(1)} ${Y(0.675)} L${W} ${H} L0 ${H} Z`
  );
}
