import { CATCHUP_MS, HOP_MS, HOP_MIN_MS } from './config.js';

// 从 from 键逐键跳到 to 键：步数与单步时长。步数越多单步越快，总时长约 CATCHUP_MS。
export function hopPlan(from, to) {
  const steps = Math.max(0, to - from);
  if (!steps) return { steps: 0, perMs: 0, totalMs: 0 };
  const perMs = Math.max(HOP_MIN_MS, Math.min(HOP_MS, Math.floor(CATCHUP_MS / steps)));
  return { steps, perMs, totalMs: steps * perMs };
}
