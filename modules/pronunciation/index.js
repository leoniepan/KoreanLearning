// 單元：發音規則
import { esc, shuffle } from '../../js/core/dom.js';
import { pronWord } from '../../js/core/hangul.js';
import { SPK, sayBtn } from '../../js/core/speech.js';
import { lessonPage } from '../../js/core/lesson.js';
import { runQuiz } from '../../js/core/quiz.js';
import { RULES, PL } from './lessons.js';
import { PQ } from './quiz-data.js';

export function buildQuiz(f) {
  const pool = shuffle(f === 'all' ? PQ : PQ.filter(q => q.r === f));
  const rk = Object.keys(RULES);
  const mk = {
    pron: q => { const p = pronWord(q.w); return { word: q.w, type: '選出正確發音', prompt: `<div class="qw hg" lang="ko">${esc(q.w)}</div><p>實際念成哪一個？</p>`, options: shuffle([p, ...q.wr].map(x => ({ v: x, h: `<span lang="ko">[${esc(x)}]</span>` }))), ans: p, exp: `${sayBtn(q.w)}<span><b lang="ko">${esc(q.w)}</b> → <b lang="ko">[${esc(p)}]</b>　${RULES[q.r]}</span>`, after: q.w }; },
    rule: q => { const p = pronWord(q.w); return { word: q.w, type: '判斷規則', prompt: `<div class="qw hg" lang="ko">${esc(q.w)} → [${esc(p)}]</div><p>這個變化是哪一條規則？</p>`, options: shuffle([q.r, ...shuffle(rk.filter(r => r !== q.r)).slice(0, 3)]).map(r => ({ v: r, h: RULES[r] })), ans: q.r, exp: `<span>${RULES[q.r]}：${PL.find(l => l.id === q.r).sum}</span>`, after: q.w }; },
    listen: q => { const others = shuffle(PQ.filter(x => x.w !== q.w)).slice(0, 3).map(x => x.w); return { word: q.w, type: '聽音選字', prompt: `<p>聽發音，選出正確的拼寫</p><button type="button" class="btn big" data-say="${esc(q.w)}">${SPK}再播一次</button>`, options: shuffle([q.w, ...others]).map(x => ({ v: x, h: `<span class="hg" lang="ko">${esc(x)}</span>` })), ans: q.w, exp: `${sayBtn(q.w)}<span><b lang="ko">${esc(q.w)}</b> 念 <b lang="ko">[${esc(pronWord(q.w))}]</b>　${RULES[q.r]}</span>`, auto: q.w }; }
  };
  const plan = f === 'all' ? ['pron', 'pron', 'pron', 'pron', 'pron', 'rule', 'rule', 'rule', 'listen', 'listen'] : ['pron', 'pron', 'pron', 'pron', 'pron', 'pron', 'listen', 'listen', 'listen', 'listen'];
  return shuffle(plan.map((t, i) => mk[t](pool[i % pool.length])));
}

function quizPage(el, ctx) {
  el.innerHTML = `<div class="qwrap"><p class="intro">每回 10 題：選出正確發音、判斷用到哪條規則、聽音選字。答完會列出錯題和說明。</p><div class="qctl"><select class="qf" aria-label="範圍"><option value="all">全部規則（綜合）</option>${Object.entries(RULES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><button type="button" class="btn qs-start">開始新的一回</button></div><div class="qcard qbox"></div></div>`;
  const sel = el.querySelector('.qf'), box = el.querySelector('.qbox');
  if (ctx.params.filter && RULES[ctx.params.filter]) sel.value = ctx.params.filter;
  const start = () => runQuiz(box, buildQuiz(sel.value), 'best_pq_' + sel.value, start);
  el.querySelector('.qs-start').onclick = start; sel.onchange = start;
  start();
}

export default {
  id: 'pron',
  title: '發音規則',
  ko: '발음',
  pages: [
    { id: 'learn', title: '學習', render: lessonPage({ lessons: PL, doneKey: 'done', curKey: 'lesson', quizRoute: 'pron-quiz' }) },
    { id: 'quiz', title: '測驗', render: quizPage }
  ]
};
