import { createStore } from '../src/store.js';
import { derive, keyAt, slotOf, countdownOfKey } from '../src/state.js';
import { hopPlan } from '../src/walk.js';
import { clampView, dragValue, settle, dayOfView, keyOfView } from '../src/scrub.js';
import { freqOfKey } from '../src/sound.js';
import { MOODS, moodById } from '../src/moods.js';
import { KEYS, WHITE_COUNT, footX } from '../src/keys.js';
import { beijing, dayIndexOf, dateKey, countdownFor, dateOfIndex, WEEKDAYS, weekGrid, indexOfKey } from '../src/time.js';

let fail = 0;
const ok = (c, msg) => {
  if (!c) { fail++; console.error('FAIL', msg); } else console.log('ok  ', msg);
};

// 几何
ok(KEYS.length === 88, '88 keys');
ok(WHITE_COUNT === 52, '52 white');
ok(KEYS.filter((k) => k.black).length === 36, '36 black');
ok(KEYS[0].midi === 21 && KEYS[87].midi === 108, 'A0..C8');
ok(KEYS.filter((k) => !k.black).slice(0, 3).map((k) => k.x0).join() === '0,1,2', 'whites contiguous');
let monotonic = true;
for (let i = 1; i < 88; i++) if (!(KEYS[i].foot > KEYS[i - 1].foot)) monotonic = false;
ok(monotonic, 'foot x strictly increases key by key');
const steps = [];
for (let p = 0; p < 88; p++) steps.push(footX(p + 1) - footX(p));
ok(Math.min(...steps.slice(1)) > 0.4 && Math.max(...steps.slice(1)) < 0.85, 'step range');
const blackNames = KEYS.filter((k) => k.black).slice(0, 5).map((k) => k.midi % 12);
ok(blackNames.join() === '10,1,3,6,8', 'black order A#0,C#1,D#1,F#1,G#1');

// 日期
const bj = (s) => beijing(Date.parse(s));
const idx = (s) => dayIndexOf(bj(s));
ok(idx('2026-11-06T00:00:00+08:00') === 0, '11/06 idx 0');
ok(countdownFor(idx('2026-11-06T09:00:00+08:00')) === 44, '11/06 -> 44');
ok(countdownFor(idx('2026-12-19T09:00:00+08:00')) === 1, '12/19 -> 01');
ok(countdownFor(idx('2026-12-20T09:00:00+08:00')) === 0, '12/20 -> 00');
ok(countdownFor(idx('2026-11-05T09:00:00+08:00')) === 44, 'before start -> 44');
ok(countdownFor(idx('2027-01-10T09:00:00+08:00')) === 0, 'after exam -> 00');
ok(idx('2026-11-05T16:30:00Z') === 0, 'UTC 16:30 = Beijing next day 00:30');
ok(dateKey(43) === '2026-12-19' && dateKey(44) === '2026-12-20', 'dateKey');
ok(indexOfKey('2026-11-16') === 10 && Number.isNaN(indexOfKey('bad')), 'indexOfKey');
ok(WEEKDAYS[dateOfIndex(0).wd] === '周五', '11/06 is Friday');

// 上午/下午与键位
ok(slotOf(0) === 'am' && slotOf(11.99) === 'am', '00:00-11:59 am');
ok(slotOf(12) === 'pm' && slotOf(23.99) === 'pm', '12:00-23:59 pm');
ok(keyAt(-1, 9) === 0 && keyAt(-5, 20) === 0, 'before start: key 0');
ok(keyAt(0, 8) === 1 && keyAt(0, 15) === 2, '11/06 am=1 pm=2');
ok(keyAt(43, 8) === 87 && keyAt(43, 15) === 88, '12/19 am=87 pm=88');
ok(keyAt(44, 8) === 88 && keyAt(60, 15) === 88, '12/20 and later = 88');
ok(countdownOfKey(0) === 44 && countdownOfKey(1) === 44 && countdownOfKey(2) === 44, 'keys 0-2 show 44');
ok(countdownOfKey(3) === 43 && countdownOfKey(87) === 1 && countdownOfKey(88) === 1, 'key 3 -> 43, 87/88 -> 01');

// derive
let st = derive(0, 8, 0);
ok(st.n === 44 && st.key === 1 && st.slot === 'am' && st.pending && st.canPick, 'first open: pending, can pick');
st = derive(0, 8, 1);
ok(!st.pending && !st.canPick, 'already at key: no pick');
st = derive(0, 15, 1);
ok(st.pending && st.canPick && st.slot === 'pm' && st.key === 2, 'afternoon: pick again');
st = derive(-1, 9, 0);
ok(st.n === 44 && st.key === 0 && !st.pending && st.slot === null, 'before start: nothing to do');
st = derive(44, 9, 40);
ok(st.n === 0 && st.key === 88 && st.pending && !st.canPick && st.slot === null, 'exam day: walk without picker');
st = derive(60, 9, 88);
ok(!st.pending && st.n === 0, 'after exam, finished');

// 缺席：seen=3，11/16 上午 → 21，共 18 步
st = derive(10, 8, 3);
ok(st.key === 21 && st.pending && st.canPick, 'absent: target key 21');
ok(hopPlan(3, st.key).steps === 18, 'absent: 18 steps');

// 逐半天推进，每步严格 +1
let seen = 0, good = true;
for (let d = 0; d < 44; d++) {
  for (const hr of [8, 15]) {
    const s = derive(d, hr, seen);
    if (!s.canPick || s.key !== seen + 1) good = false;
    seen = s.key;
  }
}
ok(good && seen === 88, '44 days x 2 = 88, every hop is exactly +1');

// hopPlan
let hp = hopPlan(5, 5);
ok(hp.steps === 0 && hp.totalMs === 0, 'hopPlan no move');
hp = hopPlan(0, 1);
ok(hp.steps === 1 && hp.perMs === 640, 'hopPlan 1 step = 640ms');
hp = hopPlan(0, 10);
ok(hp.perMs === 450 && hp.totalMs === 4500, 'hopPlan 10 steps ~4.5s');
hp = hopPlan(0, 88);
ok(hp.perMs === 90 && hp.totalMs === 88 * 90, 'hopPlan 88 steps floors at 90ms');
ok(hopPlan(9, 3).steps === 0, 'hopPlan never walks backwards');

// 周历
const wg = weekGrid();
ok(wg.blanks === 4 && wg.days.length === 44, 'week grid: 4 blanks, 44 days');

// 表情
ok(MOODS.length === 9, '9 moods');
ok(new Set(MOODS.map((m) => m.id)).size === 9, 'mood ids unique');
ok(new Set(MOODS.map((m) => m.color)).size === 9, 'mood colors unique');
ok(moodById('happy')?.zh === '开心' && moodById('nope') === null, 'moodById');

// 存储 v2
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
mem.set('88keys:v1', JSON.stringify({ v: 1, records: { '2026-11-06': { am: 1 } } }));
const p1 = createStore({ persistent: true });
ok(Object.keys(p1.moods()).length === 0 && p1.seen() === 0, 'v1 data ignored');
ok(mem.has('88keys:v1'), 'v1 data not deleted');
p1.setMood('2026-11-06', 'am', 'happy', 111);
p1.setMood('2026-11-06', 'am', 'calm', 222);
p1.setSeen(1);
const p2 = createStore({ persistent: true });
ok(p2.moods()['2026-11-06'].am.m === 'calm' && p2.moods()['2026-11-06'].am.t === 222, 'mood overwrite survives reload');
ok(p2.seen() === 1 && p2.reviewed() === false, 'seen survives reload');
p2.markReviewed();
ok(createStore({ persistent: true }).reviewed() === true, 'reviewed survives reload');
mem.set('88keys:v2', '{bad json');
ok(createStore({ persistent: true }).seen() === 0, 'corrupt data falls back to empty');
mem.set('88keys:v2', JSON.stringify({ v: 2, moods: {}, seen: 999, reviewed: false }));
ok(createStore({ persistent: true }).seen() === 0, 'out-of-range seen rejected');
mem.delete('88keys:v2');
const dev = createStore({ persistent: false });
dev.setMood('2026-11-07', 'am', 'happy', 1);
dev.setSeen(5);
ok(!mem.has('88keys:v2'), 'non-persistent store never writes localStorage');

// 回看：只能往过去拨，不能越过「现在」
ok(clampView(10, 30) === 30 && clampView(35, 30) === 35 && clampView(99, 30) === 44, 'clampView stays within [live, 44]');
ok(dragValue(29, 30) > 29.5 && dragValue(-50, 30) >= 29.6, 'future drag only rubber-bands <0.4');
ok(dragValue(45, 30) <= 44.4 && dragValue(35.5, 30) === 35.5, 'past drag is linear inside range');
ok(settle(36.4, 0, 30) === 36 && settle(36.4, 10, 30) === 38, 'settle rounds with inertia');
ok(settle(30.2, -50, 30) === 30 && settle(43.9, 50, 30) === 44, 'settle never crosses now or the first day');
ok(dayOfView(44) === 0 && dayOfView(40) === 4, 'view n maps to day index');
ok(keyOfView(44) === 2 && keyOfView(40) === 10 && keyOfView(1) === 88, 'view key is that day PM key');

// 声音：第 1 键 A0 = 27.5Hz，第 49 键 A4 = 440Hz，第 88 键 C8
ok(freqOfKey(1) === 27.5 && Math.abs(freqOfKey(49) - 440) < 1e-9, 'A0 27.5Hz and A4 440Hz');
ok(Math.abs(freqOfKey(88) - 4186.01) < 0.01 && Math.abs(freqOfKey(13) / freqOfKey(1) - 2) < 1e-9, 'C8 4186Hz and octave doubles');

console.log(fail ? `\n${fail} failed` : '\nall passed');
process.exit(fail ? 1 : 0);
