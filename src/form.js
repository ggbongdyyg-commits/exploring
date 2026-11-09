import { NAME_MAX } from './config.js';
import { validate } from './model.js';
import { createDatePicker } from './datepick.js';
import { numOfKey, fullText, weekdayText } from './time.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 新建 / 编辑共用的卡片。resolve: { name, target } | { remove: true } | null
export function createForm(host) {
  let el = null, done = null;
  const dp = createDatePicker(host);

  function close(result) {
    if (!el) return;
    dp.close();
    const n = el, cb = done;
    el = null; done = null;
    n.classList.remove('on');
    setTimeout(() => n.remove(), 220);
    if (cb) cb(result);
  }

  function open({ today, item = null, minTarget }) {
    close(null);
    return new Promise((resolve) => {
      done = resolve;
      const edit = !!item;
      const min = minTarget === undefined ? today + 1 : minTarget;
      el = document.createElement('div');
      el.className = 'overlay';
      el.innerHTML = `<div class="scrim"></div><div class="card form" role="dialog" aria-modal="true" aria-label="${edit ? '编辑倒计时' : '新的倒计时'}">
<h2>${edit ? '编辑倒计时' : '新的倒计时'}</h2>
<label class="fld"><small>倒计时的目标</small><input class="name" type="text" maxlength="${NAME_MAX}" placeholder="例如：研究生考试" value="${edit ? esc(item.name) : ''}" autocomplete="off"></label>
<div class="fld"><small>目标日期</small><button type="button" class="box"><span class="dtxt"></span><em></em></button></div>
<p class="hint" aria-live="polite"></p>
<button type="button" class="go" disabled>${edit ? '保存' : '开始'}</button>
${edit ? '<button type="button" class="del">删除</button>' : ''}
<button type="button" class="cancel">取消</button></div>`;
      host.appendChild(el);
      requestAnimationFrame(() => el && el.classList.add('on'));

      const root = el, name = el.querySelector('.name'), box = el.querySelector('.box');
      let val = edit ? item.target : '';
      const dtxt = el.querySelector('.dtxt'), wd = el.querySelector('em');
      const go = el.querySelector('.go'), hint = el.querySelector('.hint');
      const del = el.querySelector('.del');

      const sync = () => {
        const n = numOfKey(val);
        dtxt.textContent = Number.isNaN(n) ? '选择日期' : fullText(n).split(' ')[0];
        dtxt.classList.toggle('ph', Number.isNaN(n));
        wd.textContent = Number.isNaN(n) ? '' : weekdayText(n);
        const err = validate({ name: name.value, target: val }, today, min);
        go.disabled = !!err;
        hint.textContent = err === 'range' ? (edit ? '目标日期要晚于开始日期' : '目标日期要晚于今天') : '';
      };
      name.addEventListener('input', sync);
      box.addEventListener('click', async () => {
        const k = await dp.open({ value: val, min, today });
        if (k && el === root) { val = k; sync(); }
      });
      sync();

      go.addEventListener('click', () => { if (!go.disabled) close({ name: name.value.trim(), target: val }); });
      el.querySelector('.cancel').addEventListener('click', () => close(null));
      el.querySelector('.scrim').addEventListener('click', () => close(null));
      if (del) {
        let armed = false;
        del.addEventListener('click', () => {
          if (!armed) {
            armed = true;
            del.textContent = '再点一次，删除并清空这个倒计时的心情记录';
            del.classList.add('armed');
            return;
          }
          close({ remove: true });
        });
      }
      if (!edit) setTimeout(() => name.focus(), 260);
    });
  }

  return { open, close: () => close(null), isOpen: () => !!el };
}
