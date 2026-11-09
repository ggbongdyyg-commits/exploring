import { createDial } from './dial.js';
import { renderDots } from './dots.js';
import { cellsOf, status, needPrompt } from './model.js';
import { keyOf, mdText, weekdayText, fullText } from './time.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// 详情页：滚轮 + 点阵。返回控制器，离开页面时调用 destroy()。
export function mountDetail(root, ctx) {
  const { id, store, now, picker, review, form, goBack, onGone } = ctx;
  let alive = true, fresh = null, dial = null, ro = null;

  const item = () => store.item(id);
  const today = () => now();

  root.innerHTML = `<div class="hatch"></div><div id="dial"></div><div id="label"><b></b><i></i></div>
<button type="button" id="goal" aria-label="编辑倒计时"><b></b><i></i></button>
<button type="button" id="back" aria-label="返回"></button>
<button type="button" id="peek" aria-label="心情回看"><span></span></button>
<div id="dots"></div>`;
  const $ = (s) => root.querySelector(s);
  dial = createDial($('#dial'));

  function header() {
    const it = item(), t = today(), s = status(it, t);
    $('#goal b').textContent = it.name;
    $('#goal i').textContent = fullText(s.target);
    $('#label b').textContent = mdText(t);
    $('#label i').textContent = weekdayText(t);
  }

  function paintDots() {
    const it = item(), t = today(), s = status(it, t);
    renderDots($('#dots'), cellsOf(it, t, store.moods(id)), { onCell: editDay, fresh });
    fresh = null;
  }

  function place() {
    const W = root.clientWidth, H = root.clientHeight;
    if (!W || !H) return;
    const it = item(), s = status(it, today());
    dial.layout(W, H, s.total);
    const lab = $('#label');
    lab.style.left = dial.labelX().toFixed(1) + 'px';
    lab.style.top = dial.cy.toFixed(1) + 'px';
    paintDots();
  }

  async function record(res, n) {
    if (!res) return false;
    if (res.skip) { store.markAsked(id, keyOf(n)); return false; }
    store.setMood(id, keyOf(n), res.id, Date.now());
    if (n === today()) store.markAsked(id, keyOf(n));
    fresh = n;
    paintDots();
    return true;
  }

  // 今天及以前的任意一天都能改或补；返回是否真的改了。
  async function editDay(n) {
    const t = today(), s = status(item(), t);
    if (n > t || n < s.start || n > s.target) return false;
    const cur = store.moods(id)[keyOf(n)];
    const res = await picker.open({
      title: n === t ? '今天的心情' : '这天的心情',
      subtitle: `${mdText(n)} ${weekdayText(n)}`,
      current: cur ? cur.m : null,
      skipLabel: '取消',
    });
    if (!alive || !res || res.skip) return false;
    return record(res, n);
  }

  async function openReview() {
    await review.open({ item: item(), today: today(), moods: () => store.moods(id), edit: editDay });
  }

  $('#back').addEventListener('click', goBack);
  $('#peek').addEventListener('click', openReview);
  $('#goal').addEventListener('click', async () => {
    const it = item(), t = today(), s = status(it, t);
    const res = await form.open({ today: t, item: it, minTarget: s.start + 1 });
    if (!alive || !res) return;
    if (res.remove) { store.remove(id); onGone(); return; }
    store.update(id, res);
    header();
    place();
    dial.set(status(item(), today()).left);
  });

  ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (alive) place(); }) : null;
  if (ro) ro.observe(root);
  else window.addEventListener('resize', place);

  // 进入或跨天：先摆好，再让滚轮转到今天，然后按需弹心情 / 自动回看。
  async function enter() {
    const it = item(), t = today(), s = status(it, t);
    header();
    place();
    const prev = store.shown(id);
    const from = prev !== null && prev !== s.left ? Math.min(prev, s.total + 1) : s.left + 1;
    store.setShown(id, s.left);
    if (reduce()) dial.set(s.left);
    else {
      const ms = Math.min(2200, 650 + Math.abs(from - s.left) * 45);
      await dial.roll(from, s.left, ms);
    }
    if (!alive) return;
    if (needPrompt(it, t, store.moods(id), store.asked(id))) {
      await new Promise((r) => setTimeout(r, reduce() ? 0 : 350));
      if (!alive) return;
      const res = await picker.open({ subtitle: `${mdText(t)} ${weekdayText(t)}` });
      if (!alive) return;
      if (res) await record(res, t);
      else return;
    }
    if (s.left === 0 && !store.reviewed(id)) {
      store.markReviewed(id);
      await new Promise((r) => setTimeout(r, reduce() ? 0 : 500));
      if (alive) openReview();
    }
  }

  function destroy() {
    alive = false;
    dial.stop();
    if (ro) ro.disconnect();
    else window.removeEventListener('resize', place);
    picker.close(); review.close(); form.close();
  }

  return { enter, destroy, refresh: enter };
}
