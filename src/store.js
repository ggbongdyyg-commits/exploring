import { STORAGE_KEY } from './config.js';
import { uid } from './model.js';

const blank = () => ({ v: 1, items: [], moods: {}, asked: {}, reviewed: {}, shown: {} });

function sanitize(raw) {
  const s = blank();
  if (!raw || raw.v !== 1 || !Array.isArray(raw.items)) return s;
  s.items = raw.items.filter((it) => it && it.id && it.name && it.start && it.target);
  const ids = new Set(s.items.map((it) => it.id));
  for (const k of ['moods', 'asked', 'reviewed', 'shown']) {
    const src = raw[k] && typeof raw[k] === 'object' ? raw[k] : {};
    for (const id of Object.keys(src)) if (ids.has(id)) s[k][id] = src[id];
  }
  return s;
}

function storageOk() {
  try {
    const k = '__t';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch { return false; }
}

// 小程序里可以把这个模块整体换成走云端的实现，接口保持不变。
export function createStore({ persistent }) {
  const canSave = persistent && storageOk();
  let data = blank();
  if (canSave) {
    try { data = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { data = blank(); }
  }
  const save = () => {
    if (!canSave) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* 空间满或被禁用时忽略 */ }
  };
  const slot = (k, id) => data[k][id] || (data[k][id] = {});

  return {
    persistent: canSave,
    items: () => data.items.slice(),
    item: (id) => data.items.find((it) => it.id === id) || null,
    add({ name, target }, startKey) {
      const it = { id: uid(), name: name.trim(), start: startKey, target };
      data.items.push(it);
      save();
      return it;
    },
    update(id, { name, target }) {
      const it = data.items.find((x) => x.id === id);
      if (!it) return null;
      it.name = name.trim();
      it.target = target;
      save();
      return it;
    },
    remove(id) {
      data.items = data.items.filter((it) => it.id !== id);
      for (const k of ['moods', 'asked', 'reviewed', 'shown']) delete data[k][id];
      save();
    },
    moods: (id) => data.moods[id] || {},
    setMood(id, dateKey, m, ts) {
      slot('moods', id)[dateKey] = { m, t: ts };
      save();
    },
    asked: (id) => data.asked[id] || null,
    markAsked(id, dateKey) { data.asked[id] = dateKey; save(); },
    reviewed: (id) => !!data.reviewed[id],
    markReviewed(id) { data.reviewed[id] = true; save(); },
    shown: (id) => (typeof data.shown[id] === 'number' ? data.shown[id] : null),
    setShown(id, n) { data.shown[id] = n; save(); },
    replaceAll(raw) { data = sanitize(raw); save(); },
    clear() { data = blank(); save(); },
  };
}
