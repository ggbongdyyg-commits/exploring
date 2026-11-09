import { cpSync, rmSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
cpSync(src, dist, { recursive: true });
rmSync(join(dist, 'dev.js'), { force: true });

const mainPath = join(dist, 'main.js');
const code = readFileSync(mainPath, 'utf8');
const re = /const DEV = [^\n]*;/;
if (!re.test(code)) throw new Error('main.js 中找不到 const DEV = ...;');
writeFileSync(mainPath, code.replace(re, 'const DEV = false;'));

const js = readdirSync(dist).filter((f) => f.endsWith('.js'));
for (const f of js) execFileSync(process.execPath, ['--check', join(dist, f)], { stdio: 'inherit' });

if (existsSync(join(dist, 'dev.js'))) throw new Error('dist/dev.js 未删除');
console.log(`dist 构建完成：${js.length} 个 JS，已移除调试代码`);
