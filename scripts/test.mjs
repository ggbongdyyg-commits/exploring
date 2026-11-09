import assert from 'node:assert/strict';
import { dayNumAt, keyOf, numOfKey, mdText, weekdayText, fullText } from '../src/time.js';
import { status, sortItems, needPrompt, cellsOf, gridFor, monthsOf, validate, monthGrid } from '../src/model.js';
import { createStore } from '../src/store.js';
import { MOODS } from '../src/moods.js';

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok  ' + name); };

t('日序号按北京时间换日', () => {
  const ms = Date.UTC(2026, 10, 8, 16, 0, 0); // 北京 11-09 00:00
  assert.equal(keyOf(dayNumAt(ms)), '2026-11-09');
  assert.equal(keyOf(dayNumAt(ms - 1)), '2026-11-08');
});

t('日期键往返与非法输入', () => {
  const d = numOfKey('2026-12-20');
  assert.equal(keyOf(d), '2026-12-20');
  assert.ok(Number.isNaN(numOfKey('2026-02-30')));
  assert.ok(Number.isNaN(numOfKey('')));
  assert.equal(mdText(d), '12.20');
  assert.equal(weekdayText(numOfKey('2026-11-09')), '周一');
  assert.equal(fullText(numOfKey('2026-11-09')), '2026.11.09 周一');
});

const T0 = numOfKey('2026-11-09');
const item = { id: 'a', name: '考试', start: '2026-11-09', target: '2026-11-19' };

t('status：进行中、当天、结束', () => {
  assert.deepEqual(status(item, T0), { start: T0, target: T0 + 10, total: 10, idx: 0, left: 10, ended: false, onTarget: false });
  const s = status(item, T0 + 10);
  assert.equal(s.left, 0); assert.ok(s.onTarget); assert.ok(!s.ended);
  assert.ok(status(item, T0 + 11).ended);
});

t('sortItems：最近的在前，已结束单独分组', () => {
  const b = { id: 'b', name: 'b', start: '2026-11-01', target: '2026-11-12' };
  const c = { id: 'c', name: 'c', start: '2026-10-01', target: '2026-11-05' };
  const { active, ended } = sortItems([item, b, c], T0);
  assert.deepEqual(active.map((x) => x.id), ['b', 'a']);
  assert.deepEqual(ended.map((x) => x.id), ['c']);
});

t('needPrompt：今天没记且没跳过才弹', () => {
  const k = keyOf(T0);
  assert.ok(needPrompt(item, T0, {}, null));
  assert.ok(!needPrompt(item, T0, { [k]: { m: 'happy' } }, null));
  assert.ok(!needPrompt(item, T0, {}, k));
  assert.ok(needPrompt(item, T0, {}, keyOf(T0 - 1)));
  assert.ok(!needPrompt(item, T0 + 11, {}, null));
});

t('cellsOf：格数、种类与结束后的目标日', () => {
  const moods = { [keyOf(T0)]: { m: 'happy' } };
  const cells = cellsOf(item, T0 + 2, moods);
  assert.equal(cells.length, 11);
  assert.equal(cells[0].k, 'mood');
  assert.equal(cells[1].k, 'skip');
  assert.equal(cells[2].k, 'today');
  assert.equal(cells[3].k, 'future');
  assert.equal(cells[10].k, 'goal');
  const done = cellsOf(item, T0 + 20, moods);
  assert.equal(done[10].k, 'goal');
  assert.ok(done.slice(1, 10).every((c) => c.k === 'skip'));
});

t('gridFor：容纳所有格子且不超出上限', () => {
  for (const N of [2, 11, 48, 90, 220, 366]) {
    const g = gridFor(N, 346, 260);
    assert.ok(g.c * g.r >= N, `N=${N}`);
    assert.ok(g.s <= 56);
    assert.ok(g.c * g.s <= 346 + 1e-6 && g.r * g.s <= 260 + 1e-6, `N=${N}`);
  }
});

t('cellsOf：今天及以前的格子可点，未来不可点', () => {
  const cells = cellsOf(item, T0 + 2, {});
  assert.deepEqual(cells.map((c) => c.tap), cells.map((_, i) => i <= 2));
  assert.equal(cells[4].n, T0 + 4);
  const done = cellsOf(item, T0 + 20, {});
  assert.ok(done.every((c) => c.tap));
});

t('monthGrid：周一起的前置空格与天数', () => {
  assert.deepEqual([monthGrid(2026, 11).lead, monthGrid(2026, 11).days], [6, 30]);
  assert.deepEqual([monthGrid(2027, 2).lead, monthGrid(2027, 2).days], [0, 28]);
  assert.equal(monthGrid(2026, 12).days, 31);
  assert.equal(monthGrid(2028, 2).days, 29);
});

t('monthsOf：周一起的前置空格与总天数', () => {
  const it = { id: 'x', name: 'x', start: '2026-11-06', target: '2026-12-20' };
  const ms = monthsOf(it);
  assert.equal(ms.length, 2);
  assert.equal(ms[0].lead, 4); // 11-06 周五
  assert.equal(ms.reduce((s, m) => s + m.days.length, 0), 45);
});

t('validate：名称、日期、范围', () => {
  assert.equal(validate({ name: ' ', target: '2026-12-01' }, T0), 'name');
  assert.equal(validate({ name: 'a', target: '' }, T0), 'date');
  assert.equal(validate({ name: 'a', target: keyOf(T0) }, T0), 'range');
  assert.equal(validate({ name: 'a', target: keyOf(T0 + 1) }, T0), null);
  assert.equal(validate({ name: 'a', target: keyOf(T0 + 3) }, T0, T0 + 5), 'range');
});

t('store：增删改，改目标不清心情，删除清心情', () => {
  const s = createStore({ persistent: false });
  const a = s.add({ name: ' 考研 ', target: '2026-12-20' }, '2026-11-09');
  assert.equal(a.name, '考研');
  s.setMood(a.id, '2026-11-09', 'happy', 1);
  s.update(a.id, { name: '考研二战', target: '2027-01-01' });
  assert.equal(s.item(a.id).start, '2026-11-09');
  assert.equal(s.moods(a.id)['2026-11-09'].m, 'happy');
  s.remove(a.id);
  assert.equal(s.item(a.id), null);
  assert.deepEqual(s.moods(a.id), {});
});

t('store：心情按项目隔离，同日覆盖', () => {
  const s = createStore({ persistent: false });
  const a = s.add({ name: 'a', target: '2026-12-20' }, '2026-11-09');
  const b = s.add({ name: 'b', target: '2026-12-21' }, '2026-11-09');
  s.setMood(a.id, '2026-11-09', 'sad', 1);
  s.setMood(a.id, '2026-11-09', 'calm', 2);
  assert.equal(s.moods(a.id)['2026-11-09'].m, 'calm');
  assert.deepEqual(s.moods(b.id), {});
});

t('store：非持久模式不写 localStorage', () => {
  const calls = [];
  globalThis.localStorage = { getItem: () => null, setItem: (...a) => calls.push(a), removeItem() {} };
  const s = createStore({ persistent: false });
  s.add({ name: 'a', target: '2026-12-20' }, '2026-11-09');
  assert.equal(calls.length, 0);
  assert.equal(s.persistent, false);
});

t('store：持久模式写入并可重新读回', () => {
  const mem = {};
  globalThis.localStorage = {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = v; },
    removeItem: (k) => { delete mem[k]; },
  };
  const s1 = createStore({ persistent: true });
  const a = s1.add({ name: 'a', target: '2026-12-20' }, '2026-11-09');
  s1.setMood(a.id, '2026-11-09', 'happy', 1);
  s1.markAsked(a.id, '2026-11-09');
  const s2 = createStore({ persistent: true });
  assert.equal(s2.items().length, 1);
  assert.equal(s2.moods(a.id)['2026-11-09'].m, 'happy');
  assert.equal(s2.asked(a.id), '2026-11-09');
  mem['countdown:v1'] = '{坏数据';
  assert.equal(createStore({ persistent: true }).items().length, 0);
  delete globalThis.localStorage;
});

t('store：localStorage 不可用时退回内存', () => {
  globalThis.localStorage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() {} };
  const s = createStore({ persistent: true });
  assert.equal(s.persistent, false);
  s.add({ name: 'a', target: '2026-12-20' }, '2026-11-09');
  assert.equal(s.items().length, 1);
  delete globalThis.localStorage;
});

t('表情：9 个，id 与颜色唯一', () => {
  assert.equal(MOODS.length, 9);
  assert.equal(new Set(MOODS.map((m) => m.id)).size, 9);
  assert.equal(new Set(MOODS.map((m) => m.color)).size, 9);
});

console.log(`\n${n} 项通过`);
