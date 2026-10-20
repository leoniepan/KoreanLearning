// 通用測驗頁：直接使用課程資料裡的 quiz 題目，不用另外寫程式
//
// 題目格式（放在每一課的 quiz 陣列裡）：
//   ko:   '＿ 시예요?'    要顯示的韓文句子，＿ 代表空格（可省略）
//   p:    '問現在幾點'     中文題目說明
//   opts: ['몇','뭐','언제','어디']   選項（會自動打亂順序）
//   a:    '몇'            正確答案（必須是 opts 其中之一）
//   exp:  '몇 + 量詞…'     作答後的說明（可省略）
//   word: '몇'            錯題回顧時附上 Naver 按鈕要查的字（可省略；語尾、助詞類的題目不要填）
import { $, esc, shuffle } from './dom.js';
import { sayBtn } from './speech.js';
import { prHTML } from './render.js';
import { runQuiz } from './quiz.js';

export function itemToQ(it, lesson) {
  const full = it.ko ? (it.ko.includes('＿') ? it.ko.replace('＿', it.a) : it.ko) : it.a;
  const shown = it.ko ? esc(it.ko).replace('＿', '<span class="blank">　？　</span>') : '';
  return {
    type: lesson.name,
    word: it.word || null,
    prompt: `${it.p ? `<p>${esc(it.p)}</p>` : ''}${shown ? `<div class="qs" lang="ko">${shown}</div>` : ''}`,
    options: shuffle(it.opts).map(o => ({ v: o, h: `<span class="hg" lang="ko">${esc(o)}</span>` })),
    ans: it.a,
    exp: `${sayBtn(full)}<span><b lang="ko">${esc(full)}</b> ${prHTML(full)}${it.exp ? `<br>${esc(it.exp)}` : ''}</span>`,
    after: full
  };
}

export function lessonQuizPage({ lessons, key, count = 10, intro }) {
  const withQuiz = lessons.filter(l => l.quiz && l.quiz.length);
  return function render(el, ctx) {
    el.innerHTML = `<div class="qwrap">${intro ? `<p class="intro">${intro}</p>` : ''}<div class="qctl"><select class="qf" aria-label="範圍"><option value="all">全部課程（綜合）</option>${withQuiz.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select><button type="button" class="btn qs-start">開始新的一回</button></div><div class="qcard qbox"></div></div>`;
    const sel = $('.qf', el), box = $('.qbox', el);
    if (ctx.params.filter && withQuiz.some(l => l.id === ctx.params.filter)) sel.value = ctx.params.filter;
    const start = () => {
      const ls = sel.value === 'all' ? withQuiz : withQuiz.filter(l => l.id === sel.value);
      const pool = shuffle(ls.flatMap(l => l.quiz.map(it => [it, l])));
      const qs = pool.slice(0, count).map(([it, l]) => itemToQ(it, l));
      runQuiz(box, qs, key + '_' + sel.value, start);
    };
    $('.qs-start', el).onclick = start; sel.onchange = start;
    start();
  };
}
