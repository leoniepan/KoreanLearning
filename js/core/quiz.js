// 通用測驗流程：一題一題作答、即時回饋、最後顯示分數與錯題回顧
// onDone(score, total)：選填，作答完成時呼叫
// 題目格式：{type, prompt(html), options:[{v, h(html)}], ans, exp(html), word?, auto?(出題時朗讀), after?(作答後朗讀), key?(題目代號)}
// 每一題的作答都會交給 sync.js 記錄（我的紀錄、錯題本、管理頁會用到）。
import { qa } from './dom.js';
import { LS } from './storage.js';
import { say, nvBtn, userJustActed } from './speech.js';
import { recordAttempt } from './sync.js';

// 把題目的 HTML 轉成純文字存檔（不存 HTML，避免在管理頁顯示時被注入程式碼）
function toText(html) {
  const d = document.createElement('div'); d.innerHTML = html;
  d.querySelectorAll('button').forEach(b => b.remove());
  d.querySelectorAll('div,p,li,br,h1,h2,h3,h4').forEach(e => e.after(' '));
  return d.textContent.replace(/\s+/g, ' ').trim();
}

export function runQuiz(root, qs, key, restart, onDone) {
  const st = { i: 0, score: 0, wrong: [], answered: false, log: [] };
  function draw() {
    if (st.i >= qs.length) {
      const best = Math.max(LS.get(key, 0), st.score); LS.set(key, best);
      if (onDone) onDone(st.score, qs.length);
      recordAttempt(st.log);
      const pct = st.score / qs.length;
      root.innerHTML = `<div class="result"><p class="eyebrow">這一回的結果</p><div class="score"><b>${st.score}</b> / ${qs.length}</div><p>${pct >= 0.9 ? '很好，這部分已經掌握了。' : pct >= 0.7 ? '大致理解了，把下面的錯題再看一次。' : '建議回到學習頁再練一次，然後再來挑戰。'}</p><p class="muted">最佳紀錄 ${best} / ${qs.length}</p>${st.wrong.length ? `<h3 style="font-size:16px">錯題回顧</h3><ol class="review">${st.wrong.map(q => `<li><div class="qprompt">${q.prompt}</div><div class="ans">正確答案：${q.options.find(o => o.v === q.ans).h}</div>${q.word ? `<div>${nvBtn(q.word)}</div>` : ''}<div class="exp">${q.exp}</div></li>`).join('')}</ol>` : ''}<button type="button" class="btn" data-q="again">再測一回</button></div>`;
      return;
    }
    const q = qs[st.i]; st.answered = false;
    root.innerHTML = `<div class="qhead"><span>第 ${st.i + 1} / ${qs.length} 題</span><span>答對 ${st.score}</span></div><div class="qbar"><i style="width:${st.i / qs.length * 100}%"></i></div><div class="qtype">${q.type}</div><div class="qprompt">${q.prompt}</div><div class="opts">${q.options.map((o, j) => `<button type="button" class="opt" data-o="${j}">${o.h}</button>`).join('')}</div><div class="fb" aria-live="polite"></div>`;
    // 聽力題：使用者剛按了頁面裡的按鈕（開始、作答、下一題）才自動播放；剛打開頁面時不自動出聲
    if (q.auto && userJustActed()) setTimeout(() => say(q.auto), 200);
  }
  root.onclick = e => {
    const b = e.target.closest('[data-o]');
    if (b && !st.answered) {
      st.answered = true;
      const q = qs[st.i], o = q.options[+b.dataset.o], ok = o.v === q.ans;
      if (ok) st.score++; else st.wrong.push(q);
      const correct = toText(q.options.find(x => x.v === q.ans).h);
      st.log.push({
        key: q.key || `${q.type}|${q.word || ''}|${correct}`,
        label: q.label || toText(q.type), prompt: toText(q.prompt), audio: q.auto || '',
        chosen: toText(o.h), correct, ok, word: q.word || '',
        opts: q.options.map(x => toText(x.h))
      });
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
