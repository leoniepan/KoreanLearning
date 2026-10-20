// 單元：今日測驗
// 每天依日期固定出一組 10 題：先放當天的「每日新題」（bank.js），其餘從發音、動詞、問句與過去的新題中挑選。
// 同一天不論打開幾次、在哪台裝置，題目都相同；隔天自動換一組。
import { $, esc, shuffle } from '../../js/core/dom.js';
import { LS } from '../../js/core/storage.js';
import { runQuiz } from '../../js/core/quiz.js';
import { itemToQ } from '../../js/core/lessonQuiz.js';
import { buildQuiz as pronQuiz } from '../pronunciation/index.js';
import { buildQuiz as verbQuiz } from '../verbs/index.js';
import { LESSONS as QUESTION_LESSONS } from '../questions/lessons.js';
import { BANK } from './bank.js';

const COUNT = 10;
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d + n)); };

// 以日期當種子的亂數，讓同一天的題目固定
function seeded(seed, fn) {
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const orig = Math.random; Math.random = rnd;
  try { return fn(); } finally { Math.random = orig; }
}

function buildDaily(date) {
  return seeded(date, () => {
    const entry = BANK.find(b => b.date === date);
    const fresh = (entry ? entry.items : []).slice(0, COUNT).map(it => itemToQ(it, { name: '今日新題・' + entry.topic }));
    const rest = COUNT - fresh.length;
    const p = Math.round(rest * 0.3), v = Math.round(rest * 0.4), r = Math.max(0, rest - p - v);
    const older = BANK.filter(b => b.date < date).flatMap(b => b.items.map(it => [it, '複習・' + b.topic]));
    const lessonItems = QUESTION_LESSONS.flatMap(l => (l.quiz || []).map(it => [it, '問句・' + l.name]));
    const review = shuffle(older.concat(lessonItems)).slice(0, r).map(([it, name]) => itemToQ(it, { name }));
    const others = shuffle([...pronQuiz('all').slice(0, p), ...verbQuiz().slice(0, v), ...review]);
    return fresh.concat(others).slice(0, COUNT);
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
  el.innerHTML = `<div class="qwrap">
    <section class="dhead" aria-live="polite"></section>
    <div class="qctl"><select class="qf" aria-label="日期">${dates.map(d => `<option value="${d}">${d === t ? `今天（${d}）` : `${d} 的題目`}</option>`).join('')}</select><button type="button" class="btn qs-start">重新開始這一組</button></div>
    <div class="qcard qbox"></div>
  </div>`;
  const head = $('.dhead', el), sel = $('.qf', el), box = $('.qbox', el);

  function drawHead() {
    const log = LS.get('daily_log', {}), d = sel.value, entry = BANK.find(b => b.date === d);
    const week = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
    head.innerHTML = `
      <div class="dtop"><div><p class="eyebrow">${d === t ? '今日測驗' : '過去的每日測驗'}</p><h2 class="dtitle">${d}</h2></div>
      <div class="dstreak"><b>${streak(log, t)}</b><span>天連續完成</span></div></div>
      <p class="dnew">${entry ? `今日新題 <b>${entry.items.length}</b> 題・${esc(entry.topic)}` : '這一天沒有新題，題目從既有內容中挑選'}${log[d] != null ? `　｜　這一組最佳 ${log[d]} / ${COUNT}` : ''}</p>
      <ol class="dweek" aria-label="最近七天">${week.map(w => `<li class="${log[w] != null ? 'on' : ''} ${w === t ? 'today' : ''}" title="${w}${log[w] != null ? ` 完成 ${log[w]} 分` : ''}"><span>${['日', '一', '二', '三', '四', '五', '六'][new Date(w + 'T00:00').getDay()]}</span><i></i></li>`).join('')}</ol>`;
  }
  const start = () => {
    const d = sel.value;
    runQuiz(box, buildDaily(d), 'daily_best_' + d, start, score => {
      const log = LS.get('daily_log', {}); log[d] = Math.max(log[d] ?? 0, score); LS.set('daily_log', log); drawHead();
    });
    drawHead();
  };
  $('.qs-start', el).onclick = start; sel.onchange = start;
  start();
}

export default {
  id: 'daily',
  title: '今日測驗',
  ko: '오늘의 퀴즈',
  pages: [{ id: 'quiz', title: '今日測驗', render }]
};
