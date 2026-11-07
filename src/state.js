import { DAYS, KEY_COUNT, NOON } from './config.js';
import { countdownFor, isJourneyDay } from './time.js';

export const slotOf = (hour) => (hour < NOON ? 'am' : 'pm');

// 当前北京时间对应小人应站的键：上午 2d+1，下午 2d+2。
export function keyAt(idx, hour) {
  if (idx < 0) return 0;
  if (idx >= DAYS) return KEY_COUNT;
  return 2 * idx + (slotOf(hour) === 'am' ? 1 : 2);
}

// 站在第 k 键时屏幕上的倒计时。
export const countdownOfKey = (k) => (k <= 0 ? DAYS : DAYS - Math.floor((k - 1) / 2));

// 纯函数：由「第几天、几点、小人上次站的键」推出界面状态。
export function derive(idx, hour, seen) {
  const key = keyAt(idx, hour);
  const pending = seen < key;
  return {
    n: countdownFor(idx),
    key,
    slot: isJourneyDay(idx) ? slotOf(hour) : null,
    pending,
    canPick: pending && isJourneyDay(idx),
  };
}
