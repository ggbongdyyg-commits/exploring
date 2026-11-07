import { beijing, dayIndexOf, dateKey, dateOfIndex, WEEKDAYS } from './time.js';
import { DAYS } from './config.js';
import { createStore } from './store.js';
import { derive, countdownOfKey } from './state.js';
import { hopPlan } from './walk.js';
import { metrics, bodyPath } from './layout.js';
import { createArc } from './arc.js';
import { createPiano } from './piano.js';
import { installSprite, moodById, moodIcon } from './moods.js';
import { createPicker } from './pick.js';
import { createReview } from './review.js';
import { playKey, unlockOnGesture } from './sound.js';
import { clampView, dragValue, settle, keyOfView, dayOfView } from './scrub.js';

const $ = (id) => document.getElementById(id);
const DEV = /(^|[?&])dev(=|&|$)/.test(location.search) || location.hash === '#dev';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');

installSprite();
unlockOnGesture();
const stage = $('stage');
const chip = $('chip');
const trail = $('trail');
const grab = $('grab');
const sr = $('sr');
const arc = createArc({ svg: $('arc'), nums: $('nums'), label: $('label') });
const piano = createPiano({ kb: $('kb'), track: $('track'), walker: $('walker') });
const store = createStore({ persistent: !DEV });
const picker = createPicker($('pick'));

// 时钟：正式模式取北京时间；调试模式由面板接管。
let simulated = null;
const now = () => {
  if (simulated) return simulated;
  const b = beijing(Date.now());
  return { idx: dayIndexOf(b), hour: b.hour };
};
const read = () => {
  const t = now();
  return derive(t.idx, t.hour, store.seen());
};
const canEditSlot = (idx, slot) => {
  const t = now();
  return idx < t.idx || (idx === t.idx && (slot === 'am' || t.hour >= 12));
};
const review = createReview($('review'), {
  getMoods: () => store.moods(),
  getTodayIdx: () => now().idx,
  canEdit: canEditSlot,
  onEdit: (idx, slot) => editAt(idx, slot),
});

let state = read();
let walking = false;
let prompting = false;
let run = 0;
let walkGoal = 0;
let walkN = 0;
let viewN = null; // 正在回看的倒计时数字；null 表示停在「现在」
let drag = null;
let pxDay = 70;

const scrubbing = () => viewN !== null;
const slotName = (s) => (s === 'am' ? '上午' : '下午');
const dayLabel = (idx, slot) => {
  const o = dateOfIndex(idx);
  return `${pad(o.m)}.${pad(o.d)} ${WEEKDAYS[o.wd]} ${slotName(slot)}`;
};

function paintChip() {
  const show = !!state.slot && !state.pending && !walking && !scrubbing();
  chip.hidden = !show;
  if (!show) return;
  const rec = store.moods()[dateKey(now().idx)]?.[state.slot];
  const m = rec && moodById(rec.m);
  chip.innerHTML = m ? moodIcon(m.id) : '<i class="plus"></i>';
  chip.setAttribute('aria-label', m ? `此刻心情：${m.zh}，点按修改` : '记录此刻的心情');
}

function paintTrail(n) {
  const i = dayOfView(n);
  const rec = store.moods()[dateKey(i)] || {};
  const face = (r) => {
    const m = r && moodById(r.m);
    return m ? moodIcon(m.id) : '<i class="ring"></i>';
  };
  const name = (r) => (r && moodById(r.m)?.zh) || '没有记录';
  const day = dayLabel(i, 'am').slice(0, 8);
  const btn = (slot, r) => `<button type="button" data-slot="${slot}" aria-label="${day} ${slotName(slot)}${name(r)}，点按改选">${face(r)}</button>`;
  trail.innerHTML = btn('am', rec.am) + btn('pm', rec.pm);
}

// 回看某一天：只移动琴键轨道和下方的两个表情，不碰小人真正所在的键与存档。
function setView(n) {
  if (n <= state.n) {
    viewN = null;
    trail.hidden = true;
    piano.look(piano.pos);
  } else {
    viewN = n;
    trail.hidden = false;
    paintTrail(n);
    piano.look(keyOfView(n));
  }
  paintChip();
}

function leaveScrub() {
  if (!scrubbing()) return;
  setView(state.n);
  arc.to(state.n, { ms: 360, immediate: reduce() });
}

// 要走新的一步之前，把画面恢复到存档里的位置。
function dropScrub() {
  if (!scrubbing()) return;
  viewN = null;
  trail.hidden = true;
  piano.place(piano.pos);
  arc.render(countdownOfKey(store.seen()));
  paintChip();
}

// 小人从当前键一键一键走到 key，倒计时在整段时长内滚完。
async function walkTo(key, n) {
  const from = piano.pos;
  if (key <= from) return;
  const my = ++run;
  const plan = hopPlan(from, key);
  walking = true;
  walkGoal = key;
  walkN = n;
  paintChip();
  arc.to(n, { ms: plan.totalMs, immediate: reduce() });
  for (let k = from + 1; k <= key; k++) {
    await piano.step(k, plan.perMs, { linear: plan.steps > 1, onLand: () => playKey(k) });
    if (my !== run) return;
    store.setSeen(k);
  }
  walking = false;
  paintChip();
}

function skipWalk() {
  if (!walking) return;
  run++;
  walking = false;
  piano.place(walkGoal);
  arc.to(walkN, { immediate: true });
  store.setSeen(walkGoal);
  evaluate();
}

async function ask(opts) {
  prompting = true;
  const r = await picker.open(opts);
  prompting = false;
  return r;
}

async function evaluate() {
  if (walking || prompting || drag) return;
  state = read();
  const t = now();
  if (scrubbing() && state.pending) dropScrub();
  if (!state.pending) {
    if (scrubbing() && viewN <= state.n) leaveScrub();
    else if (!scrubbing() && arc.value !== state.n) arc.to(state.n, { immediate: reduce() });
    paintChip();
    if (t.idx >= DAYS && state.key >= 88 && !store.reviewed()) {
      store.markReviewed();
      review.open();
    }
    return;
  }
  if (state.canPick) {
    paintChip();
    const snap = { idx: t.idx, slot: state.slot, key: state.key, n: state.n };
    const r = await ask({ heading: '此刻，你感觉怎么样？', subtitle: dayLabel(snap.idx, snap.slot) });
    if (!r) return;
    if (r.id) {
      store.setMood(dateKey(snap.idx), snap.slot, r.id, Date.now());
      sr.textContent = `已记录心情：${moodById(r.id).zh}`;
    }
    await walkTo(snap.key, snap.n);
  } else {
    await walkTo(state.key, state.n);
  }
  evaluate();
}

async function editAt(idx, slot) {
  if (walking || prompting || !canEditSlot(idx, slot)) return;
  const cur = store.moods()[dateKey(idx)]?.[slot]?.m || null;
  const r = await ask({ heading: '想换一个心情吗？', subtitle: dayLabel(idx, slot), current: cur, skipLabel: '就这样吧' });
  if (r?.id) {
    store.setMood(dateKey(idx), slot, r.id, Date.now());
    sr.textContent = `已记录心情：${moodById(r.id).zh}`;
  }
  state = read();
  paintChip();
  if (scrubbing()) paintTrail(viewN);
}

const editMood = () => { if (state.slot && !scrubbing()) editAt(now().idx, state.slot); };

chip.addEventListener('click', editMood);
trail.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !scrubbing()) return;
  editAt(dayOfView(viewN), b.dataset.slot);
});

// 用手拨动圆环回看：手指往上推，数字变大（更早的日子）；不能拨过「现在」。
grab.addEventListener('pointerdown', (e) => {
  if (walking || prompting || review.isOpen || state.pending || drag) return;
  arc.to(arc.value, { immediate: true });
  grab.setPointerCapture(e.pointerId);
  drag = { id: e.pointerId, y0: e.clientY, v0: arc.value, near: viewN ?? state.n, v: arc.value, pts: [[e.timeStamp, e.clientY]] };
});
grab.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  drag.v = dragValue(drag.v0 - (e.clientY - drag.y0) / pxDay, state.n);
  arc.render(drag.v);
  drag.pts.push([e.timeStamp, e.clientY]);
  if (drag.pts.length > 8) drag.pts.shift();
  const near = clampView(Math.round(drag.v), state.n);
  if (near !== drag.near) {
    drag.near = near;
    setView(near);
  }
});
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { v, pts } = drag;
  drag = null;
  const [t1, y1] = pts[pts.length - 1];
  const [t0, y0] = pts.find(([t]) => t1 - t <= 100) || pts[0];
  const vel = t1 > t0 ? (-(y1 - y0) / pxDay / (t1 - t0)) * 1000 : 0;
  const target = settle(v, vel, state.n);
  setView(target);
  arc.to(target, { ms: 280, immediate: reduce() });
}
grab.addEventListener('pointerup', endDrag);
grab.addEventListener('pointercancel', endDrag);
$('peek').addEventListener('click', () => review.open());
stage.addEventListener('click', skipWalk);

function layout() {
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  if (!W || !H) return;
  const mt = metrics(W, H);
  stage.style.setProperty('--btn', `${mt.btn}px`);
  const body = $('body');
  body.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const d = bodyPath(W, H);
  const rim = Math.max(3, mt.u * 0.012);
  body.innerHTML = `<path d="${d}" fill="#4b504e" transform="translate(0,${-rim})"/><path d="${d}" fill="#1b1c1c"/>`;
  chip.style.left = `${mt.btnLeft + mt.btn + mt.gap}px`;
  chip.style.top = `${mt.btnTop}px`;
  trail.style.left = `${mt.btnLeft}px`;
  trail.style.top = `${mt.btnTop}px`;
  trail.style.width = `${mt.btn * 2 + mt.gap}px`;
  trail.style.height = `${mt.btn}px`;
  trail.style.gap = `${mt.gap}px`;
  pxDay = mt.u * 0.17;
  grab.style.top = `${Math.max(60, mt.cy - mt.R * 0.75)}px`;
  grab.style.height = `${mt.R * 1.5}px`;
  grab.style.width = `${mt.cx + mt.R + mt.off + mt.fs * 1.3}px`;
  $('hatch').style.height = `${mt.cy + mt.R * 0.5}px`;
  const top = 52;
  picker.layout({ top, height: Math.max(200, mt.kbTop - mt.figH - 6 - top) });
  arc.layout(mt);
  piano.layout(mt);
  if (scrubbing()) piano.look(keyOfView(viewN), { instant: true });
}

new ResizeObserver(layout).observe(stage);
layout();

// 调试面板必须先于首次 evaluate 接管时钟，否则首轮会按真实时间弹面板。
if (DEV) {
  const { createDev } = await import('./dev.js');
  createDev({
    stage,
    store,
    picker,
    review,
    getClock: now,
    setClock: (t) => { simulated = t; },
    read,
    evaluate,
    isBusy: () => walking || prompting,
    reset: () => {
      run++;
      walking = false;
      dropScrub();
      picker.close();
      review.close();
      store.clear();
      piano.place(0);
      arc.render(countdownOfKey(0));
    },
    jumpTo: (key, n) => {
      run++;
      walking = false;
      dropScrub();
      picker.close();
      piano.place(key);
      arc.render(n);
      store.setSeen(key);
    },
  });
}

// 按上次停的键摆好小人和倒计时，再决定弹面板还是自动补跳。
piano.place(store.seen());
arc.render(countdownOfKey(store.seen()));
evaluate();

// 跨天、跨时段：每 30 秒与回到前台时重新计算。
const tick = () => { if (!simulated) evaluate(); };
setInterval(tick, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
