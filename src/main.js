import { createStore } from './store.js';
import { installSprite } from './moods.js';
import { dayNumAt, keyOf } from './time.js';
import { status } from './model.js';
import { renderList } from './list.js';
import { mountDetail } from './detail.js';
import { createPicker } from './pick.js';
import { createReview } from './review.js';
import { createForm } from './form.js';

const params = new URLSearchParams(location.search);
const DEV = params.has('dev');

const app = document.getElementById('app');
const view = document.getElementById('view');
const store = createStore({ persistent: !DEV || params.has('persist') });

let offsetDays = 0;
const now = () => dayNumAt(Date.now()) + offsetDays;

installSprite();
const picker = createPicker(app);
const review = createReview(app);
const form = createForm(app);

let current = null;
let depth = 0;
let lastToday = now();

function leave() {
  if (current && current.destroy) current.destroy();
  current = null;
  picker.close(); review.close(); form.close();
}

function show(kind) {
  view.className = 'view ' + kind;
  view.classList.remove('in');
  void view.offsetWidth;
  view.classList.add('in');
}

async function addFlow() {
  const t = now();
  const res = await form.open({ today: t });
  if (!res) return;
  const it = store.add(res, keyOf(t));
  depth++;
  location.hash = '#/c/' + it.id;
}

function route() {
  leave();
  const m = /^#\/c\/([\w-]+)$/.exec(location.hash);
  const it = m ? store.item(m[1]) : null;
  if (m && !it) { location.replace('#/'); return; }
  if (it) {
    show('detail');
    current = mountDetail(view, {
      id: it.id, store, now, picker, review, form,
      goBack: () => (depth > 0 ? (depth--, history.back()) : (location.hash = '#/')),
      onGone: () => { depth = 0; location.hash = '#/'; },
    });
    current.enter();
  } else {
    depth = 0;
    show('list');
    renderList(view, { items: store.items(), today: now() });
  }
}

view.addEventListener('click', (e) => {
  if (e.target.closest('[data-add]')) addFlow();
  else if (e.target.closest('a.ev')) depth++;
});

function tick() {
  const t = now();
  if (t === lastToday) return;
  lastToday = t;
  if (current && current.refresh) current.refresh();
  else if (!current) renderList(view, { items: store.items(), today: t });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
setInterval(tick, 30000);
window.addEventListener('hashchange', route);

route();

if (DEV) {
  import('./dev.js').then((m) => m.initDev({
    store, now,
    setOffset: (n) => { offsetDays = n; tick(); },
    getOffset: () => offsetDays,
    reroute: () => { lastToday = now(); route(); },
    status,
  }));
}
