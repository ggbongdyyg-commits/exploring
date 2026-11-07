import { DAYS } from './config.js';

// 倒计时数字 n 越大越靠过去。live 是「现在」的数字，只能往 live 到 DAYS 之间拨。
export const clampView = (n, live) => Math.max(live, Math.min(DAYS, n));

// 手指拖动时的取值：越过「现在」或最早一天时只有一点点弹性，松手会回弹。
export function dragValue(raw, live) {
  if (raw < live) return live - Math.min(0.4, (live - raw) * 0.3);
  if (raw > DAYS) return DAYS + Math.min(0.4, (raw - DAYS) * 0.3);
  return raw;
}

// 松手后停在哪一天：带一点惯性，结果始终落在 [live, DAYS]。
export const settle = (value, velocity, live) => clampView(Math.round(value + velocity * 0.12), live);

export const dayOfView = (n) => DAYS - n;

// 回看某天时，小人站到那天下午对应的键。
export const keyOfView = (n) => Math.min(88, 2 * (DAYS - n) + 2);
