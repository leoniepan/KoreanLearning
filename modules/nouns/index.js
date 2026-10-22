// 單元：名詞（名詞表＋助詞形態、助詞規則、閃卡、測驗）
import { $, qa, esc, shuffle, pick, uniq } from '../../js/core/dom.js';
import { dec, pronSentence, detense } from '../../js/core/hangul.js';
import { LS } from '../../js/core/storage.js';
import { say, SPK, sayBtn, nvBtn } from '../../js/core/speech.js';
import { prHTML, sentRow, table } from '../../js/core/render.js';
import { runQuiz } from '../../js/core/quiz.js';
import { initialOf, chipsHTML, initialsHTML } from '../../js/core/filters.js';
import { CATS, N } from './nouns.js';

let custom = LS.get('custom_nouns', []);
const allNouns = () => N.concat(custom);
const LESSONS = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '補充', '自訂'];

// 助詞：依名詞最後一字有沒有收音選擇
const P = [
  { id: 'top', name: '主題 은/는', b: '은', nb: '는' },
  { id: 'sub', name: '主語 이/가', b: '이', nb: '가' },
  { id: 'obj', name: '受詞 을/를', b: '을', nb: '를' },
  { id: 'cop', name: '是 이에요/예요', b: '이에요', nb: '예요' }
];
const lastT = k => { const d = dec([...k].pop()); return d ? d.T : ''; };
const hasB = k => lastT(k) !== '';
export const nforms = k => Object.fromEntries(P.map(p => [p.id, k + (hasB(k) ? p.b : p.nb)]));
const wrongForm = (k, p) => k + (hasB(k) ? p.nb : p.b);

const fcell = f => `<button type="button" class="fm" data-say="${esc(f)}"><span class="hg" lang="ko">${esc(f)}</span>${prHTML(f)}</button>`;
const inL = (w, l) => l === 'all' || w.l === l;
const lessonOpts = () => `<option value="all">全部課別</option>` + LESSONS.map(l => `<option value="${l}">${l}</option>`).join('');
const catOpts = `<option value="all">全部分類</option>` + Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');

function explain(n) {
  const T = lastT(n.k), f = nforms(n.k), last = [...n.k].pop(), out = [];
  if (T) {
    out.push(`最後一字「<span lang="ko">${esc(last)}</span>」有收音 ${T} → 接 <b lang="ko">은、이、을、이에요</b>。`);
    out.push(`收音後面接母音開頭的助詞會連音：<b lang="ko">${esc(f.obj)}</b> 念 [${esc(pronSentence(f.obj))}]、<b lang="ko">${esc(f.sub)}</b> 念 [${esc(pronSentence(f.sub))}]。`);
  } else {
    out.push(`最後一字「<span lang="ko">${esc(last)}</span>」沒有收音 → 接 <b lang="ko">는、가、를、예요</b>。`);
  }
  out.push(`否定「不是…」：<b lang="ko">${esc(n.k + (T ? '이' : '가'))} 아니에요</b>。`);
  return out;
}
function detailHTML(n) {
  return `<div class="dt"><div><h4>助詞說明</h4><ul>${explain(n).map(x => `<li>${x}</li>`).join('')}</ul></div><div><h4>例句</h4>${n.ex ? `<ol class="sents">${sentRow(n.ex)}</ol>` : '<p class="muted">自訂名詞沒有內建例句，可以用左邊的形態自己造句再按喇叭聽。</p>'}${n.custom ? `<p style="margin-top:10px"><button type="button" class="btn ghost small" data-del="${esc(n.k)}">刪除這個自訂名詞</button></p>` : ''}</div></div>`;
}

// ---------- 名詞表 ----------
function tablePage(el, ctx) {
  el.innerHTML = `
  <p class="intro" style="margin-bottom:14px">依主題分類整理世宗韓國語 1A～4B 常見的名詞，標「補充」的是常用但不一定出現在課本裡的字。每個名詞都列出接上助詞後的形態和發音，點原型可展開說明與例句，點任何形態可以聽發音。</p>
  <div class="catbar" id="n-cats"></div>
  <div class="filters">
    <select id="n-lesson" aria-label="課別">${lessonOpts()}</select>
    <input type="text" id="n-q" placeholder="搜尋韓文或中文（搜尋全部分類）" aria-label="搜尋">
    <span class="count" id="n-count"></span>
  </div>
  <div class="inits" id="n-inits" role="group" aria-label="依字首篩選"></div>
  <div class="tblwrap"><table class="vtable">
    <thead><tr><th>名詞<small>명사</small></th><th>中文</th>${P.map(p => `<th>${p.name.split(' ')[0]}<small>${p.name.split(' ')[1]}</small></th>`).join('')}</tr></thead>
    <tbody id="n-body"></tbody>
  </table></div>
  <div class="addbox">
    <h3 style="font-size:15px">新增課本裡的名詞</h3>
    <form id="n-add" autocomplete="off">
      <label for="nn-k">名詞<input type="text" id="nn-k" placeholder="例：기차" size="8"></label>
      <label for="nn-zh">中文<input type="text" id="nn-zh" placeholder="例：火車" size="8"></label>
      <label for="nn-c">分類<select id="nn-c">${Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <button type="submit" class="btn">加入</button>
    </form>
    <p id="nn-msg" class="muted" aria-live="polite">新增的名詞只存在這個瀏覽器。</p>
  </div>`;
  const body = $('#n-body', el), msg = $('#nn-msg', el);
  const st = { cat: LS.get('ncat', Object.keys(CATS)[0]), ini: '' };
  function render() {
    const l = $('#n-lesson', el).value, q = $('#n-q', el).value.trim();
    const base = allNouns().filter(n => inL(n, l) && (!q || n.k.includes(q) || n.zh.includes(q)));
    const cat = q ? 'all' : st.cat;
    const counts = { all: base.length };
    base.forEach(n => { counts[n.c] = (counts[n.c] || 0) + 1; });
    const inCat = base.filter(n => cat === 'all' || n.c === cat);
    const list = inCat.filter(n => !st.ini || initialOf(n.k) === st.ini);
    $('#n-cats', el).innerHTML = chipsHTML([{ label: '', items: [['all', '全部'], ...Object.entries(CATS)] }], cat, counts);
    $('#n-inits', el).innerHTML = initialsHTML(new Set(inCat.map(n => initialOf(n.k))), st.ini);
    $('#n-count', el).textContent = `顯示 ${list.length} 個`;
    body.innerHTML = list.length ? list.map(n => {
      const f = nforms(n.k);
      return `<tr class="vr"><td><button type="button" class="tog" data-tog="${esc(n.k)}" aria-expanded="false"><span class="hg" lang="ko">${esc(n.k)}</span><span class="chev"></span></button><span class="meta">${CATS[n.c]}・${n.l}${n.u ? ` 第${n.u}課` : ''}・${hasB(n.k) ? '有收音' : '無收音'}</span>${nvBtn(n.k)}</td><td data-label="中文">${esc(n.zh)}</td>${P.map(p => `<td data-label="${p.name}">${fcell(f[p.id])}</td>`).join('')}</tr><tr class="detail" data-d="${esc(n.k)}" hidden><td colspan="6"></td></tr>`;
    }).join('') : '<tr><td colspan="6" class="muted" style="padding:20px">沒有符合條件的名詞。</td></tr>';
  }
  $('#n-cats', el).onclick = e => { const b = e.target.closest('[data-cat]'); if (!b) return; st.cat = b.dataset.cat; st.ini = ''; LS.set('ncat', st.cat); $('#n-q', el).value = ''; render(); };
  $('#n-inits', el).onclick = e => { const b = e.target.closest('[data-ini]'); if (!b) return; st.ini = st.ini === b.dataset.ini ? '' : b.dataset.ini; render(); };
  $('#n-lesson', el).onchange = render;
  $('#n-q', el).oninput = () => { st.ini = ''; render(); };
  body.addEventListener('click', e => {
    const t = e.target.closest('[data-tog]');
    if (t) {
      const k = t.dataset.tog, row = qa(body, 'tr.detail').find(r => r.dataset.d === k), open = row.hidden;
      row.hidden = !open; t.setAttribute('aria-expanded', open);
      if (open) { row.firstElementChild.innerHTML = detailHTML(allNouns().find(n => n.k === k)); say(k); }
      return;
    }
    const d = e.target.closest('[data-del]');
    if (d) { custom = custom.filter(n => n.k !== d.dataset.del); LS.set('custom_nouns', custom); render(); msg.textContent = `已刪除「${d.dataset.del}」。`; }
  });
  $('#n-add', el).onsubmit = e => {
    e.preventDefault();
    const k = $('#nn-k', el).value.trim(), zh = $('#nn-zh', el).value.trim(), c = $('#nn-c', el).value;
    if (!/^[가-힣]+$/.test(k)) { msg.textContent = '請輸入韓文名詞，例如 기차。'; return; }
    if (allNouns().some(n => n.k === k)) { msg.textContent = `「${k}」已經在表裡了。`; return; }
    custom.push({ k, zh: zh || '（未填）', c, l: '自訂', custom: true }); LS.set('custom_nouns', custom);
    const f = nforms(k);
    msg.textContent = `已加入「${k}」：${f.top}、${f.sub}、${f.obj}、${f.cop}`;
    $('#nn-k', el).value = ''; $('#nn-zh', el).value = '';
    st.cat = c; st.ini = ''; $('#n-lesson', el).value = 'all'; $('#n-q', el).value = ''; render();
  };
  if (ctx?.params?.q) { $('#n-q', el).value = ctx.params.q; $('#n-lesson', el).value = 'all'; }
  render();
}

// ---------- 助詞規則 ----------
function rulesPage(el) {
  const pickEx = id => N.filter(n => n.ex[0].includes(nforms(n.k)[id])).slice(0, 6).map(n => sentRow(n.ex, n.k)).join('');
  const C = [
    ['先看最後一字有沒有收音', '받침 확인', `<p>名詞後面接什麼助詞，只看最後一個字有沒有收音（받침）。</p>${table({ head: ['名詞', '最後一字', '收音', '接哪一組'], rows: [['책', '책', 'ㄱ', '은、이、을、이에요'], ['학생', '생', 'ㅇ', '은、이、을、이에요'], ['친구', '구', '沒有', '는、가、를、예요'], ['커피', '피', '沒有', '는、가、를、예요']] })}`],
    ['主題助詞 은／는', '주제', `<ul class="rules"><li>表示「說到…的話」，常用在自我介紹、比較、轉換話題。</li><li>有收音 → 은：선생님은；沒有收音 → 는：저는、의사는</li><li>發音：有收音時會連音，선생님은 → [선생니믄]</li></ul><ol class="sents">${pickEx('top')}</ol>`],
    ['主語助詞 이／가', '주어', `<ul class="rules"><li>標示動作或狀態的主體，常和 있어요／없어요、形容詞一起用。</li><li>有收音 → 이：연필이；沒有收音 → 가：김치가</li><li>注意：저 → 제가、나 → 내가、누구 → 누가（會變形）</li></ul><ol class="sents">${pickEx('sub')}</ol>`],
    ['受詞助詞 을／를', '목적어', `<ul class="rules"><li>標示動作的對象：吃什麼、看什麼、買什麼。</li><li>有收音 → 을：책을、음식을；沒有收音 → 를：커피를、노래를</li><li>發音：책을 → [채글]、옷을 → [오슬]</li></ul><ol class="sents">${pickEx('obj')}</ol>`],
    ['是… 이에요／예요', '이에요/예요', `<ul class="rules"><li>「名詞＋이에요／예요」＝「是…」。</li><li>有收音 → 이에요：학생이에요；沒有收音 → 예요：의사예요</li><li>否定「不是…」：名詞＋이／가 아니에요：학생이 아니에요、의사가 아니에요</li></ul><ol class="sents">${pickEx('cop')}</ol>`],
    ['助詞與連音', '연음', `<p>有收音的名詞接上母音開頭的助詞（은、이、을、이에요）時，收音會移到助詞上念，這是名詞最常見的發音變化。</p>${table({ head: ['寫法', '發音'], rows: ['책을', '옷이', '음식은', '부엌에', '한국어를', '꽃이'].map(x => [x, `[${pronSentence(x)}]`]) })}<p class="note">ㅊ、ㅌ 這類收音不會先變成代表音，而是整個移過去：꽃이 → [꼬치]。</p>`]
  ];
  el.innerHTML = `<div class="rcards">${C.map((c, i) => `<article class="rcard"><span class="num">${i + 1}</span><h3>${c[0]} <small class="muted hg" lang="ko" style="font-size:13px;font-weight:400">${c[1]}</small></h3><div class="body">${c[2]}</div></article>`).join('')}</div>`;
}

// ---------- 閃卡 ----------
function cardsPage(el) {
  el.innerHTML = `<div class="qwrap"><p class="intro">看韓文說出中文，或看中文說出韓文和發音，再翻開確認。</p><div class="qctl"><select class="nfc-mode" aria-label="方向"><option value="kz">韓文 → 中文</option><option value="zk">中文 → 韓文</option></select><select class="nfc-cat" aria-label="分類">${catOpts}</select></div><div class="qcard nfc"></div></div>`;
  const box = $('.nfc', el), mode = $('.nfc-mode', el), csel = $('.nfc-cat', el);
  let st = { n: null, rev: false };
  const draw = () => {
    if (!st.n) { const pool = allNouns().filter(n => csel.value === 'all' || n.c === csel.value); st = { n: pick(pool.length ? pool : allNouns()), rev: false }; }
    const { n, rev } = st, kz = mode.value === 'kz';
    const front = kz ? `<div class="fc-w hg" lang="ko">${esc(n.k)}</div><p>中文是？</p>` : `<div class="fc-w">${esc(n.zh)}</div><p>韓文怎麼說？</p>`;
    const back = kz ? `<div class="fc-a">${esc(n.zh)}${sayBtn(n.k)}${nvBtn(n.k)}</div>` : `<div class="fc-a"><span class="hg" lang="ko">${esc(n.k)}</span>${prHTML(n.k)}${sayBtn(n.k)}${nvBtn(n.k)}</div>`;
    box.innerHTML = `<div class="fc-card"><p class="fc-q">${CATS[n.c]}</p>${front}${rev ? back : '<div class="fc-a muted">想好了再翻開</div>'}</div><div class="fc-btns"><button type="button" class="btn" data-v="rev">${rev ? '再聽一次' : '翻開答案'}</button><button type="button" class="btn ghost" data-v="next">下一張</button></div>`;
    if (kz && !rev) say(n.k);
  };
  box.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; if (b.dataset.v === 'rev') { st.rev = true; draw(); say(st.n.k); } else { st.n = null; draw(); } };
  mode.onchange = csel.onchange = () => { st.n = null; draw(); };
  draw();
}

// ---------- 測驗 ----------
export function buildQuiz(pool = allNouns()) {
  const all = allNouns();
  const others = (n, f) => shuffle(all.filter(x => x.k !== n.k && x.zh !== n.zh)).slice(0, 3).map(f);
  const kz = n => ({ word: n.k, type: '韓 → 中', prompt: `<div class="qw hg" lang="ko">${esc(n.k)}</div><p>中文意思是？</p>`, options: shuffle([n.zh, ...others(n, x => x.zh)]).map(x => ({ v: x, h: esc(x) })), ans: n.zh, exp: `${sayBtn(n.k)}<span><b lang="ko">${esc(n.k)}</b> ${prHTML(n.k)}　${esc(n.zh)}</span>`, after: n.k });
  const zk = n => ({ word: n.k, type: '中 → 韓', prompt: `<div class="qw">${esc(n.zh)}</div><p>韓文是？</p>`, options: shuffle([n.k, ...others(n, x => x.k)]).map(x => ({ v: x, h: `<span class="hg" lang="ko">${esc(x)}</span>` })), ans: n.k, exp: `${sayBtn(n.k)}<span><b lang="ko">${esc(n.k)}</b> ${prHTML(n.k)}　${esc(n.zh)}</span>`, after: n.k });
  const particle = n => {
    const p = pick(P), f = nforms(n.k), r = f[p.id];
    const opts = uniq([r, wrongForm(n.k, p), ...shuffle(P.filter(x => x !== p)).map(x => f[x.id])]).slice(0, 4);
    return { word: n.k, type: '選出正確助詞', prompt: `<div class="qw hg" lang="ko">${esc(n.k)}</div><p>${esc(n.zh)}　接上 <b>${p.name}</b></p>`, options: shuffle(opts).map(x => ({ v: x, h: `<span class="hg" lang="ko">${esc(x)}</span>` })), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b> [${esc(pronSentence(r))}]　${explain(n)[0]}</span>`, after: r };
  };
  const listen = n => ({ word: n.k, type: '聽音選字', prompt: `<p>聽發音，選出正確的名詞</p><button type="button" class="btn big" data-say="${esc(n.k)}">${SPK}再播一次</button>`, options: shuffle([n.k, ...others(n, x => x.k)]).map(x => ({ v: x, h: `<span class="hg" lang="ko">${esc(x)}</span>` })), ans: n.k, exp: `${sayBtn(n.k)}<span><b lang="ko">${esc(n.k)}</b> ${esc(n.zh)}</span>`, auto: n.k });
  const pron = n => {
    if (!hasB(n.k)) return particle(n);
    const f = nforms(n.k), x = pick([f.obj, f.sub, f.top]), p = pronSentence(x);
    if (p === x) return particle(n);
    const o = uniq([p, x, detense(x, p)]);
    for (const z of shuffle(all)) if (o.length < 4 && hasB(z.k)) { const y = pronSentence(nforms(z.k).obj); if (!o.includes(y)) o.push(y); }
    return { word: n.k, type: '選出正確發音', prompt: `<div class="qw hg" lang="ko">${esc(x)}</div><p>實際念成哪一個？</p>`, options: shuffle(o.slice(0, 4)).map(y => ({ v: y, h: `<span lang="ko">[${esc(y)}]</span>` })), ans: p, exp: `${sayBtn(x)}<span><b lang="ko">${esc(x)}</b> → <b lang="ko">[${esc(p)}]</b>　收音移到助詞上連音</span>`, after: x };
  };
  const plan = [kz, kz, zk, zk, particle, particle, particle, listen, listen, pron];
  const sp = shuffle(pool);
  return shuffle(plan.map((fn, i) => fn(sp[i % sp.length])));
}
function quizPage(el) {
  el.innerHTML = `<div class="qwrap"><p class="intro">每回 10 題：韓中互譯、選出正確助詞、聽音選字、助詞連音的發音。</p><div class="qctl"><select class="n-qc" aria-label="分類">${catOpts}</select><select class="n-ql" aria-label="課別">${lessonOpts()}</select><button type="button" class="btn qs-start">開始新的一回</button></div><div class="qcard qbox"></div></div>`;
  const c = $('.n-qc', el), l = $('.n-ql', el), box = $('.qbox', el);
  const start = () => {
    const pool = allNouns().filter(n => (c.value === 'all' || n.c === c.value) && inL(n, l.value));
    if (!pool.length) { box.innerHTML = '<p class="muted">這個範圍沒有名詞，請換一個分類或課別。</p>'; return; }
    runQuiz(box, buildQuiz(pool), 'best_nq_' + c.value + l.value, start);
  };
  $('.qs-start', el).onclick = start; c.onchange = start; l.onchange = start;
  start();
}

export default {
  id: 'nouns',
  title: '名詞',
  ko: '명사',
  icon: 'book',
  glyph: '책',
  desc: '依主題分類，附助詞形態與發音',
  pages: [
    { id: 'table', title: '名詞表', render: tablePage },
    { id: 'rules', title: '助詞規則', render: rulesPage },
    { id: 'cards', title: '閃卡', render: cardsPage },
    { id: 'quiz', title: '測驗', render: quizPage, fresh: true }
  ]
};
