// 單元：TOPIK（韓國語能力考試）
// 考試介紹、TOPIK I 題型練習（原創題）、迷你模擬考、歷屆試題連結（連到 Google Drive 的資料夾）
import { $, esc, shuffle } from '../../js/core/dom.js';
import { LS } from '../../js/core/storage.js';
import { SPK, sayLines } from '../../js/core/speech.js';
import { table } from '../../js/core/render.js';
import { runQuiz } from '../../js/core/quiz.js';
import { TYPES, Q } from './questions.js';

const br = s => esc(s).replace(/\n/g, '<br>');
const listenText = q => q.listen.map(([who, t]) => `<div class="tk-line"><b>${esc(who)}</b><span lang="ko">${esc(t)}</span></div>`).join('');

// 把題庫的一題轉成 runQuiz 用的格式
function toQ(q, i) {
  const T = TYPES[q.t];
  const head = `<p class="tk-no">[${T.no}] ${esc(T.name)}</p><p class="tk-inst" lang="ko">${esc(q.ask ? q.ask.split('\n')[0] : T.inst)}</p>`;
  let body = '';
  if (q.listen) body = `<button type="button" class="btn big" data-play="${i}">${SPK}播放對話</button><p class="note">先聽，不看文字；作答後會顯示對話內容。</p>`;
  if (q.text) body = `<div class="tk-text ${q.box ? 'box' : ''}" lang="ko">${br(q.text)}</div>`;
  const extra = q.ask && q.ask.includes('\n') ? `<p class="tk-ins" lang="ko">${esc(q.ask.split('\n').slice(1).join(' '))}</p>` : '';
  return {
    type: `TOPIK・${T.sec}`,
    label: `TOPIK ${T.no} ${T.name}`,
    key: `topik|${q.t}|${(q.text || q.listen.map(x => x[1]).join(' ')).slice(0, 60)}|${q.a}`,
    prompt: head + body + extra,
    options: shuffle(q.opts).map(o => ({ v: o, h: `<span lang="ko">${esc(o)}</span>` })),
    ans: q.a,
    exp: `${q.listen ? `<div class="tk-script">${listenText(q)}</div>` : ''}<span>${esc(q.exp)}</span>`,
    _q: q
  };
}

// 聽力題的播放按鈕（runQuiz 只處理選項，播放在外層攔截）
function bindPlay(box, qs) {
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-play]'); if (!b) return;
    const q = qs.find(x => x._i === +b.dataset.play); if (q) sayLines(q._q.listen.map(x => x[1]));
  }, true);
}
function build(list) {
  return list.map((q, i) => { const x = toQ(q, i); x._i = i; return x; });
}

// ---------- 考試介紹 ----------
function intro(el, ctx) {
  const rows = Object.values(TYPES).map(T => [T.sec, T.no, T.name]);
  el.innerHTML = `<div class="stack">
  <div class="block"><h3>TOPIK 是什麼</h3>
    <p>TOPIK（한국어능력시험）是韓國國立國際教育院（NIIED）主辦的韓語能力考試，分成 <b>TOPIK I</b>（初級，1～2級）和 <b>TOPIK II</b>（中高級，3～6級）。級數由總分決定，沒有單科最低分。</p>
    ${table({ head: ['', 'TOPIK I', 'TOPIK II'], rows: [
      ['科目', '聽力、閱讀', '聽力、寫作、閱讀'],
      ['題數', '聽力 30 題＋閱讀 40 題', '聽力 50 題＋寫作 4 題＋閱讀 50 題'],
      ['時間', '聽力 40 分＋閱讀 60 分（共 100 分鐘）', '第1節 聽力＋寫作 110 分；第2節 閱讀 70 分'],
      ['滿分', '200 分', '300 分'],
      ['級數', '1級 80 分以上；2級 140 分以上', '3級 120、4級 150、5級 190、6級 230 分以上']
    ] })}
    <p class="tip">報名日期、考場和紙本／網路（IBT）考試方式每年會調整，報名前請到官方網站 topik.go.kr 確認。</p>
  </div>
  <div class="block"><h3>建議目標</h3>
    <p>世宗韓國語 1A～1B 大致對應 TOPIK I 1級，2A～2B 對應 2級；3A 以後開始進入 TOPIK II 的範圍。目前上到 1B，可以先熟悉 TOPIK I 的題型，目標 1級（80 分）。</p>
  </div>
  <div class="block"><h3>TOPIK I 題型一覽</h3>${table({ head: ['科目', '題號', '題型'], rows })}
    <p class="note">15～16（看圖選對話）和 25～30（長對話）等題型需要圖片或較長的錄音，這裡先不收；練習請搭配歷屆試題。</p>
  </div>
  <div class="block"><h3>各題型解題提示</h3><ul class="rules">${Object.values(TYPES).map(T => `<li><b>${T.no}　${esc(T.name)}</b>：${esc(T.tip)}</li>`).join('')}</ul></div>
  <div class="lnav"><button type="button" class="btn" data-go="topik-practice">開始題型練習</button><button type="button" class="btn ghost" data-go="topik-mock">迷你模擬考</button></div>
  </div>`;
  el.onclick = e => { const b = e.target.closest('[data-go]'); if (b) ctx.go(b.dataset.go); };
}

// ---------- 題型練習 ----------
function practice(el, ctx) {
  el.innerHTML = `<div class="qwrap"><p class="intro">依 TOPIK I 的題型分類練習，題目全部是原創題，難度以 1～2級為主。聽力題用瀏覽器語音朗讀，可在左側切換「慢速」。</p>
  <div class="qctl"><select class="qf" aria-label="題型"><option value="all">全部題型（綜合）</option><option value="L">聽力全部</option><option value="R">閱讀全部</option>${Object.entries(TYPES).map(([k, T]) => `<option value="${k}">${T.sec} ${T.no}　${esc(T.name)}</option>`).join('')}</select><button type="button" class="btn qs-start">開始新的一回</button></div>
  <div class="qcard qbox"></div></div>`;
  const sel = $('.qf', el), box = $('.qbox', el);
  if (ctx.params.filter) sel.value = ctx.params.filter;
  let qs = [];
  bindPlay(box, { find: f => qs.find(f) });
  const start = () => {
    const f = sel.value;
    const pool = Q.filter(q => f === 'all' || q.t === f || (f.length === 1 && q.t[0] === f));
    qs = build(shuffle(pool).slice(0, 10));
    runQuiz(box, qs, 'best_topik_' + f, start);
  };
  $('.qs-start', el).onclick = start; sel.onchange = start;
  start();
}

// ---------- 迷你模擬考 ----------
function mock(el) {
  el.innerHTML = `<div class="qwrap"><p class="intro">聽力 8 題＋閱讀 12 題，依 TOPIK I 的題號順序出題。完成後換算成 200 分制，估計級數（只是練習參考，不代表正式成績）。</p>
  <div class="dhead mock-head"></div><div class="qcard qbox"></div></div>`;
  const box = $('.qbox', el), head = $('.mock-head', el);
  const order = Object.keys(TYPES);
  let qs = [];
  bindPlay(box, { find: f => qs.find(f) });
  const drawHead = () => {
    const log = LS.get('topik_mock_log', []);
    head.innerHTML = log.length ? `<p class="dnew">最近成績：${log.slice(-5).map(r => `<b>${r.s}</b>`).join('、')}（200 分制）</p>` : '<p class="dnew">還沒有模擬考紀錄。</p>';
  };
  const start = () => {
    const L = shuffle(Q.filter(q => q.t[0] === 'L')).slice(0, 8), R = shuffle(Q.filter(q => q.t[0] === 'R')).slice(0, 12);
    const pick = L.concat(R).sort((a, b) => order.indexOf(a.t) - order.indexOf(b.t));
    qs = build(pick);
    runQuiz(box, qs, 'best_topik_mock', start, (score, total) => {
      const s = Math.round(score / total * 200);
      const lv = s >= 140 ? '2級' : s >= 80 ? '1級' : '未達 1級';
      const log = LS.get('topik_mock_log', []); log.push({ d: new Date().toISOString().slice(0, 10), s }); LS.set('topik_mock_log', log.slice(-30));
      setTimeout(() => {
        const r = box.querySelector('.result .score');
        if (r) r.insertAdjacentHTML('afterend', `<p class="mock-est">換算 <b>${s}</b> / 200 分，估計：<b>${lv}</b></p>`);
        drawHead();
      });
    });
  };
  drawHead(); start();
}

// ---------- 歷屆試題 ----------
const DRIVE = 'https://example.invalid/';
const PAPERS = [
  { name: '第 35 屆 TOPIK I', id: 'REMOVED' },
  { name: '第 36 屆 TOPIK I', id: 'REMOVED' },
  { name: '第 47 屆 TOPIK I', id: 'REMOVED' },
  { name: '第 60 屆 TOPIK I', id: 'REMOVED' },
  { name: '第 64 屆 TOPIK I', id: 'REMOVED' }
];
const OTHER = [
  { name: '初級：改革後試題（全部）', id: 'REMOVED' },
  { name: '初級：第 10～34 屆（改革前）', id: 'REMOVED' },
  { name: '初級：改革前試題（附聽力文本）', id: 'REMOVED' }
];
function papers(el) {
  const done = LS.get('topik_papers_done', {});
  const row = p => `<li class="pp"><label><input type="checkbox" data-pp="${p.id}" ${done[p.id] ? 'checked' : ''}> <span>${esc(p.name)}</span></label><a class="btn ghost small" href="${DRIVE + p.id}" target="_blank" rel="noopener">開啟資料夾</a></li>`;
  el.innerHTML = `<div class="stack">
  <p class="intro">連到你的 Google Drive 資料夾（試題 PDF、答案、聽力 MP3）。需要用有權限的 Google 帳號登入才能開啟。做完一屆可以打勾，紀錄存在這台裝置。</p>
  <div class="block"><h3>TOPIK I（改革後，現行題型）</h3><ul class="pplist">${PAPERS.map(row).join('')}</ul>
    <p class="tip">建議做法：照正式時間（聽力 40 分、閱讀 60 分）一次做完，對完答案後，把錯的題型回到「題型練習」加強。</p></div>
  <div class="block"><h3>其他資料夾</h3><ul class="pplist">${OTHER.map(row).join('')}</ul>
    <p class="note">改革前（第 35 屆以前）的題型和現在不同，可當作額外的閱讀練習。中高級（TOPIK II）的資料夾等進度到 3A 以後再加入。</p></div>
  <div class="block"><h3>官方公開試題</h3><p>國立國際教育院的 TOPIK 官方網站也有公開的歷屆試題可以下載：<a href="https://www.topik.go.kr" target="_blank" rel="noopener">topik.go.kr</a></p></div>
  </div>`;
  el.onchange = e => { const c = e.target.closest('[data-pp]'); if (!c) return; const d = LS.get('topik_papers_done', {}); if (c.checked) d[c.dataset.pp] = new Date().toISOString().slice(0, 10); else delete d[c.dataset.pp]; LS.set('topik_papers_done', d); };
}

export default {
  id: 'topik',
  title: 'TOPIK',
  ko: '한국어능력시험',
  icon: 'note',
  glyph: '토',
  desc: 'TOPIK I 題型練習、模擬考與歷屆試題',
  pages: [
    { id: 'intro', title: '考試介紹', render: intro },
    { id: 'practice', title: '題型練習', render: practice },
    { id: 'mock', title: '模擬考', render: mock },
    { id: 'papers', title: '歷屆試題', render: papers }
  ]
};
