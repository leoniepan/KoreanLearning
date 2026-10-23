// 單元：我的紀錄（總覽、錯題本）與管理頁（只有管理者看得到）
import { $, esc, shuffle } from '../../js/core/dom.js';
import { SPK, sayBtn, nvBtn } from '../../js/core/speech.js';
import { runQuiz } from '../../js/core/quiz.js';
import { sync, myStats, apiGet, apiDownload } from '../../js/core/sync.js';

const pct = (c, n) => n ? Math.round(c / n * 100) : 0;
const fmtTime = iso => new Date(iso).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '—';
const hasKo = s => /[가-힣]/.test(s || '');
const NAMES = { reading: '每日短文', daily: '今日測驗', pron: '發音規則', verbs: '動詞・形容詞', nouns: '名詞', numbers: '數字', grammar: '文法', topik: 'TOPIK', hangul: '韓文字母', course: '課程測驗' };
const titleOf = (ctx, id) => id === 'records' ? '錯題重練' : (NAMES[id] || ctx.modules?.find(m => m.id === id)?.title || id || '其他');

function banner() {
  if (sync.mode === 'online') return `<div class="banner ok"><b>已登入 ${esc(sync.me.email)}</b>　你的作答會同步到雲端，換裝置登入也看得到。管理者可以看到每位使用者的練習紀錄。</div>`;
  if (sync.mode === 'signedout') return `<div class="banner warn"><b>尚未登入</b>　目前的紀錄只存在這台裝置。登入後才會同步到雲端。</div>`;
  if (sync.mode === 'error') return `<div class="banner warn"><b>雲端紀錄暫時無法使用</b>　${esc(sync.error || '')} 目前先顯示這台裝置上的紀錄。</div>`;
  return `<div class="banner"><b>離線模式</b>　這個版本沒有連到雲端，紀錄只存在這台裝置的瀏覽器（最近 300 回）。網站搬到 Azure 並登入後，就會自動同步。</div>`;
}

// 近 30 天每天作答題數的長條圖
function bars(daily) {
  const map = new Map(daily.map(d => [d.date, d]));
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(Date.now() - (29 - i) * 86_400_000); return d.toLocaleDateString('sv-SE'); });
  const max = Math.max(1, ...days.map(d => map.get(d)?.answers || 0));
  return `<div class="bars" role="img" aria-label="近 30 天每天作答題數">${days.map((d, i) => {
    const x = map.get(d), n = x?.answers || 0;
    return `<div class="bar" title="${d}：${n} 題${n ? `，正確率 ${pct(x.correct, n)}%` : ''}"><i style="height:${n / max * 100}%"></i>${i % 7 === 2 || i === 29 ? `<span>${+d.slice(5, 7)}/${+d.slice(8)}</span>` : ''}</div>`;
  }).join('')}</div>`;
}

function statsHTML(st, ctx, { admin = false } = {}) {
  const t = st.totals;
  if (!t.attempts) return `<div class="empty"><p><b>還沒有練習紀錄。</b></p><p class="muted">${admin ? '這位使用者還沒有做過測驗。' : '到任何一個單元做一回測驗，結果就會出現在這裡。'}</p>${admin ? '' : '<button type="button" class="btn" data-go="daily-quiz">做今日測驗</button>'}</div>`;
  const activeDays = st.daily.filter(d => d.answers).length;
  return `
  <div class="kpis">
    <div class="kpi"><span>練習次數</span><b>${t.attempts}</b><small>回</small></div>
    <div class="kpi"><span>作答題數</span><b>${t.answers}</b><small>題</small></div>
    <div class="kpi"><span>正確率</span><b>${pct(t.correct, t.answers)}</b><small>%</small></div>
    <div class="kpi"><span>近 30 天練習</span><b>${activeDays}</b><small>天</small></div>
  </div>
  <section class="block"><h3>近 30 天<small>每天作答的題數</small></h3>${bars(st.daily)}</section>
  <div class="rec-grid">
    <section class="block"><h3>各單元正確率</h3>
      <ul class="meters">${st.byModule.map(m => `<li><span class="m-name">${esc(titleOf(ctx, m.module))}</span><span class="meter" role="img" aria-label="正確率 ${pct(m.correct, m.answers)}%"><i style="width:${pct(m.correct, m.answers)}%" class="${pct(m.correct, m.answers) >= 80 ? 'good' : pct(m.correct, m.answers) >= 60 ? 'mid' : 'low'}"></i></span><span class="m-num">${pct(m.correct, m.answers)}%<small>${m.correct}/${m.answers}</small></span></li>`).join('')}</ul>
    </section>
    <section class="block"><h3>最近的練習</h3>
      <ol class="rec-list">${st.recent.map(r => `<li><span class="muted">${fmtTime(r.finishedAt)}</span><span class="r-title">${esc(r.title || titleOf(ctx, r.module))}</span><b class="${pct(r.score, r.total) >= 80 ? 'good' : pct(r.score, r.total) >= 60 ? 'mid' : 'low'}">${r.score}/${r.total}</b></li>`).join('')}</ol>
    </section>
  </div>`;
}

function mistakeCards(list) {
  return `<ol class="mist">${list.map(m => `<li class="mist-card">
    <p class="eyebrow">${esc(m.label)}</p>
    <p class="m-prompt">${esc(m.prompt)}</p>
    <div class="m-ans"><span>正確答案</span><b class="hg good" lang="ko">${esc(m.correct)}</b>${hasKo(m.correct) ? sayBtn(m.correct) : ''}${m.audio ? `<button type="button" class="btn ghost small" data-say="${esc(m.audio)}">${SPK} 題目發音</button>` : ''}${m.word ? nvBtn(m.word) : ''}</div>
    <div class="m-ans"><span>上次選了</span><b class="hg low" lang="ko">${esc(m.lastChosen || '—')}</b></div>
    <p class="muted m-meta">答錯 ${m.wrong} 次・答對 ${m.right} 次・最近 ${fmtTime(m.lastAt)}</p>
  </li>`).join('')}</ol>`;
}

// ---------- 總覽 ----------
async function overviewPage(el, ctx) {
  el.innerHTML = `${banner()}<p class="muted">讀取紀錄中…</p>`;
  try {
    const st = await myStats();
    el.innerHTML = banner() + statsHTML(st, ctx) + (st.mistakes.length ? `<p class="next"><button type="button" class="btn" data-go="records-mistakes">錯題本有 ${st.mistakes.length} 題，去複習</button></p>` : '');
  } catch (e) {
    el.innerHTML = banner() + `<p class="badm">讀取紀錄失敗：${esc(e.message)}。請稍後重新整理。</p>`;
  }
  el.onclick = e => { const b = e.target.closest('[data-go]'); if (b) ctx.go(b.dataset.go); };
}

// ---------- 錯題本 ----------
function retryQs(list) {
  return shuffle(list.filter(m => m.opts?.length >= 2 && m.opts.includes(m.correct))).slice(0, 10).map(m => ({
    key: m.key, label: m.label, word: m.word, auto: m.audio || undefined,
    type: '錯題重練・' + m.label,
    prompt: `<p>${esc(m.prompt)}</p>${m.audio ? `<button type="button" class="btn big" data-say="${esc(m.audio)}">${SPK}再播一次</button>` : ''}`,
    options: shuffle(m.opts).map(o => ({ v: o, h: `<span class="hg" lang="ko">${esc(o)}</span>` })),
    ans: m.correct,
    exp: `${hasKo(m.correct) ? sayBtn(m.correct) : ''}<span>正確答案：<b lang="ko">${esc(m.correct)}</b></span>`,
    after: hasKo(m.correct) ? m.correct : undefined
  }));
}
async function mistakesPage(el, ctx) {
  el.innerHTML = `<p class="muted">讀取錯題中…</p>`;
  let st;
  try { st = await myStats(); } catch (e) { el.innerHTML = `<p class="badm">讀取失敗：${esc(e.message)}</p>`; return; }
  const list = st.mistakes;
  if (!list.length) {
    el.innerHTML = `<div class="empty"><p><b>目前沒有錯題。</b></p><p class="muted">答錯的題目會自動收進這裡；重練答對後就會移出。</p></div>`;
    return;
  }
  const canRetry = list.filter(m => m.opts?.length >= 2).length;
  el.innerHTML = `<div class="qwrap mist-wrap">
    <p class="intro">這裡收集「最近一次還答錯」的題目，共 <b>${list.length}</b> 題。重練時答對，題目就會從錯題本移出。</p>
    <div class="qctl"><button type="button" class="btn" data-retry ${canRetry ? '' : 'disabled'}>重練錯題（最多 10 題）</button></div>
    <div class="qcard qbox" hidden></div>
    ${mistakeCards(list)}
  </div>`;
  const box = $('.qbox', el);
  el.onclick = e => {
    if (!e.target.closest('[data-retry]')) return;
    box.hidden = false;
    const start = () => runQuiz(box, retryQs(list), 'best_retry', () => mistakesPage(el, ctx));
    start();
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

// ---------- 管理 ----------
async function adminPage(el, ctx) {
  el.innerHTML = `<p class="muted">讀取所有使用者的紀錄中…</p>`;
  let o;
  try { o = await apiGet('/api/manage/overview'); } catch (e) { el.innerHTML = `<p class="badm">讀取失敗：${esc(e.message)}</p>`; return; }
  el.innerHTML = `
  <div class="admin-head"><p class="intro">共 <b>${o.users.length}</b> 位使用者、<b>${o.totalAttempts}</b> 回測驗。只有管理者看得到這一頁。</p><button type="button" class="btn ghost" data-export>匯出所有作答（CSV）</button></div>
  <p class="muted" id="exp-msg" aria-live="polite"></p>
  <section class="block"><h3>使用者</h3>
    <div class="ctab-wrap"><table class="ctab atab"><thead><tr><th>帳號</th><th>最近練習</th><th class="num">次數</th><th class="num">題數</th><th class="num">正確率</th><th></th></tr></thead><tbody>
    ${o.users.map(u => `<tr><td>${esc(u.email || u.userId)}</td><td>${fmtDate(u.lastAttemptAt || u.lastSeen)}</td><td class="num">${u.attempts}</td><td class="num">${u.answers}</td><td class="num">${u.answers ? pct(u.correct, u.answers) + '%' : '—'}</td><td><button type="button" class="btn ghost small" data-user="${esc(u.userId)}">查看</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">還沒有人登入過。</td></tr>'}
    </tbody></table></div>
  </section>
  <section class="block" id="u-detail" hidden></section>
  <section class="block"><h3>最多人答錯的題目<small>至少被作答 2 次，依答錯比例排序</small></h3>
    ${o.topMissed.length ? `<div class="ctab-wrap"><table class="ctab atab"><thead><tr><th>單元・題型</th><th>題目</th><th>正確答案</th><th class="num">答錯</th><th class="num">人數</th></tr></thead><tbody>
    ${o.topMissed.map(k => `<tr><td><small class="muted">${esc(titleOf(ctx, k.module))}</small><br>${esc(k.label)}</td><td>${esc(k.prompt)}</td><td class="hg" lang="ko">${esc(k.correct)}</td><td class="num">${k.wrong}/${k.n}<br><small class="muted">${Math.round(k.rate * 100)}%</small></td><td class="num">${k.people}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">資料還不夠，等大家多做幾回測驗再來看。</p>'}
  </section>`;
  el.onclick = async e => {
    const u = e.target.closest('[data-user]');
    if (u) {
      const box = $('#u-detail', el); box.hidden = false; box.innerHTML = '<p class="muted">讀取中…</p>';
      try {
        const d = await apiGet(`/api/manage/users/${encodeURIComponent(u.dataset.user)}/stats?tz=${new Date().getTimezoneOffset()}`);
        box.innerHTML = `<h3>${esc(d.user.email || d.user.userId)}<small>第一次使用 ${fmtDate(d.user.firstSeen)}</small></h3>${statsHTML(d.stats, ctx, { admin: true })}${d.stats.mistakes.length ? `<h3 style="margin-top:8px">目前的錯題（${d.stats.mistakes.length}）</h3>${mistakeCards(d.stats.mistakes.slice(0, 30))}` : ''}`;
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) { box.innerHTML = `<p class="badm">讀取失敗：${esc(err.message)}</p>`; }
      return;
    }
    if (e.target.closest('[data-export]')) {
      const msg = $('#exp-msg', el); msg.textContent = '準備檔案中…';
      try {
        const blob = await apiDownload('/api/manage/export');
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `korean-records-${new Date().toLocaleDateString('sv-SE')}.csv`;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        msg.textContent = '已下載。用 Excel 開啟時會正確顯示中文和韓文。';
      } catch (err) { msg.textContent = '匯出失敗：' + err.message; }
    }
  };
}

export default {
  id: 'records',
  title: '我的紀錄',
  ko: '학습 기록',
  icon: 'chart',
  glyph: '록',
  desc: '練習紀錄、正確率與錯題本',
  pages: [
    { id: 'overview', title: '總覽', render: overviewPage, fresh: true },
    { id: 'mistakes', title: '錯題本', render: mistakesPage, fresh: true },
    { id: 'admin', title: '管理', render: adminPage, fresh: true, visible: () => !!sync.me?.isAdmin }
  ]
};
