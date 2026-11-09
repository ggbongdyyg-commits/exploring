import { TZ_OFFSET_HOURS } from './config.js';

const DAY_MS = 86400000;
export const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const pad = (n) => String(n).padStart(2, '0');

// 日序号 = 北京时间下，自 1970-01-01 起的天数。
export const dayNumAt = (ms) => Math.floor((ms + TZ_OFFSET_HOURS * 3600e3) / DAY_MS);

export function parts(n) {
  const t = new Date(n * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay() };
}

export const keyOf = (n) => {
  const p = parts(n);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
};

export function numOfKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
  if (!m) return NaN;
  const n = Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY_MS);
  return keyOf(n) === key ? n : NaN;
}

export const mdText = (n) => {
  const p = parts(n);
  return `${pad(p.m)}.${pad(p.d)}`;
};
export const weekdayText = (n) => WEEKDAYS[parts(n).wd];
export const fullText = (n) => `${parts(n).y}.${mdText(n)} ${weekdayText(n)}`;
