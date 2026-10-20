// 檢查每日新題題庫的格式：node tools/check-bank.mjs
// 不需要安裝任何套件。發現問題時會列出並以錯誤碼結束。
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const file = new URL('../modules/daily/bank.js', import.meta.url);
const src = readFileSync(file, 'utf8').replace(/^export\s+const\s+BANK/m, 'globalThis.BANK');
const ctx = {}; vm.createContext(ctx); vm.runInContext(src, ctx);
const BANK = ctx.BANK;
const errs = [];
const seenDates = new Set(), seenKo = new Map();

if (!Array.isArray(BANK)) errs.push('BANK 不是陣列');
for (const [i, d] of (BANK || []).entries()) {
  const where = `第 ${i + 1} 組（${d && d.date}）`;
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) errs.push(`${where}：date 格式要是 YYYY-MM-DD`);
  if (seenDates.has(d.date)) errs.push(`${where}：日期重複`);
  seenDates.add(d.date);
  if (i > 0 && d.date < BANK[i - 1].date) errs.push(`${where}：日期要依先後排列`);
  if (!d.topic) errs.push(`${where}：缺少 topic`);
  if (!Array.isArray(d.items) || d.items.length < 3 || d.items.length > 10) errs.push(`${where}：items 要有 3～10 題`);
  for (const [j, it] of (d.items || []).entries()) {
    const w = `${where} 第 ${j + 1} 題`;
    if (!it.p) errs.push(`${w}：缺少題目說明 p`);
    if (!Array.isArray(it.opts) || it.opts.length < 2 || it.opts.length > 4) errs.push(`${w}：opts 要有 2～4 個選項`);
    else {
      if (new Set(it.opts).size !== it.opts.length) errs.push(`${w}：選項重複`);
      if (!it.opts.includes(it.a)) errs.push(`${w}：答案 a 不在選項裡`);
    }
    if (it.ko && (it.ko.match(/＿/g) || []).length > 1) errs.push(`${w}：一句只能有一個 ＿`);
    if (it.ko) {
      if (seenKo.has(it.ko)) errs.push(`${w}：和 ${seenKo.get(it.ko)} 的句子重複`);
      seenKo.set(it.ko, w);
    }
  }
}

if (errs.length) { console.error('題庫有問題：\n- ' + errs.join('\n- ')); process.exit(1); }
console.log(`題庫格式正確：共 ${BANK.length} 天、${BANK.reduce((n, d) => n + d.items.length, 0)} 題，最新一天 ${BANK.at(-1).date}`);
