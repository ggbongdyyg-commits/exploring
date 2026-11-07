import { TZ_OFFSET_HOURS, START, DAYS } from './config.js';

const DAY_MS = 86400000;
const dayNum = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
const START_NUM = dayNum(START.y, START.m, START.d);
const pad = (n) => String(n).padStart(2, '0');

export function beijing(ms) {
  const t = new Date(ms + TZ_OFFSET_HOURS * 3600e3);
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
    hour: t.getUTCHours() + t.getUTCMinutes() / 60,
  };
}

export const dayIndexOf = (p) => dayNum(p.y, p.m, p.d) - START_NUM;

export function dateOfIndex(i) {
  const t = new Date((START_NUM + i) * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay() };
}

export function dateKey(i) {
  const o = dateOfIndex(i);
  return `${o.y}-${pad(o.m)}-${pad(o.d)}`;
}

export function indexOfKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  return m ? dayNum(+m[1], +m[2], +m[3]) - START_NUM : NaN;
}

export const countdownFor = (idx) => (idx < 0 ? DAYS : idx >= DAYS ? 0 : DAYS - idx);
export const isJourneyDay = (idx) => idx >= 0 && idx < DAYS;
export const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 周一起的周历：前置空格数 + 每天的日序号。
export function weekGrid() {
  const blanks = (dateOfIndex(0).wd + 6) % 7;
  return { blanks, days: Array.from({ length: DAYS }, (_, i) => i) };
}
