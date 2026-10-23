// 課程：依世宗韓國語的課別學習。每一課集中該課的詞彙、文法、例句，最後是本課測驗。
// 另有「韓文字母」入門頁。
import { $, esc, shuffle } from '../../js/core/dom.js';
import { LS } from '../../js/core/storage.js';
import { pronSentence } from '../../js/core/hangul.js';
import { sayBtn, nvBtn } from '../../js/core/speech.js';
import { diffHTML } from '../../js/core/render.js';
import { lessonBlocks } from '../../js/core/lesson.js';
import { itemToQ } from '../../js/core/lessonQuiz.js';
import { runQuiz } from '../../js/core/quiz.js';
import { forms } from '../../js/core/conjugate.js';
import { BOOKS, UNITS } from '../../js/core/progress.js';
import { ALL as GRAMMAR } from '../grammar/index.js';
import { W } from '../verbs/words.js';
import { N } from '../nouns/nouns.js';
import { buildQuiz as verbQuiz } from '../verbs/index.js';
import { buildQuiz as nounQuiz } from '../nouns/index.js';
import { chartPage } from '../hangul/index.js';
import { THEMES, LINKS } from './themes.js';

const key = (b, u) => `${b}-${u}`;
const gramOf = (b, u) => GRAMMAR.filter(l => l.book === b && l.unit === u);
const titleOf = (b, u) => { const g = gramOf(b, u).find(l => l.ko && !l.ko.includes('어휘')); return g ? g.ko.replace(/^\d+과 · /, '') : ''; };
const vocabOf = (b, u) => ({ nouns: N.filter(n => n.l === b && n.u === u), verbs: W.filter(w => w.l === b && w.u === u) });
const pr = w => `<span class="pr">[${diffHTML(w, pronSentence(w))}]</span>`;

function vocabHTML(b, u) {
  const { nouns, verbs } = vocabOf(b, u);
  if (!nouns.length && !verbs.length) return '';
  const tile = (k, zh, sub) => `<div class="voc"><button type="button" class="fm" data-say="${esc(k)}"><span class="hg" lang="ko">${esc(k)}</span>${pr(k)}</button><span class="voc-zh">${esc(zh)}${sub ? `<br><small class="muted" lang="ko">${esc(sub)}</small>` : ''}</span>${nvBtn(k.replace(' ', ''))}</div>`;
  return `<section class="block"><h3>詞彙<small>點單字聽發音；動詞、形容詞下方是現在式</small></h3>
    ${nouns.length ? `<h4 class="voc-h">名詞</h4><div class="voc-grid">${nouns.map(n => tile(n.k, n.zh)).join('')}</div>` : ''}
    ${verbs.length ? `<h4 class="voc-h">動詞・形容詞</h4><div class="voc-grid">${verbs.map(w => tile(w.k, w.zh, forms(w).pres)).join('')}</div>` : ''}
  </section>`;
}

// 本課測驗：文法題＋詞彙題，最多 10 題
function lessonQuiz(b, u) {
  const g = gramOf(b, u);
  const gq = shuffle(g.flatMap(l => (l.quiz || []).map(it => itemToQ(it, l))));
  const { nouns, verbs } = vocabOf(b, u);
  const vq = [...(nouns.length >= 2 ? nounQuiz(nouns).slice(0, 3) : []), ...(verbs.length >= 2 ? verbQuiz(verbs).slice(0, 3) : [])];
  const nG = Math.max(10 - vq.length, Math.min(gq.length, 6));
  return shuffle(gq.slice(0, nG).concat(vq)).slice(0, 10);
}

function bookPage(book) {
  const units = Array.from({ length: UNITS[book] }, (_, i) => i + 1);
  return function render(el, ctx) {
    let done = new Set(LS.get('done_course', []));
    let cur = LS.get('course_cur_' + book, 1);
    const p = ctx.params.lesson;
    if (p) { const m = /^(\d[AB])-(\d+)$/.exec(p) || null; const g = GRAMMAR.find(l => l.id === p); if (m && m[1] === book) cur = +m[2]; else if (g && g.book === book) cur = g.unit === 99 ? units.length : g.unit; }
    cur = Math.min(Math.max(cur, 1), units.length);
    el.innerHTML = `<div class="pgrid"><aside class="rail"><div class="prog"><span class="pgtxt"></span><div class="bar"><i class="pgbar"></i></div></div><ol class="steps"></ol></aside><div class="lesson"></div></div>`;
    const steps = $('.steps', el), body = $('.lesson', el);

    function drawSteps() {
      steps.innerHTML = units.map(u => { const k = key(book, u); return `<li><button type="button" class="step ${u === cur ? 'on' : ''} ${done.has(k) ? 'done' : ''}" data-u="${u}"><span class="n">${u}</span><span class="t"><b lang="ko">${esc(titleOf(book, u))}</b><small>${esc((THEMES[k] || [])[1] || '')}</small></span><span class="ck">${done.has(k) ? '✓' : ''}</span></button></li>`; }).join('');
      const n = units.filter(u => done.has(key(book, u))).length;
      $('.pgbar', el).style.width = (n / units.length * 100) + '%';
      $('.pgtxt', el).textContent = `${book} 已完成 ${n} / ${units.length} 課`;
      const on = steps.querySelector('.on');
      if (on && steps.scrollWidth > steps.clientWidth) steps.scrollLeft = on.parentElement.offsetLeft - (steps.clientWidth - on.offsetWidth) / 2;
    }
    function drawLesson() {
      const k = key(book, cur), th = THEMES[k] || ['', ''], g = gramOf(book, cur).filter(l => !l.ko.includes('어휘'));
      const supp = cur === units.length ? GRAMMAR.filter(l => l.book === book && l.unit === 99) : [];
      const links = LINKS[k] || [];
      body.innerHTML = `
        <header class="lh"><p class="eyebrow">${book} 第 ${cur} 課</p><h2 lang="ko">${esc(titleOf(book, cur))}</h2>
          <div class="lchips"><span class="lchip">詞彙主題：<b lang="ko">${esc(th[0])}</b> ${esc(th[1])}</span>${g.map(l => `<a class="lchip gram" href="#g-${l.id}">${esc(l.name)}</a>`).join('')}</div></header>
        ${vocabHTML(book, cur)}
        ${g.concat(supp).map((l, i) => `<section class="gsec" id="g-${l.id}"><h3 class="gsec-h"><span class="gnum">文法 ${i + 1}</span>${esc(l.name)}</h3>${l.sum ? `<p class="lead">${l.sum}</p>` : ''}${lessonBlocks(l)}</section>`).join('')}
        ${links.length ? `<section class="block"><h3>延伸</h3><div class="chip-row">${links.map(([r, t, sub]) => `<button type="button" class="chip" data-link="${r}" data-sub="${sub || ''}">${esc(t)}</button>`).join('')}</div></section>` : ''}
        <section class="block lq"><h3>本課測驗<small>文法和詞彙，最多 10 題</small></h3><div class="qcard qbox"><button type="button" class="btn" data-lq="start">開始本課測驗</button></div></section>
        <div class="lnav">
          <button type="button" class="btn ghost" data-l="prev" ${cur === 1 ? 'disabled' : ''}>上一課</button>
          <button type="button" class="btn" data-l="done">${done.has(k) ? '已完成，下一課' : '完成本課，下一課'}</button>
        </div>`;
    }
    function go(u) { cur = u; LS.set('course_cur_' + book, u); drawSteps(); drawLesson(); }
    steps.onclick = e => { const b = e.target.closest('[data-u]'); if (!b) return; go(+b.dataset.u); if (window.innerWidth < 860) body.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    body.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#g-"]');
      if (a) { e.preventDefault(); body.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const l = e.target.closest('[data-l]');
      if (l) {
        if (l.dataset.l === 'prev' && cur > 1) go(cur - 1);
        if (l.dataset.l === 'done') { done.add(key(book, cur)); LS.set('done_course', [...done]); go(Math.min(cur + 1, units.length)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        return;
      }
      const q = e.target.closest('[data-lq]');
      if (q) { const box = $('.lq .qbox', body); const start = () => { const qs = lessonQuiz(book, cur); if (!qs.length) { box.innerHTML = '<p class="muted">這一課還沒有測驗題。</p>'; return; } runQuiz(box, qs, 'best_course_' + key(book, cur), start); }; start(); return; }
      const k = e.target.closest('[data-link]');
      if (k) ctx.go(k.dataset.link, k.dataset.sub ? { sub: k.dataset.sub } : {});
    });
    drawSteps(); drawLesson();
  };
}

function hangulPage(el, ctx) { chartPage(el, { go: ctx.go, quizRoute: 'practice-hangul' }); }

// 完成的課數（首頁用）
export const courseProgress = () => { const d = LS.get('done_course', []); return { done: d.length, total: BOOKS.reduce((n, b) => n + UNITS[b], 0) }; };
export const lessonTitle = titleOf;

export default {
  id: 'course',
  title: '課程',
  ko: '수업',
  icon: 'book',
  glyph: '수',
  desc: '依世宗韓國語的課別學習：每課的詞彙、文法、例句和本課測驗',
  pages: [
    { id: 'hangul', title: '韓文字母', render: hangulPage },
    ...BOOKS.map(b => ({ id: b.toLowerCase(), title: b, render: bookPage(b) }))
  ]
};
