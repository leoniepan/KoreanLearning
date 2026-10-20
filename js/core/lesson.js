// 通用「一步步學習」頁：左側課程清單＋進度，右側課程內容＋跟讀練習
// 只要提供課程資料就能產生頁面，發音、問句、文法單元都共用這一份
//
// 課程資料（每一課）可用的欄位，全部都是選填，有填才會顯示：
//   id, name(中文標題), ko(韓文標題), sum(說明)
//   reps:   [[代表音, '來源 收音…'], …]           發音課專用的代表音對照
//   table:  {head:[…], rows:[[…], …]}             一般對照表
//   rules:  ['規則一', '規則二', …]
//   tip:    '補充提示'
//   words:  ['단어', …]                            例詞卡（拼寫／發音／朗讀／Naver）
//   sents:  [['韓文例句', '中文'], …]               實用例句
//   blocks: [{title:'標題', html:'自訂 HTML'}, …]  其他自訂區塊
//   quiz:   [{ko, p, opts, a, exp}, …]             這一課的測驗題（見 lessonQuiz.js）
import { $, esc, shuffle } from './dom.js';
import { LS } from './storage.js';
import { say, sayBtn, nvBtn } from './speech.js';
import { prHTML, wordCard, sentRow, table } from './render.js';

export function lessonPage({ lessons, doneKey, curKey, quizRoute, intro }) {
  return function render(el, ctx) {
    let done = new Set(LS.get(doneKey, []));
    let cur = Math.min(LS.get(curKey, 0), lessons.length - 1);
    if (ctx.params.lesson) { const i = lessons.findIndex(l => l.id === ctx.params.lesson); if (i >= 0) cur = i; }
    el.innerHTML = `${intro ? `<p class="intro" style="margin-bottom:16px">${intro}</p>` : ''}<div class="pgrid"><aside class="rail"><div class="prog"><span class="pgtxt"></span><div class="bar"><i class="pgbar"></i></div></div><ol class="steps"></ol></aside><div class="lesson"></div></div>`;
    const steps = $('.steps', el), body = $('.lesson', el);

    function renderSteps() {
      steps.innerHTML = lessons.map((l, i) => `<li><button type="button" class="step ${i === cur ? 'on' : ''} ${done.has(l.id) ? 'done' : ''}" data-step="${i}"><span class="n">${i + 1}</span><span class="t"><b>${esc(l.name)}</b><small lang="ko">${esc(l.ko || '')}</small></span><span class="ck">${done.has(l.id) ? '✓' : ''}</span></button></li>`).join('');
      $('.pgbar', el).style.width = (done.size / lessons.length * 100) + '%';
      $('.pgtxt', el).textContent = `已完成 ${done.size} / ${lessons.length} 課`;
      const on = steps.querySelector('.on');
      if (on && steps.scrollWidth > steps.clientWidth) steps.scrollLeft = on.parentElement.offsetLeft - (steps.clientWidth - on.offsetWidth) / 2;
    }

    function renderLesson() {
      const l = lessons[cur];
      let rule = '';
      if (l.reps) rule += `<div class="reptable">${l.reps.map(([r, s]) => `<div class="rep"><span class="big">${r}</span><span class="src">← ${s}</span></div>`).join('')}</div>`;
      if (l.table) rule += table(l.table);
      if (l.rules) rule += `<ul class="rules">${l.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`;
      const hasQuiz = quizRoute && (l.quiz ? l.quiz.length : true);
      const items = shuffle(l.words || []).concat(shuffle((l.sents || []).map(s => s[0])).slice(0, l.words ? 3 : 6));
      body.innerHTML = `
      <header class="lh"><p class="eyebrow">第 ${cur + 1} 步${l.ko ? ` · <span lang="ko">${esc(l.ko)}</span>` : ''}</p><h2>${esc(l.name)}</h2>${l.sum ? `<p class="lead">${l.sum}</p>` : ''}</header>
      ${rule || l.tip ? `<div class="block"><h3>規則</h3>${rule}${l.tip ? `<p class="tip">${l.tip}</p>` : ''}</div>` : ''}
      ${l.words ? `<div class="block"><h3>例詞<small>紅色格子是發音和拼寫不同的地方；按 Naver 可在新分頁聽真人發音</small></h3><div class="wcs">${l.words.map(wordCard).join('')}</div></div>` : ''}
      ${l.sents ? `<div class="block"><h3>實用例句<small>先看拼寫自己念，再按喇叭比對</small></h3><ol class="sents">${l.sents.map(s => sentRow(s)).join('')}</ol><p class="note">[ ] 裡是以單字為單位的標準發音；整句連著說時，相鄰單字之間還會再連音。</p></div>` : ''}
      ${(l.blocks || []).map(b => `<div class="block"><h3>${esc(b.title)}</h3>${b.html}</div>`).join('')}
      ${items.length ? `<div class="block"><h3>跟讀練習</h3><div class="pfc"></div></div>` : ''}
      <div class="lnav">
        <button type="button" class="btn ghost" data-l="prev" ${cur === 0 ? 'disabled' : ''}>上一課</button>
        <button type="button" class="btn" data-l="done">${cur === lessons.length - 1 ? (done.has(l.id) ? '已完成全部課程' : '完成全部課程') : '我學會了，下一課'}</button>
        ${hasQuiz ? `<button type="button" class="btn ghost" data-l="quiz">測驗這一課</button>` : ''}
      </div>`;
      if (items.length) flash($('.pfc', body), items);
    }

    function go(i) { cur = i; LS.set(curKey, i); renderSteps(); renderLesson(); }

    steps.onclick = e => {
      const b = e.target.closest('[data-step]'); if (!b) return;
      go(+b.dataset.step);
      if (window.innerWidth < 860) body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    body.addEventListener('click', e => {
      const b = e.target.closest('[data-l]'); if (!b) return;
      if (b.dataset.l === 'prev' && cur > 0) go(cur - 1);
      if (b.dataset.l === 'done') { done.add(lessons[cur].id); LS.set(doneKey, [...done]); go(Math.min(cur + 1, lessons.length - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      if (b.dataset.l === 'quiz') ctx.go(quizRoute, { filter: lessons[cur].id });
    });
    renderSteps(); renderLesson();
  };
}

// 跟讀閃卡：先看字自己念，再顯示發音並朗讀
function flash(box, items) {
  let i = 0, rev = false;
  const draw = () => {
    const w = items[i];
    box.innerHTML = `<div class="fc-card"><p class="fc-q">${i + 1} / ${items.length}　先自己念念看</p><div class="fc-w hg" lang="ko">${esc(w)}</div>${rev ? `<div class="fc-a">${prHTML(w)}${sayBtn(w)}${/\s/.test(w) ? '' : nvBtn(w)}</div>` : '<div class="fc-a muted">想好了再按「顯示發音」</div>'}</div><div class="fc-btns"><button type="button" class="btn" data-fc="rev">${rev ? '再聽一次' : '顯示發音'}</button><button type="button" class="btn ghost" data-fc="next">下一個</button></div>`;
  };
  draw();
  box.onclick = e => {
    const b = e.target.closest('[data-fc]'); if (!b) return;
    if (b.dataset.fc === 'rev') { rev = true; draw(); say(items[i]); }
    else { i = (i + 1) % items.length; rev = false; draw(); }
  };
}
