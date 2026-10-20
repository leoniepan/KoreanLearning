// 通用測驗流程：一題一題作答、即時回饋、最後顯示分數與錯題回顧
// onDone(score, total)：選填，作答完成時呼叫
// 題目格式：{type, prompt(html), options:[{v, h(html)}], ans, exp(html), word?, auto?(出題時朗讀), after?(作答後朗讀)}
import { qa } from './dom.js';
import { LS } from './storage.js';
import { say, nvBtn } from './speech.js';

export function runQuiz(root, qs, key, restart, onDone) {
  const st = { i: 0, score: 0, wrong: [], answered: false };
  function draw() {
    if (st.i >= qs.length) {
      const best = Math.max(LS.get(key, 0), st.score); LS.set(key, best);
      if (onDone) onDone(st.score, qs.length);
      const pct = st.score / qs.length;
      root.innerHTML = `<div class="result"><p class="eyebrow">這一回的結果</p><div class="score"><b>${st.score}</b> / ${qs.length}</div><p>${pct >= 0.9 ? '很好，這部分已經掌握了。' : pct >= 0.7 ? '大致理解了，把下面的錯題再看一次。' : '建議回到學習頁再練一次，然後再來挑戰。'}</p><p class="muted">最佳紀錄 ${best} / ${qs.length}</p>${st.wrong.length ? `<h3 style="font-size:16px">錯題回顧</h3><ol class="review">${st.wrong.map(q => `<li><div class="qprompt">${q.prompt}</div><div class="ans">正確答案：${q.options.find(o => o.v === q.ans).h}</div>${q.word ? `<div>${nvBtn(q.word)}</div>` : ''}<div class="exp">${q.exp}</div></li>`).join('')}</ol>` : ''}<button type="button" class="btn" data-q="again">再測一回</button></div>`;
      return;
    }
    const q = qs[st.i]; st.answered = false;
    root.innerHTML = `<div class="qhead"><span>第 ${st.i + 1} / ${qs.length} 題</span><span>答對 ${st.score}</span></div><div class="qbar"><i style="width:${st.i / qs.length * 100}%"></i></div><div class="qtype">${q.type}</div><div class="qprompt">${q.prompt}</div><div class="opts">${q.options.map((o, j) => `<button type="button" class="opt" data-o="${j}">${o.h}</button>`).join('')}</div><div class="fb" aria-live="polite"></div>`;
    if (q.auto) setTimeout(() => say(q.auto), 200);
  }
  root.onclick = e => {
    const b = e.target.closest('[data-o]');
    if (b && !st.answered) {
      st.answered = true;
      const q = qs[st.i], o = q.options[+b.dataset.o], ok = o.v === q.ans;
      if (ok) st.score++; else st.wrong.push(q);
      qa(root, '.opt').forEach((x, j) => { x.disabled = true; if (q.options[j].v === q.ans) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      root.querySelector('.fb').innerHTML = `<p class="${ok ? 'okm' : 'badm'}">${ok ? '答對了！' : '不對，正確答案已標出。'}</p><div class="exp">${q.exp}</div><div><button type="button" class="btn" data-q="next">${st.i === qs.length - 1 ? '看結果' : '下一題'}</button></div>`;
      if (q.after) say(q.after);
      return;
    }
    const n = e.target.closest('[data-q]');
    if (n) { if (n.dataset.q === 'next') { st.i++; draw(); } else restart(); }
  };
  draw();
}
