// 單元：今日測驗
// 每天依日期固定出一組題目：使用者可以設定出題內容（新題、發音、單字、數字、文法、複習、TOPIK）、課別範圍（從哪一課到目前進度）和題數。
// 設定存在 daily_scope；同一天、同一組設定，題目都相同。
import { $, esc, shuffle } from '../../js/core/dom.js';
import { LS } from '../../js/core/storage.js';
import { runQuiz } from '../../js/core/quiz.js';
import { itemToQ } from '../../js/core/lessonQuiz.js';
import { buildQuiz as pronQuiz } from '../pronunciation/index.js';
import { buildQuiz as verbQuiz } from '../verbs/index.js';
import { buildQuiz as nounQuiz } from '../nouns/index.js';
import { buildQuiz as numberQuiz } from '../numbers/index.js';
import { ALL as GRAMMAR, learned } from '../grammar/index.js';
import { BANK } from './bank.js';
import { W } from '../verbs/words.js';
import { N } from '../nouns/nouns.js';
import { BOOKS, UNITS, parse, cmp, getProgress, inRange, progressPicker, progressLabel } from '../../js/core/progress.js';
import { TYPES as TK_TYPES, Q as TK_Q } from '../topik/questions.js';
import { build as topikBuild, bindPlay } from '../topik/index.js';

const KINDS = [
  ['new', '今日新題'], ['pron', '發音規則'], ['verb', '動詞・形容詞'], ['noun', '名詞'],
  ['num', '數字'], ['grammar', '文法'], ['review', '過去的每日新題'], ['topik', 'TOPIK 題型']
];
const DEFAULT_SCOPE = { kinds: ['new', 'pron', 'verb', 'noun', 'num', 'grammar', 'review'], from: '1A-1', count: 10 };
const getScope = () => ({ ...DEFAULT_SCOPE, ...LS.get('daily_scope', {}) });
const setScope = s => LS.set('daily_scope', s);

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d + n)); };

// 以日期＋設定當種子的亂數，讓同一天、同一組設定的題目固定
function seeded(seed, fn) {
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const orig = Math.random; Math.random = rnd;
  try { return fn(); } finally { Math.random = orig; }
}

function buildDaily(date, sc) {
  const from = parse(sc.from) || { book: '1A', unit: 1 };
  const inR = (b, u) => inRange(b, u, from);
  return seeded(date + JSON.stringify(sc) + progressLabel(), () => {
    const count = sc.count, k = new Set(sc.kinds);
    const entry = BANK.find(b => b.date === date);
    const fresh = k.has('new') && entry ? entry.items.slice(0, Math.ceil(count / 2)).map(it => itemToQ(it, { name: '今日新題・' + entry.topic })) : [];
    const rest = count - fresh.length;
    // 每一類先產生最多 rest 題，再輪流挑選
    const pools = [];
    if (k.has('pron')) pools.push(pronQuiz('all'));
    if (k.has('verb')) { const w = W.filter(x => inR(x.l, x.u)); if (w.length) pools.push(verbQuiz(w)); }
    if (k.has('noun')) { const n = N.filter(x => inR(x.l, x.u)); if (n.length) pools.push(nounQuiz(n)); }
    if (k.has('num')) pools.push(numberQuiz());
    if (k.has('grammar')) {
      const g = shuffle(GRAMMAR.filter(l => inR(l.book, l.unit)).flatMap(l => (l.quiz || []).map(it => itemToQ(it, { ...l, name: '文法・' + l.name }))));
      if (g.length) pools.push(g);
    }
    if (k.has('review')) {
      const r = shuffle(BANK.filter(b => b.date < date).flatMap(b => b.items.map(it => itemToQ(it, { name: '複習・' + b.topic }))));
      if (r.length) pools.push(r);
    }
    if (k.has('topik')) pools.push(topikBuild(shuffle(TK_Q).slice(0, rest)));
    const others = [];
    const qs = shuffle(pools.map(p => p.slice()));
    while (others.length < rest && qs.some(p => p.length)) for (const p of qs) if (p.length && others.length < rest) others.push(p.shift());
    return fresh.concat(shuffle(others));
  });
}

function streak(log, t) {
  let d = log[t] != null ? t : addDays(t, -1), n = 0;
  while (log[d] != null) { n++; d = addDays(d, -1); }
  return n;
}

function render(el) {
  const t = today();
  const dates = [t, ...BANK.map(b => b.date).filter(d => d < t).reverse()];
  const sc0 = getScope(), f0 = parse(sc0.from) || { book: '1A', unit: 1 };
  el.innerHTML = `<div class="qwrap">
    <details class="block dscope">
      <summary><b>出題範圍設定</b><span class="dscope-sum muted"></span></summary>
      <div class="ds-row"><span class="ds-l">課別範圍</span>
        <label class="pp-pick"><span>從</span><select class="fr-book" aria-label="起始冊">${BOOKS.map(b => `<option ${b === f0.book ? 'selected' : ''}>${b}</option>`).join('')}</select><select class="fr-unit" aria-label="起始課"></select></label>
        <span class="dprog"></span>
      </div>
      <div class="ds-row"><span class="ds-l">出題內容</span><div class="ds-kinds">${KINDS.map(([v, l]) => `<label class="tk-chk"><input type="checkbox" value="${v}" ${sc0.kinds.includes(v) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
      <div class="ds-row"><span class="ds-l">題數</span><select class="ds-count" aria-label="題數">${[10, 20, 30].map(n => `<option value="${n}" ${n === sc0.count ? 'selected' : ''}>${n} 題</option>`).join('')}</select>
        <button type="button" class="btn ghost small ds-reset">恢復預設</button></div>
      <p class="note">「到」的那一課就是你的進度；文法和單字只會從這個範圍出題。發音、數字、TOPIK 題型不分課別。設定會自動儲存。</p>
    </details>
    <section class="dhead" aria-live="polite"></section>
    <div class="qctl"><select class="qf" aria-label="日期">${dates.map(d => `<option value="${d}">${d === t ? `今天（${d}）` : `${d} 的題目`}</option>`).join('')}</select><button type="button" class="btn qs-start">重新開始這一組</button></div>
    <div class="qcard qbox"></div>
  </div>`;
  const head = $('.dhead', el), sel = $('.qf', el), box = $('.qbox', el);
  const fb = $('.fr-book', el), fu = $('.fr-unit', el);
  let qs = [];
  bindPlay(box, { find: f => qs.find(f) });
  const fillUnits = u => { fu.innerHTML = Array.from({ length: UNITS[fb.value] }, (_, i) => `<option value="${i + 1}" ${i + 1 === u ? 'selected' : ''}>第 ${i + 1} 課</option>`).join(''); };
  fillUnits(f0.unit);

  // 讀取畫面上的設定；「從」不能晚於進度，晚於時自動拉回進度
  function readScope() {
    let from = { book: fb.value, unit: +fu.value };
    const p = getProgress();
    if (cmp(from, p) > 0) { from = { ...p }; fb.value = p.book; fillUnits(p.unit); }
    const kinds = [...el.querySelectorAll('.ds-kinds input:checked')].map(c => c.value);
    return { kinds: kinds.length ? kinds : ['new'], from: `${from.book}-${from.unit}`, count: +$('.ds-count', el).value };
  }
  function summary(sc) {
    const f = parse(sc.from);
    $('.dscope-sum', el).textContent = `　${f.book} 第 ${f.unit} 課 ～ ${progressLabel()}・${sc.kinds.length} 類・${sc.count} 題`;
  }
  const changed = () => { const sc = readScope(); setScope(sc); summary(sc); start(); };
  progressPicker($('.dprog', el), changed);
  $('.dprog .pp-pick > span', el).textContent = '到';
  fb.onchange = () => { fillUnits(1); changed(); };
  fu.onchange = changed;
  el.querySelector('.ds-kinds').onchange = changed;
  $('.ds-count', el).onchange = changed;
  $('.ds-reset', el).onclick = () => {
    setScope(DEFAULT_SCOPE);
    el.querySelectorAll('.ds-kinds input').forEach(c => { c.checked = DEFAULT_SCOPE.kinds.includes(c.value); });
    $('.ds-count', el).value = String(DEFAULT_SCOPE.count); fb.value = '1A'; fillUnits(1); changed();
  };

  function drawHead() {
    const log = LS.get('daily_log', {}), d = sel.value, entry = BANK.find(b => b.date === d), sc = getScope();
    const week = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
    head.innerHTML = `
      <div class="dtop"><div><p class="eyebrow">${d === t ? '今日測驗' : '過去的每日測驗'}</p><h2 class="dtitle">${d}</h2></div>
      <div class="dstreak"><b>${streak(log, t)}</b><span>天連續完成</span></div></div>
      <p class="dnew">${sc.kinds.includes('new') ? (entry ? `今日新題 <b>${entry.items.length}</b> 題・${esc(entry.topic)}` : '這一天沒有新題') : '沒有選「今日新題」'}　｜　共 <b>${qs.length}</b> 題${log[d] != null ? `　｜　這一天最佳 ${log[d]} 分` : ''}</p>
      <ol class="dweek" aria-label="最近七天">${week.map(w => `<li class="${log[w] != null ? 'on' : ''} ${w === t ? 'today' : ''}" title="${w}${log[w] != null ? ` 完成 ${log[w]} 分` : ''}"><span>${['日', '一', '二', '三', '四', '五', '六'][new Date(w + 'T00:00').getDay()]}</span><i></i></li>`).join('')}</ol>`;
  }
  function start() {
    const d = sel.value, sc = getScope();
    qs = buildDaily(d, sc);
    if (!qs.length) { box.innerHTML = '<p class="muted">這個範圍沒有題目，請多勾選一些內容或放寬課別範圍。</p>'; drawHead(); return; }
    runQuiz(box, qs, 'daily_best_' + d, start, score => {
      const log = LS.get('daily_log', {}); log[d] = Math.max(log[d] ?? 0, score); LS.set('daily_log', log); drawHead();
    });
    drawHead();
  }
  summary(getScope());
  $('.qs-start', el).onclick = start; sel.onchange = start;
  start();
}

export default {
  id: 'daily',
  title: '今日測驗',
  ko: '오늘의 퀴즈',
  icon: 'quiz',
  glyph: '오',
  desc: '每天一組測驗，可以自己設定範圍、內容和題數',
  pages: [{ id: 'quiz', title: '今日測驗', render, fresh: true }]
};
