import { STORAGE_KEY } from './config.js';

// 数据结构：
// { v: 2, moods: { 'YYYY-MM-DD': { am: { m: 表情id, t: 毫秒时间戳 }, pm: {...} } }, seen: 键号, reviewed: bool }
export function createStore({ persistent }) {
  let moods = {};
  let seen = 0;
  let reviewed = false;
  if (persistent) {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (raw && raw.v === 2) {
        if (raw.moods && typeof raw.moods === 'object') moods = raw.moods;
        if (Number.isInteger(raw.seen) && raw.seen >= 0 && raw.seen <= 88) seen = raw.seen;
        reviewed = raw.reviewed === true;
      }
    } catch (e) {
      moods = {};
    }
  }
  const save = () => {
    if (!persistent) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, moods, seen, reviewed }));
    } catch (e) {
      /* 存储不可用时仍保持本次会话内可用 */
    }
  };
  return {
    moods: () => moods,
    setMood(key, slot, id, ts) {
      const day = moods[key] || (moods[key] = {});
      day[slot] = { m: id, t: ts };
      save();
    },
    seen: () => seen,
    setSeen(k) {
      seen = k;
      save();
    },
    reviewed: () => reviewed,
    markReviewed() {
      reviewed = true;
      save();
    },
    clear() {
      moods = {};
      seen = 0;
      reviewed = false;
      save();
    },
  };
}
