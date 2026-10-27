// 單元：TOPIK（韓國語能力考試）——上方選單的獨立項目
// 考試介紹、TOPIK I 題型練習（原創題）、可選題型的模擬考
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
export function bindPlay(box, qs) {
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-play]'); if (!b) return;
    const q = qs.find(x => x._i === +b.dataset.play); if (q) sayLines(q._q.listen.map(x => x[1]));
  }, true);
}
export function build(list) {
  return list.map((q, i) => { const x = toQ(q, i); x._i = i; return x; });
}

// ---------- 考試介紹 ----------
function intro(el, ctx) {
  const rows = Object.values(TYPES).map(T => [T.sec, T.no, T.name]);
  el.innerHTML = `<div class="stack">
  <div class="lq-top"><button type="button" class="btn" data-go="topik-practice">開始題型練習</button><button type="button" class="btn ghost" data-go="topik-mock">迷你模擬考</button></div>
  <div class="block"><h3>TOPIK 是什麼</h3>
    <p>TOPIK（한국어능력시험）是韓國國立國際教育院（NIIED）主辦的韓語能力考試，分成 <b>TOPIK I</b>（初級，1～2級）和 <b>TOPIK II</b>（中高級，3～6級）。級數由總分決定，沒有單科最低分。</p>
    ${table({ head: ['', 'TOPIK I', 'TOPIK II'], rows: [
      ['科目', '聽力、閱讀', '聽力、寫作、閱讀'],
      ['題數', '聽力 30 題＋閱讀 40 題', '聽力 50 題＋寫作 4 題＋閱讀 50 題'],
      ['時間', '聽力 40 分＋閱讀 60 分（共 100 分鐘）', '第1節 聽力＋寫作 110 分；第2節 閱讀 70 分'],
      ['滿分', '200 分', '300 分'],
      ['級數', '1級 80 分以上；2級 140 分以上', '3級 120、4級 150、5級 190、6級 230 分以上']
    ] })}
    <p class="tip">報名日期、考場和紙本／網路（IBT）考試方式每年會調整，報名前請再確認最新公告。</p>
  </div>
  <div class="block"><h3>各冊對應的級數</h3>
    <p>世宗韓國語 1A～1B 大致對應 TOPIK I 1級，2A～2B 對應 2級；3A 以後開始進入 TOPIK II 的範圍。</p>
  </div>
  <div class="block"><h3>TOPIK I 題型一覽</h3>${table({ head: ['科目', '題號', '題型'], rows })}
    <p class="note">15～16（看圖選對話）和 25～30（長對話）等題型需要圖片或較長的錄音，這裡先不收。</p>
  </div>
  <div class="block"><h3>各題型解題提示</h3><ul class="rules">${Object.values(TYPES).map(T => `<li><b>${T.no}　${esc(T.name)}</b>：${esc(T.tip)}</li>`).join('')}</ul></div>
  </div>`;
  el.onclick = e => { const b = e.target.closest('[data-go]'); if (b) ctx.go(b.dataset.go, b.dataset.sub ? { sub: b.dataset.sub } : {}); };
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

// ---------- 模擬考：可勾選題型 ----------
function mock(el) {
  const keys = Object.keys(TYPES);
  const saved = LS.get('topik_mock_types', keys);
  const count = k => Q.filter(q => q.t === k).length;
  const group = sec => keys.filter(k => TYPES[k].sec === sec).map(k => `<label class="tk-chk"><input type="checkbox" value="${k}" ${saved.includes(k) ? 'checked' : ''}><span>${TYPES[k].no}　${esc(TYPES[k].name)}</span><small>${count(k)} 題</small></label>`).join('');
  el.innerHTML = `<div class="qwrap">
  <p class="intro">勾選想考的題型和題數，題目會依 TOPIK I 的題號順序排列。完成後換算成 200 分制並估計級數（只是練習參考，不代表正式成績）。</p>
  <div class="block tk-setup">
    <div class="tk-grp"><div class="tk-grp-h"><b>聽力</b><button type="button" class="btn ghost small" data-all="聽力">全選／全不選</button></div>${group('聽力')}</div>
    <div class="tk-grp"><div class="tk-grp-h"><b>閱讀</b><button type="button" class="btn ghost small" data-all="閱讀">全選／全不選</button></div>${group('閱讀')}</div>
    <div class="qctl"><select class="tk-n" aria-label="題數"><option value="10">10 題</option><option value="20" selected>20 題</option><option value="30">30 題</option><option value="0">選到的全部</option></select><button type="button" class="btn tk-go">開始模擬考</button></div>
    <p class="tk-msg note" aria-live="polite"></p>
  </div>
  <div class="dhead mock-head"></div><div class="qcard qbox"></div></div>`;
  const box = $('.qbox', el), head = $('.mock-head', el), msg = $('.tk-msg', el);
  let qs = [];
  bindPlay(box, { find: f => qs.find(f) });
  const chosen = () => [...el.querySelectorAll('.tk-chk input:checked')].map(c => c.value);
  const drawHead = () => {
    const log = LS.get('topik_mock_log', []);
    head.innerHTML = log.length ? `<p class="dnew">最近成績：${log.slice(-5).map(r => `<b>${r.s}</b>`).join('、')}（200 分制）</p>` : '';
  };
  const start = () => {
    const types = chosen(); LS.set('topik_mock_types', types);
    if (!types.length) { msg.textContent = '請至少勾選一種題型。'; box.innerHTML = ''; return; }
    const n = +$('.tk-n', el).value;
    const pool = shuffle(Q.filter(q => types.includes(q.t)));
    // 先讓每個勾選的題型至少出一題，再隨機補滿
    const first = types.map(t => pool.find(q => q.t === t)).filter(Boolean);
    const rest = pool.filter(q => !first.includes(q));
    const pick = (n ? first.concat(rest).slice(0, n) : pool).sort((a, b) => keys.indexOf(a.t) - keys.indexOf(b.t));
    msg.textContent = `共 ${pick.length} 題${n && pick.length < n ? `（勾選的題型只有 ${pick.length} 題）` : ''}`;
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
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  el.querySelector('.tk-setup').addEventListener('click', e => {
    const a = e.target.closest('[data-all]'); if (!a) return;
    const cs = [...el.querySelectorAll('.tk-chk input')].filter(c => TYPES[c.value].sec === a.dataset.all);
    const on = !cs.every(c => c.checked); cs.forEach(c => { c.checked = on; });
  });
  $('.tk-go', el).onclick = start;
  drawHead();
}

export default {
  id: 'topik',
  title: 'TOPIK',
  ko: '한국어능력시험',
  icon: 'note',
  glyph: '토',
  desc: 'TOPIK I 考試介紹、題型練習與模擬考',
  pages: [
    { id: 'intro', title: '考試介紹', render: intro },
    { id: 'practice', title: '題型練習', render: practice },
    { id: 'mock', title: '模擬考', render: mock }
  ]
};
