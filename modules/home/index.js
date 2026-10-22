// 首頁：打招呼、搜尋、單元圖示入口、今日測驗、學習單元卡片
import { $, esc } from '../../js/core/dom.js';
import { LS } from '../../js/core/storage.js';
import { icon } from '../../js/core/icons.js';
import { sync } from '../../js/core/sync.js';
import { W } from '../verbs/words.js';
import { N } from '../nouns/nouns.js';
import { PL } from '../pronunciation/lessons.js';
import { ALL as GRAMMAR } from '../grammar/index.js';
import { BANK } from '../daily/bank.js';

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
function streak() {
  const log = LS.get('daily_log', {});
  const d = new Date(); if (log[ymd(d)] == null) d.setDate(d.getDate() - 1);
  let n = 0; while (log[ymd(d)] != null) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// 每個單元卡片底部顯示的進度
function progressOf(id) {
  switch (id) {
    case 'daily': { const s = LS.get('daily_log', {})[today()]; return s != null ? `今天答對 ${s} 題` : "今天還沒做"; }
    case 'pron': return `已完成 ${LS.get('done', []).length}/${PL.length} 課`;
    case 'verbs': return `${W.length + LS.get('custom', []).length} 個單字`;
    case 'nouns': return `${N.length + LS.get('custom_nouns', []).length} 個單字`;
    case 'numbers': { const b = LS.get('best_numq', null); return b != null ? `最佳 ${b}/10` : '漢字語・固有語'; }
    case 'grammar': {
      const done = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'].reduce((n, b) => n + LS.get('done_grammar_' + b, []).length, 0);
      return `已完成 ${done}/${GRAMMAR.length} 個文法`;
    }
    case 'topik': { const l = LS.get('topik_mock_log', []); return l.length ? `模擬考最近 ${l[l.length - 1].s}/200` : 'TOPIK I 題型練習'; }
    case 'records': { const n = LS.get('history', []).length; return n ? `已練習 ${n} 回` : '還沒有紀錄'; }
    default: return '';
  }
}

// 搜尋：單字、名詞、文法、發音規則
function searchIndex() {
  const verbs = W.concat(LS.get('custom', [])).map(w => ({ k: w.k, zh: w.zh, kind: w.t === 'a' ? '形容詞' : '動詞', go: ['verbs-table', { q: w.k }] }));
  const nouns = N.concat(LS.get('custom_nouns', [])).map(n => ({ k: n.k, zh: n.zh, kind: '名詞', go: ['nouns-table', { q: n.k }] }));
  const gram = GRAMMAR.map(l => ({ k: l.name, zh: `${l.book}・${l.ko || ''}`, kind: '文法', go: ['grammar-' + l.book.toLowerCase(), { lesson: l.id }] }));
  const pron = PL.map(l => ({ k: l.name, zh: l.ko, kind: '發音', go: ['pron-learn', { lesson: l.id }] }));
  return [...verbs, ...nouns, ...gram, ...pron];
}

function render(el, ctx) {
  const mods = (ctx.modules || []).filter(m => m.id !== 'home');
  const has = id => mods.some(m => m.id === id);
  const name = sync.me?.email ? sync.me.email.split('@')[0] : '同學';
  const st = streak();
  const t = today(), todayEntry = BANK.find(b => b.date === t), todayScore = LS.get('daily_log', {})[t];
  const shortcuts = [...mods.map(m => ({ label: m.title, ic: m.icon, go: m.id === 'records' ? 'records-overview' : null, mod: m.id })), ...(has('records') ? [{ label: '錯題本', ic: 'note', go: 'records-mistakes' }] : [])];

  el.innerHTML = `
  <section class="hello">
    <div class="avatar" aria-hidden="true">${esc(name.slice(0, 1).toUpperCase())}</div>
    <div class="hello-t"><h2>안녕하세요，${esc(name)}</h2><p>今天也來學一點韓文吧</p></div>
    <div class="hello-r">
      <span class="streak" title="連續完成今日測驗的天數">${icon('fire')}<b>${st}</b> 天</span>
      ${has('records') ? `<button type="button" class="round-btn" data-go="records-mistakes" aria-label="錯題本">${icon('bell')}</button>` : ''}
    </div>
  </section>

  <div class="search" role="search">
    ${icon('search')}
    <input type="text" id="home-q" placeholder="搜尋單字、名詞、文法…（韓文或中文）" aria-label="搜尋單字、名詞與文法" autocomplete="off">
  </div>
  <div class="search-res" id="home-res" hidden></div>

  <section class="cats" aria-label="單元">
    ${shortcuts.map(s => `<button type="button" class="cat" ${s.go ? `data-go="${s.go}"` : `data-mod="${s.mod}"`}><span class="cat-ic">${icon(s.ic)}</span><span>${esc(s.label)}</span></button>`).join('')}
  </section>

  ${has('daily') ? `<section class="feature">
    <div class="feature-glyph" aria-hidden="true">오늘</div>
    <div class="feature-t">
      <p class="eyebrow">今日測驗・${t}</p>
      <h3>${todayEntry ? esc(todayEntry.topic) : '綜合複習'}</h3>
      <p>${todayEntry ? `今天有 ${todayEntry.items.length} 題新題，加上各單元的複習題，共 10 題。` : '從各單元挑選 10 題複習。'}</p>
    </div>
    <button type="button" class="btn light" data-go="daily-quiz">${todayScore != null ? `再做一次（${todayScore}/10）` : '開始測驗'}</button>
  </section>` : ''}

  <section>
    <div class="sec-h"><h3>學習單元</h3></div>
    <div class="courses">
      ${mods.map(m => `<button type="button" class="course" data-mod="${m.id}">
        <span class="course-top"><span class="tile" lang="ko">${esc(m.glyph || '가')}</span><span class="course-t"><b>${esc(m.title)}</b><small lang="ko">${esc(m.ko)}</small><span class="course-d">${esc(m.desc || '')}</span></span></span>
        <span class="course-foot">${esc(progressOf(m.id))}${icon('arrow')}</span>
      </button>`).join('')}
    </div>
  </section>`;

  const idx = searchIndex();
  const q = $('#home-q', el), res = $('#home-res', el);
  q.oninput = () => {
    const s = q.value.trim();
    if (!s) { res.hidden = true; res.innerHTML = ''; return; }
    const hits = idx.filter(x => x.k.includes(s) || (x.zh || '').includes(s)).slice(0, 12);
    res.hidden = false;
    res.innerHTML = hits.length
      ? `<ul>${hits.map((x, i) => `<li><button type="button" data-hit="${i}"><span class="kind">${esc(x.kind)}</span><b lang="ko">${esc(x.k)}</b><span class="muted">${esc(x.zh || '')}</span></button></li>`).join('')}</ul>`
      : `<p class="muted">找不到「${esc(s)}」。可以換個說法，或到單字表新增。</p>`;
    res._hits = hits;
  };
  el.onclick = e => {
    const h = e.target.closest('[data-hit]');
    if (h) { const x = res._hits[+h.dataset.hit]; ctx.go(x.go[0], x.go[1]); return; }
    const g = e.target.closest('[data-go]');
    if (g) { ctx.go(g.dataset.go); return; }
    const m = e.target.closest('[data-mod]');
    if (m) ctx.openModule(m.dataset.mod);
  };
}

export default {
  id: 'home',
  title: '首頁',
  ko: '홈',
  icon: 'home',
  glyph: '홈',
  desc: '',
  pages: [{ id: 'main', title: '首頁', render, fresh: true }]
};
