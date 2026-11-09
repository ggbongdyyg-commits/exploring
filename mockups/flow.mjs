import { writeFileSync } from 'node:fs';
const s = [
  ['08-empty', 'A 空列表：虚线圈加一句话和一个按钮，引导添加'],
  ['01-setup', 'B 新建：只填名称和目标日期'],
  ['09-first-pick', 'C 新建完直接进入详情，第一次打开该项目：选今天的心情'],
  ['02-main', 'D 选完（或跳过）：时钟滚到今天，色点格记下心情；当天再进该项目不再弹'],
  ['06-list', 'E 返回列表：想看哪个点哪个，进入时才弹它自己的心情'],
  ['05-review', 'F 详情右上笑脸：回看这个项目的心情'],
];
const arrows = ['点添加', '点开始', '选心情', '点左上返回', '点卡片后，笑脸在详情里'];
let h = '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#dedbd4;display:flex;align-items:flex-start;padding:30px;width:max-content;font:13px -apple-system,sans-serif;color:#555}img{width:390px;height:844px;border-radius:18px;box-shadow:0 8px 30px rgba(0,0,0,.18)}figure{margin:0;width:390px}figcaption{margin-top:10px;text-align:center;line-height:1.5}.ar{width:90px;margin-top:400px;text-align:center;color:#8f8e8a}.ar b{display:block;font-size:26px;font-weight:300;color:#3a3a38}</style></head><body>';
s.forEach(([f, c], i) => {
  h += `<figure><img src="png/${f}.png"><figcaption>${c}</figcaption></figure>`;
  if (i < s.length - 1) h += `<div class="ar"><b>→</b>${arrows[i]}</div>`;
});
writeFileSync(new URL('flow.html', import.meta.url), h + '</body></html>');
