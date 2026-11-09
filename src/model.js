import { numOfKey, keyOf, parts, pad } from './time.js';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function status(it, today) {
  const start = numOfKey(it.start), target = numOfKey(it.target);
  const total = Math.max(1, target - start);
  const idx = Math.max(0, today - start);
  return {
    start, target, total, idx,
    left: Math.max(0, target - today),
    ended: today > target,
    onTarget: today === target,
  };
}

export function sortItems(items, today) {
  const active = [], ended = [];
  items.forEach((it) => (status(it, today).ended ? ended : active).push(it));
  active.sort((a, b) => numOfKey(a.target) - numOfKey(b.target));
  ended.sort((a, b) => numOfKey(b.target) - numOfKey(a.target));
  return { active, ended };
}

export const canPick = (it, today) => {
  const s = status(it, today);
  return today >= s.start && today <= s.target;
};

// 打开详情页时是否要弹心情面板：在旅程内、今天还没记、也没跳过。
export const needPrompt = (it, today, moods, asked) =>
  canPick(it, today) && !moods[keyOf(today)] && asked !== keyOf(today);

// 点阵：start 到 target 每天一格。n 是日序号，tap 表示今天及以前的格子都可以改心情。
export function cellsOf(it, today, moods) {
  const s = status(it, today), cells = [];
  for (let i = 0; i <= s.total; i++) {
    const n = s.start + i, rec = moods[keyOf(n)];
    let c;
    if (i < s.idx || s.ended) {
      if (rec) c = { k: 'mood', id: rec.m };
      else c = { k: i === s.total ? 'goal' : 'skip' };
    } else if (i === s.idx) c = { k: 'today', id: rec ? rec.m : null };
    else if (i === s.total) c = { k: 'goal' };
    else c = { k: 'future' };
    cells.push({ ...c, n, tap: n <= today });
  }
  return cells;
}

// 某年某月的日历网格：lead 为周一起的前置空格数，days 为当月天数。
export function monthGrid(y, m) {
  const first = numOfKey(`${y}-${pad(m)}-01`);
  const next = numOfKey(m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`);
  return { first, lead: (parts(first).wd + 6) % 7, days: next - first };
}

// 在 w×h 的区域里挑列数 4..24，使格子最大；格子最大 56px。
export function gridFor(N, w, h, maxCell = 56) {
  let best = null;
  for (let c = 4; c <= 24; c++) {
    const r = Math.ceil(N / c), s = Math.min(w / c, h / r, maxCell);
    if (!best || s > best.s + 1e-9) best = { c, r, s };
  }
  return { ...best, x0: (w - best.c * best.s) / 2, y0: 0 };
}

// 回看页：按月分组，周一起。
export function monthsOf(it) {
  const start = numOfKey(it.start), target = numOfKey(it.target), out = [];
  for (let n = start; n <= target; n++) {
    const p = parts(n), id = `${p.y}-${pad(p.m)}`;
    let g = out[out.length - 1];
    if (!g || g.id !== id) {
      g = { id, y: p.y, m: p.m, lead: (p.wd + 6) % 7, days: [] };
      out.push(g);
    }
    g.days.push({ n, key: keyOf(n), d: p.d });
  }
  return out;
}

export function validate({ name, target }, today, minTarget) {
  if (!String(name || '').trim()) return 'name';
  const t = numOfKey(target);
  if (Number.isNaN(t)) return 'date';
  if (t < (minTarget === undefined ? today + 1 : minTarget)) return 'range';
  return null;
}
