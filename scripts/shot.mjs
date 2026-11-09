// 用法: node scripts/shot.mjs <outDir> <jobsJson>
// jobs: [{name,url,w,h,dpr?,steps?:[{eval:"js"|wait:ms}]}]
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2];
const arg = process.argv[3];
const jobs = JSON.parse(arg.endsWith('.json') ? readFileSync(arg, 'utf8') : arg);
await mkdir(outDir, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9333;
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, '--user-data-dir=/tmp/88chrome',
  '--hide-scrollbars', '--no-first-run', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let list;
for (let i = 0; i < 50; i++) {
  try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.length) break; } catch {}
  await sleep(200);
}
const page = list.find((x) => x.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  else if (m.method === 'Runtime.consoleAPICalled') logs.push('LOG ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable');

for (const j of jobs) {
  await send('Emulation.setDeviceMetricsOverride', { width: j.w, height: j.h, deviceScaleFactor: j.dpr || 2, mobile: true });
  await send('Page.navigate', { url: j.url });
  await sleep(1200);
  for (const s of j.steps || []) {
    if (s.wait) await sleep(s.wait);
    if (s.eval) {
      const r = await send('Runtime.evaluate', { expression: s.eval, awaitPromise: true, returnByValue: true });
      if (s.print) console.log(j.name, JSON.stringify(r.result?.result?.value ?? r.result));
    }
  }
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(outDir, `${j.name}.png`), Buffer.from(shot.result.data, 'base64'));
  console.log('saved', j.name);
}
if (logs.length) console.log(logs.join('\n'));
ws.close();
chrome.kill();
