// 檢查文法資料：id 不重複、測驗答案在選項內、選項不重複、＿ 最多一個、例句至少 5 句
// 直接讀各冊資料檔（index.js 會載入瀏覽器專用模組）
const BOOKS = ['1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b'];
const ALL = [];
for (const b of BOOKS) { const m = await import(`../modules/grammar/${b}.js`); ALL.push(...Object.values(m)[0]); }
let err = 0, n = 0, q = 0;
const ids = new Set();
const bad = (l, m) => { err++; console.error(`✗ ${l.id}: ${m}`); };
for (const l of ALL) {
  n++;
  if (ids.has(l.id)) bad(l, 'id 重複'); ids.add(l.id);
  for (const k of ['id', 'book', 'unit', 'name', 'ko']) if (l[k] == null) bad(l, `缺少 ${k}`);
  if (!l.sents || l.sents.length < 5) bad(l, `例句只有 ${l.sents ? l.sents.length : 0} 句`);
  for (const s of l.sents || []) if (!Array.isArray(s) || s.length !== 2 || !s[0] || !s[1]) bad(l, '例句格式錯誤');
  if (!l.quiz || l.quiz.length < 2) bad(l, '題目少於 2 題');
  for (const it of l.quiz || []) {
    q++;
    if (!it.opts.includes(it.a)) bad(l, `答案不在選項內：${it.a}`);
    if (new Set(it.opts).size !== it.opts.length) bad(l, `選項重複：${it.opts}`);
    if (it.ko && (it.ko.match(/＿/g) || []).length > 1) bad(l, `＿ 超過一個：${it.ko}`);
    if (!it.p) bad(l, '缺少題目說明 p');
  }
}
const by = {}; for (const l of ALL) by[l.book] = (by[l.book] || 0) + 1;
console.log(`文法 ${n} 項、題目 ${q} 題`, by);
if (err) { console.error(`共 ${err} 個問題`); process.exit(1); }
console.log('✓ 文法資料檢查通過');
