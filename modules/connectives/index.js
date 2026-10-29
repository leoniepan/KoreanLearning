// 連接詞：依功能分類的連接詞（그리고、그래서、하지만…）、和連結語尾的對照、容易混淆的地方，以及連接詞測驗
import { $, esc, shuffle } from '../../js/core/dom.js';
import { sayBtn, nvBtn } from '../../js/core/speech.js';
import { itemToQ } from '../../js/core/lessonQuiz.js';
import { runQuiz } from '../../js/core/quiz.js';
import { GROUPS, ENDINGS, TIPS } from './data.js';

const ALL = GROUPS.flatMap(g => g.items.map(it => ({ ...it, g: g.id })));
const full = it => `${it.ex[0]} ${it.k} ${it.ex[1]}`;

// 測驗：例句挖空選連接詞＋兩句合成一句
export function buildQuiz(n = 10, lv = 'all') {
  const pool = ALL.filter(it => lv === 'all' || it.lv === lv);
  const fill = shuffle(pool).map(it => itemToQ({ ko: `${it.ex[0]} ＿ ${it.ex[1]}`, p: `選出最適合的連接詞（${it.ex[2]}）`, opts: [it.k, ...it.wrong], a: it.k, word: it.k, exp: it.note }, { id: 'conn', name: '連接詞' }));
  const merge = shuffle(ENDINGS).map(e => {
    const wrong = shuffle(ENDINGS.filter(x => x !== e)).slice(0, 3).map(x => x.end);
    return {
      type: '連接詞 → 連結語尾', key: 'conn-end|' + e.k, word: null,
      prompt: `<p>把兩句合成一句時，<b lang="ko">${esc(e.k)}</b> 要換成哪個語尾？</p><div class="qs" lang="ko">${esc(e.a[0])} ${esc(e.a[1])} ${esc(e.a[2])}</div>`,
      options: shuffle([e.end, ...wrong]).map(o => ({ v: o, h: `<span class="hg" lang="ko">${esc(o)}</span>` })),
      ans: e.end,
      exp: `${sayBtn(e.one)}<span><b lang="ko">${esc(e.one)}</b><br>${esc(e.k)} ↔ ${esc(e.end)}</span>`,
      after: e.one
    };
  });
  const nm = Math.min(3, merge.length);
  return shuffle(fill.slice(0, n - nm).concat(merge.slice(0, nm)));
}

export function connPage(el) {
  el.innerHTML = `<div class="stack conn">
    <div class="lq-top"><button type="button" class="btn" data-c="quiz">連接詞測驗</button>
      <select class="cq-lv" aria-label="程度"><option value="all">全部程度</option><option value="初級">只考初級</option><option value="中級">只考中級</option></select>
      <span class="muted">例句挖空選連接詞，和連接詞換成語尾</span></div>
    <section class="block lq" hidden><h3>連接詞測驗<button type="button" class="btn ghost small" data-c="close">收起</button></h3><div class="qcard qbox"></div></section>
    <p class="intro">連接詞（접속 부사）放在兩個句子中間，告訴對方前後句是什麼關係：添加、因果、轉折、條件…。點連接詞或例句可以聽發音；標「中級」的多用在文章或比較正式的場合。</p>
    <div class="chip-row conn-nav">${GROUPS.map(g => `<a class="chip" href="#cg-${g.id}">${esc(g.name)}</a>`).join('')}<a class="chip" href="#cg-end">連結語尾對照</a><a class="chip" href="#cg-tips">容易混淆</a></div>
    ${GROUPS.map(g => `<section class="block" id="cg-${g.id}"><h3>${esc(g.name)}<small>${esc(g.zh)}</small></h3>
      <div class="conn-list">${g.items.map(it => `<div class="conn-item">
        <div class="conn-h"><button type="button" class="fm conn-k" data-say="${esc(it.k)}" lang="ko">${esc(it.k)}</button><span class="conn-zh">${esc(it.zh)}</span><span class="conn-lv ${it.lv === '初級' ? 'b' : 'm'}">${it.lv}</span>${nvBtn(it.k)}</div>
        <p class="muted conn-note">${esc(it.note)}</p>
        <div class="conn-ex">${sayBtn(full(it))}<span><span lang="ko">${esc(it.ex[0])} <b>${esc(it.k)}</b> ${esc(it.ex[1])}</span><br><small class="muted">${esc(it.ex[2])}</small></span></div>
      </div>`).join('')}</div></section>`).join('')}
    <section class="block" id="cg-end"><h3>連接詞 ↔ 連結語尾<small>兩個句子可以用語尾合成一句</small></h3>
      <div class="conn-ends">${ENDINGS.map(e => `<div class="conn-end"><div class="conn-end-h"><b lang="ko">${esc(e.k)}</b><span aria-hidden="true">→</span><b lang="ko" class="conn-end-e">${esc(e.end)}</b></div>
        <p lang="ko" class="muted">${esc(e.a[0])} <b>${esc(e.a[1])}</b> ${esc(e.a[2])}</p>
        <p class="conn-one">${sayBtn(e.one)}<span lang="ko">${esc(e.one)}</span></p></div>`).join('')}</div>
      <p class="note">連結語尾的詳細用法在「課程」各課的文法說明裡。</p></section>
    <section class="block" id="cg-tips"><h3>容易混淆的地方</h3><ul class="rules">${TIPS.map(([t, d]) => `<li><b>${esc(t)}</b>：<span lang="ko">${esc(d)}</span></li>`).join('')}</ul></section>
  </div>`;
  const box = $('.qbox', el), sec = $('.lq', el), lv = $('.cq-lv', el);
  const start = () => runQuiz(box, buildQuiz(10, lv.value), 'best_conn_' + lv.value, start);
  el.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#cg-"]');
    if (a) { e.preventDefault(); el.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const c = e.target.closest('[data-c]'); if (!c) return;
    if (c.dataset.c === 'close') { sec.hidden = true; return; }
    sec.hidden = false; sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); start();
  });
  lv.onchange = () => { if (!sec.hidden) start(); };
}
