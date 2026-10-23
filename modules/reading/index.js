// 每日短文：依網路文章改寫的 1A～4B 程度短文，可以逐句聽、看翻譯、查生詞，最後做閱讀測驗
import { $, esc, shuffle } from '../../js/core/dom.js';
import { LS } from '../../js/core/storage.js';
import { sayLines, nvBtn, SPK } from '../../js/core/speech.js';
import { runQuiz } from '../../js/core/quiz.js';
import { BOOKS } from '../../js/core/progress.js';
import { READING } from './bank.js';

const idOf = r => `${r.date}-${r.level}`;
const tier = l => BOOKS.indexOf(l) < 4 ? 'b' : 'm'; // 1A～2B 初級，3A～4B 中級
const TIERS = [['all', '全部'], ['b', '初級 1A～2B'], ['m', '中級 3A～4B']];

function toQ(it, r) {
  return {
    type: '閱讀測驗',
    key: 'reading|' + idOf(r) + '|' + it.p,
    word: null,
    prompt: `<p>${esc(it.p)}</p>`,
    options: shuffle(it.opts).map(o => ({ v: o, h: `<span lang="ko">${esc(o)}</span>` })),
    ans: it.a,
    exp: it.exp ? `<span lang="ko">${esc(it.exp)}</span>` : ''
  };
}

export function readingPage(el) {
  const done = new Set(LS.get('done_reading', []));
  let t = LS.get('reading_tier', 'all');
  const list = () => READING.filter(r => t === 'all' || tier(r.level) === t).slice().sort((a, b) => b.date.localeCompare(a.date) || BOOKS.indexOf(a.level) - BOOKS.indexOf(b.level));
  let cur = list()[0] ? idOf(list()[0]) : null;

  el.innerHTML = `<div class="stack rd">
    <p class="intro">每天兩篇：一篇初級、一篇中級。短文是依照韓國網站上有趣的文章，改寫成課本程度的學習短文；下方附原文連結。點句子可以聽，最後做閱讀測驗。</p>
    <div class="chip-row rd-tiers" role="group" aria-label="程度">${TIERS.map(([k, n]) => `<button type="button" class="chip" data-t="${k}" aria-pressed="${k === t}">${n}</button>`).join('')}</div>
    <div class="rd-grid"><aside class="rd-list"></aside><article class="rd-art"></article></div>
  </div>`;
  const listEl = $('.rd-list', el), art = $('.rd-art', el);

  function drawList() {
    const rs = list();
    if (!rs.find(r => idOf(r) === cur)) cur = rs[0] ? idOf(rs[0]) : null;
    listEl.innerHTML = rs.length ? rs.map(r => `<button type="button" class="rd-item${idOf(r) === cur ? ' on' : ''}" data-r="${idOf(r)}"><span class="rd-lv">${r.level}</span><span class="rd-it"><b lang="ko">${esc(r.title)}</b><small>${r.date}・${esc(r.topic)}</small></span><span class="ck">${done.has(idOf(r)) ? '✓' : ''}</span></button>`).join('') : '<p class="muted">這個程度還沒有短文。</p>';
    const on = listEl.querySelector('.on');
    if (on && listEl.scrollWidth > listEl.clientWidth) listEl.scrollLeft = on.offsetLeft - 16;
  }
  function drawArt() {
    const r = READING.find(x => idOf(x) === cur);
    if (!r) { art.innerHTML = ''; return; }
    const showZh = LS.get('reading_zh', false);
    art.innerHTML = `
      <header class="lh"><p class="eyebrow">${r.date}・${r.level} 程度・${esc(r.topic)}</p><h2 lang="ko">${esc(r.title)}</h2><p class="muted">${esc(r.zhTitle)}</p>
        <div class="lq-top"><button type="button" class="btn" data-a="quiz">閱讀測驗</button><button type="button" class="btn ghost" data-a="all">${SPK} 朗讀全文</button><label class="rd-zh"><input type="checkbox" data-a="zh"${showZh ? ' checked' : ''}> 顯示中文翻譯</label></div></header>
      <section class="block lq" hidden><h3>閱讀測驗<button type="button" class="btn ghost small" data-a="close">收起</button></h3><div class="qcard qbox"></div></section>
      <section class="block rd-text">${r.text.map((s, i) => `<p class="rd-s"><button type="button" class="rd-ko" data-say="${esc(s)}" lang="ko">${esc(s)}</button>${showZh && r.zh && r.zh[i] ? `<span class="rd-tr">${esc(r.zh[i])}</span>` : ''}</p>`).join('')}</section>
      ${r.words && r.words.length ? `<section class="block"><h3>生詞<small>點單字聽發音</small></h3><div class="voc-grid">${r.words.map(([k, z]) => `<div class="voc"><button type="button" class="fm" data-say="${esc(k)}"><span class="hg" lang="ko">${esc(k)}</span></button><span class="voc-zh">${esc(z)}</span>${nvBtn(k)}</div>`).join('')}</div></section>` : ''}
      ${r.source ? `<p class="note rd-src">參考來源：<a href="${esc(r.source.url)}" target="_blank" rel="noopener noreferrer">${esc(r.source.name)}</a>（本篇是依原文內容改寫的學習短文，不是原文）</p>` : ''}
      <div class="lnav"><button type="button" class="btn" data-a="done">${done.has(idOf(r)) ? '已讀完，下一篇' : '讀完了，下一篇'}</button></div>`;
  }
  function go(id) { cur = id; drawList(); drawArt(); }

  el.addEventListener('click', e => {
    const tb = e.target.closest('[data-t]');
    if (tb) { t = tb.dataset.t; LS.set('reading_tier', t); el.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b === tb)); drawList(); drawArt(); return; }
    const it = e.target.closest('[data-r]');
    if (it) { go(it.dataset.r); if (window.innerWidth < 860) art.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    const r = READING.find(x => idOf(x) === cur); if (!r) return;
    if (a.dataset.a === 'all') sayLines(r.text);
    if (a.dataset.a === 'close') $('.lq', art).hidden = true;
    if (a.dataset.a === 'quiz') {
      const sec = $('.lq', art), box = $('.qbox', art); sec.hidden = false; sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const start = () => runQuiz(box, shuffle(r.quiz.map(q => toQ(q, r))), 'best_reading_' + idOf(r), start, () => { done.add(idOf(r)); LS.set('done_reading', [...done]); drawList(); });
      start();
    }
    if (a.dataset.a === 'done') {
      done.add(idOf(r)); LS.set('done_reading', [...done]);
      const rs = list(), i = rs.findIndex(x => idOf(x) === cur);
      go(idOf(rs[Math.min(i + 1, rs.length - 1)])); window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  el.addEventListener('change', e => { if (e.target.matches('[data-a=zh]')) { LS.set('reading_zh', e.target.checked); drawArt(); } });
  drawList(); drawArt();
}

// 首頁用：最新一天的短文數
export const latestReading = () => { const d = READING.at(-1)?.date; return { date: d, n: READING.filter(r => r.date === d).length }; };
