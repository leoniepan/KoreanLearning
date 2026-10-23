// 檢查每日短文的格式：node tools/check-reading.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../modules/reading/bank.js', import.meta.url), 'utf8').replace(/^export\s+const\s+READING/m, 'globalThis.READING');
const ctx = {}; vm.createContext(ctx); vm.runInContext(src, ctx);
const R = ctx.READING, errs = [], seen = new Set();
const LV = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'];
if (!Array.isArray(R)) errs.push('READING 不是陣列');
for (const [i, r] of (R || []).entries()) {
  const w = `第 ${i + 1} 篇（${r && r.date} ${r && r.level}）`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) errs.push(`${w}：date 格式要是 YYYY-MM-DD`);
  if (i > 0 && r.date < R[i - 1].date) errs.push(`${w}：日期要依先後排列`);
  if (!LV.includes(r.level)) errs.push(`${w}：level 要是 1A～4B`);
  const id = r.date + '-' + r.level; if (seen.has(id)) errs.push(`${w}：同一天同一程度重複`); seen.add(id);
  for (const k of ['title', 'zhTitle', 'topic']) if (!r[k]) errs.push(`${w}：缺少 ${k}`);
  if (!Array.isArray(r.text) || r.text.length < 3) errs.push(`${w}：text 至少 3 句`);
  if (!Array.isArray(r.zh) || r.zh.length !== (r.text || []).length) errs.push(`${w}：zh 要和 text 句數相同`);
  if (!Array.isArray(r.words)) errs.push(`${w}：缺少 words`);
  else r.words.forEach((x, j) => { if (!Array.isArray(x) || x.length !== 2 || !x[0] || !x[1]) errs.push(`${w}：words 第 ${j + 1} 個格式要是 [韓文, 中文]`); });
  if (!Array.isArray(r.quiz) || r.quiz.length < 3 || r.quiz.length > 5) errs.push(`${w}：quiz 要有 3～5 題`);
  for (const [j, q] of (r.quiz || []).entries()) {
    if (!q.p) errs.push(`${w} 第 ${j + 1} 題：缺少 p`);
    if (!Array.isArray(q.opts) || q.opts.length < 2 || q.opts.length > 4) errs.push(`${w} 第 ${j + 1} 題：opts 要有 2～4 個`);
    else { if (new Set(q.opts).size !== q.opts.length) errs.push(`${w} 第 ${j + 1} 題：選項重複`); if (!q.opts.includes(q.a)) errs.push(`${w} 第 ${j + 1} 題：答案不在選項裡`); }
  }
  if (!r.source || !/^https?:\/\//.test(r.source.url || '') || !r.source.name) errs.push(`${w}：source 要有 name 和 http(s) 網址`);
  if (/drive\.google|docs\.google/.test(r.source?.url || '')) errs.push(`${w}：不可以放 Google 雲端硬碟的連結`);
}
if (errs.length) { console.error('短文有問題：\n- ' + errs.join('\n- ')); process.exit(1); }
console.log(`短文格式正確：共 ${R.length} 篇，最新一天 ${R.at(-1).date}`);
