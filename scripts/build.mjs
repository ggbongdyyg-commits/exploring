import { cp, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const src = resolve('src');
const dist = resolve('dist');

await rm(dist, { recursive: true, force: true });
await cp(src, dist, { recursive: true });

// 正式构建不带调试面板，线上用户无法改时间。
await rm(join(dist, 'dev.js'), { force: true });
const mainPath = join(dist, 'main.js');
const main = await readFile(mainPath, 'utf8');
const re = /^const DEV = .*;$/m;
if (!re.test(main)) throw new Error('build: 在 main.js 里找不到 `const DEV = ...;`');
await writeFile(mainPath, main.replace(re, 'const DEV = false;'));

for (const f of await readdir(dist)) {
  if (f.endsWith('.js')) execFileSync(process.execPath, ['--check', join(dist, f)], { stdio: 'inherit' });
}
console.log(`built ${dist}`);
