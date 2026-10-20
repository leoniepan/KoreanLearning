// 單元：動詞・形容詞（變化表、變化規則、閃卡、測驗）
import { $, qa, esc, shuffle, pick, uniq } from '../../js/core/dom.js';
import { dec, pronSentence, detense } from '../../js/core/hangul.js';
import { BRIGHT, forms } from '../../js/core/conjugate.js';
import { LS } from '../../js/core/storage.js';
import { say, SPK, sayBtn, nvBtn } from '../../js/core/speech.js';
import { prHTML, sentRow, table } from '../../js/core/render.js';
import { runQuiz } from '../../js/core/quiz.js';
import { W, ATTR_EX, PURP_EX } from './words.js';

let custom = LS.get('custom', []);
const allWords = () => W.concat(custom);
const TYPE = { v: '動詞', a: '形容詞', e: '存在詞' };
const LESSONS = ['1A', '1B 1課', '1B 2課', '補充', '自訂'];
const TN = { pres: '現在式', past: '過去式', fut: '未來式', attr: '冠形詞形' };
const K = ['pres', 'past', 'fut', 'attr'];
const tn = (w, k) => k === 'fut' && w.t === 'a' ? '未來式（推測）' : k === 'attr' ? (w.t === 'a' ? '冠形詞形 -(으)ㄴ' : '冠形詞形 -는') : TN[k];
const NOPURP = ['알다', '모르다', '살다', '좋아하다', '싫어하다', '일어나다'];
const fcell = f => `<button type="button" class="fm" data-say="${esc(f)}"><span class="hg" lang="ko">${esc(f)}</span>${prHTML(f)}</button>`;
const lessonOpts = `<option value="all">全部課別</option>` + LESSONS.map(l => `<option value="${l}">${l === '1A' ? '1A 全冊' : l}</option>`).join('');
const typeMatch = (w, t) => t === 'all' || w.t === t || (t === 'v' && w.t === 'e');

function explain(w) {
  const stem = w.k.slice(0, -1), last = [...stem].pop(), d = dec(last), f = forms(w), out = [];
  out.push(`語幹：<b lang="ko">${w.k}</b> 去掉 다 → <b lang="ko">${stem}</b>`);
  if (last === '하') out.push(`語幹以「하」結尾：하 → 해，所以 <b lang="ko">${f.pres}</b>、<b lang="ko">${f.past}</b>。`);
  else if (w.irr === 'ㅂ') out.push(`ㅂ 不規則：收音 ㅂ 遇到母音變成 우，우＋어 → 워：<b lang="ko">${f.pres}</b>、<b lang="ko">${f.past}</b>、<b lang="ko">${f.fut}</b>。`);
  else if (w.irr === 'ㄷ') out.push(`ㄷ 不規則：收音 ㄷ 遇到母音變成 ㄹ：<b lang="ko">${f.pres}</b>、<b lang="ko">${f.fut}</b>；遇到子音（-는、-고）則不變：<b lang="ko">${f.attr}</b>。`);
  else if (w.irr === '르') out.push(`르 不規則：前一個字多一個 ㄹ 收音，르 變成 라／러：<b lang="ko">${f.pres}</b>。`);
  else if (d.T) out.push(`最後一字「<span lang="ko">${last}</span>」的母音是 ${d.V}，${BRIGHT.includes(d.V) ? '屬於 ㅏ／ㅗ → 加 아요' : '不是 ㅏ／ㅗ → 加 어요'}：<b lang="ko">${f.pres}</b>。`);
  else {
    const m = { 'ㅏ': 'ㅏ＋아 重複，合併成一個', 'ㅓ': 'ㅓ＋어 重複，合併成一個', 'ㅐ': 'ㅐ 後面的 어 省略', 'ㅕ': 'ㅕ 後面的 어 省略', 'ㅗ': 'ㅗ＋아 → ㅘ', 'ㅜ': 'ㅜ＋어 → ㅝ', 'ㅣ': 'ㅣ＋어 → ㅕ', 'ㅟ': 'ㅟ 不縮約，直接加 어', 'ㅡ': 'ㅡ 脫落，再看前一字母音決定 아／어（單音節一律用 어）', 'ㅚ': 'ㅚ＋어 → ㅙ' };
    out.push(`語幹沒有收音，${m[d.V] || '直接加 아/어'}：<b lang="ko">${f.pres}</b>。`);
  }
  out.push(`過去式：把現在式的「요」拿掉，最後一字加 ㅆ 收音再接 어요：<b lang="ko">${f.past}</b>，念 [${esc(pronSentence(f.past))}]。`);
  if (d.T === 'ㄹ') out.push(`ㄹ 語幹：未來式不加 을，直接 <b lang="ko">${f.fut}</b>；冠形詞形 ㄹ 脫落：<b lang="ko">${f.attr}</b>。`);
  out.push(w.t === 'a' ? `形容詞加 -(으)ㄹ 거예요 表示「推測」：應該會…。거 念 [꺼]。` : `未來式 <b lang="ko">${f.fut}</b> 的 거 念 [꺼]：[${esc(pronSentence(f.fut))}]。`);
  return out;
}

function detailHTML(w) {
  const f = forms(w), keys = ['pres', 'past', 'fut'];
  const purp = f.purp && !NOPURP.includes(w.k) ? `<p class="purp"><span class="tag">1B 第2課</span>目的 -(으)러 가요：<button type="button" class="fm inline" data-say="${esc(f.purp)}"><span class="hg" lang="ko">${esc(f.purp)}</span>${prHTML(f.purp)}</button></p>` : '';
  return `<div class="dt"><div><h4>變化說明</h4><ul>${explain(w).map(x => `<li>${x}</li>`).join('')}</ul>${purp}</div><div><h4>例句</h4>${w.ex.length ? `<ol class="sents">${w.ex.map((s, i) => sentRow(s, tn(w, keys[i]).replace(/（.*/, ''))).join('')}</ol>` : '<p class="muted">自訂單字沒有內建例句，可以用左邊的變化形自己造句再按喇叭聽。</p>'}${w.custom ? `<p style="margin-top:10px"><button type="button" class="btn ghost small" data-del="${esc(w.k)}">刪除這個自訂單字</button></p>` : ''}</div></div>`;
}

// ---------- 變化表 ----------
function tablePage(el) {
  el.innerHTML = `
  <p class="intro" style="margin-bottom:14px">依世宗韓國語 1A 與 1B 第1課〈무슨 음식을 좋아해요?〉、第2課〈도서관에 책을 빌리러 가요〉的主題整理。標「補充」的是常用但不一定出現在你課本裡的字。點原型可展開變化說明與例句，點任何變化形可以聽發音。和課本單字表比對後，缺少的字可在表格下方自行加入。</p>
  <div class="filters">
    <select id="f-type" aria-label="詞類"><option value="all">全部詞類</option><option value="v">動詞（含 있다／없다）</option><option value="a">形容詞</option></select>
    <select id="f-lesson" aria-label="課別">${lessonOpts}</select>
    <input type="text" id="f-q" placeholder="搜尋韓文或中文" aria-label="搜尋">
    <span class="count" id="vt-count"></span>
  </div>
  <div class="tblwrap"><table class="vtable">
    <thead><tr><th>原型<small>기본형</small></th><th>中文</th><th>現在式<small>-아요/어요</small></th><th>過去式<small>-았어요/었어요</small></th><th>未來式<small>-(으)ㄹ 거예요</small></th><th>冠形詞形<small>動 -는 ／ 形 -(으)ㄴ</small></th></tr></thead>
    <tbody id="vt-body"></tbody>
  </table></div>
  <div class="addbox">
    <h3 style="font-size:15px">新增課本裡的單字</h3>
    <form id="add-form" autocomplete="off">
      <label for="nw-k">原型<input type="text" id="nw-k" placeholder="例：타다" size="8"></label>
      <label for="nw-zh">中文<input type="text" id="nw-zh" placeholder="例：搭乘" size="8"></label>
      <label for="nw-t">詞類<select id="nw-t"><option value="v">動詞</option><option value="a">形容詞</option></select></label>
      <label for="nw-irr">不規則<select id="nw-irr"><option value="">規則（含 ㄹ、ㅡ、하다）</option><option value="ㅂ">ㅂ 不規則</option><option value="ㄷ">ㄷ 不規則</option><option value="르">르 不規則</option></select></label>
      <button type="submit" class="btn">加入</button>
    </form>
    <p id="nw-msg" class="muted" aria-live="polite">輸入原型後會先顯示自動變化的結果。新增的字只存在這個瀏覽器。</p>
  </div>`;
  const body = $('#vt-body', el), msg = $('#nw-msg', el);
  function renderTable() {
    const t = $('#f-type', el).value, l = $('#f-lesson', el).value, q = $('#f-q', el).value.trim();
    const list = allWords().filter(w => typeMatch(w, t) && (l === 'all' || w.l === l) && (!q || w.k.includes(q) || w.zh.includes(q)));
    $('#vt-count', el).textContent = `共 ${list.length} 個`;
    body.innerHTML = list.length ? list.map(w => {
      const f = forms(w);
      return `<tr class="vr"><td><button type="button" class="tog" data-tog="${esc(w.k)}" aria-expanded="false"><span class="hg" lang="ko">${esc(w.k)}</span><span class="chev"></span></button><span class="meta">${TYPE[w.t]}・${w.l}${w.irr ? `・${w.irr} 不規則` : ''}</span>${nvBtn(w.k)}</td><td data-label="中文">${esc(w.zh)}</td>${K.map(k => `<td data-label="${tn(w, k)}">${fcell(f[k])}</td>`).join('')}</tr><tr class="detail" data-d="${esc(w.k)}" hidden><td colspan="6"></td></tr>`;
    }).join('') : '<tr><td colspan="6" class="muted" style="padding:20px">沒有符合條件的單字。</td></tr>';
  }
  ['#f-type', '#f-lesson'].forEach(s => $(s, el).onchange = renderTable);
  $('#f-q', el).oninput = renderTable;
  body.addEventListener('click', e => {
    const t = e.target.closest('[data-tog]');
    if (t) {
      const k = t.dataset.tog, row = qa(body, 'tr.detail').find(r => r.dataset.d === k), open = row.hidden;
      row.hidden = !open; t.setAttribute('aria-expanded', open);
      if (open) { row.firstElementChild.innerHTML = detailHTML(allWords().find(w => w.k === k)); say(k); }
      return;
    }
    const d = e.target.closest('[data-del]');
    if (d) { custom = custom.filter(w => w.k !== d.dataset.del); LS.set('custom', custom); renderTable(); msg.textContent = `已刪除「${d.dataset.del}」。`; }
  });
  const preview = () => {
    const k = $('#nw-k', el).value.trim();
    if (!/^[가-힣]{2,}$/.test(k) || !k.endsWith('다')) { msg.textContent = '輸入原型後會先顯示自動變化的結果。新增的字只存在這個瀏覽器。'; return; }
    try { const f = forms({ k, t: $('#nw-t', el).value, irr: $('#nw-irr', el).value }); msg.innerHTML = `預覽：<span lang="ko">${[f.pres, f.past, f.fut, f.attr].map(esc).join('　')}</span>`; } catch (e) { }
  };
  ['#nw-k', '#nw-t', '#nw-irr'].forEach(s => $(s, el).addEventListener('input', preview));
  $('#add-form', el).onsubmit = e => {
    e.preventDefault();
    const k = $('#nw-k', el).value.trim(), zh = $('#nw-zh', el).value.trim(), t = $('#nw-t', el).value, irr = $('#nw-irr', el).value;
    if (!/^[가-힣]{2,}$/.test(k) || !k.endsWith('다')) { msg.textContent = '請輸入韓文原型，結尾要是「다」，例如 타다。'; return; }
    if (allWords().some(w => w.k === k)) { msg.textContent = `「${k}」已經在表裡了。`; return; }
    const pre = dec([...k.slice(0, -1)].pop());
    if (irr === '르' && !k.endsWith('르다')) { msg.textContent = '르 不規則的字要以「르다」結尾，例如 모르다。'; return; }
    if (irr === 'ㅂ' && pre.T !== 'ㅂ') { msg.textContent = 'ㅂ 不規則的字，다 前面一字要有 ㅂ 收音，例如 춥다。'; return; }
    if (irr === 'ㄷ' && pre.T !== 'ㄷ') { msg.textContent = 'ㄷ 不規則的字，다 前面一字要有 ㄷ 收音，例如 듣다。'; return; }
    const w = { k, zh: zh || '（未填）', t, irr, l: '自訂', ex: [], custom: true };
    custom.push(w); LS.set('custom', custom);
    msg.textContent = `已加入「${k}」，現在式是 ${forms(w).pres}。`;
    $('#nw-k', el).value = ''; $('#nw-zh', el).value = '';
    $('#f-lesson', el).value = 'all'; $('#f-q', el).value = ''; renderTable();
  };
  renderTable();
}

// ---------- 變化規則 ----------
function rulesPage(el) {
  const ex = (ks, i) => ks.map(k => W.find(w => w.k === k)).map(w => sentRow(w.ex[i], w.k)).join('');
  const C = [
    ['先找語幹', '어간 찾기', `<p>字典裡的原型都以「다」結尾，去掉 다 就是語幹。所有變化都接在語幹後面。</p>${table({ head: ['原型', '語幹', '語幹最後一字'], rows: [['가다', '가', '沒有收音'], ['먹다', '먹', '有收音，母音 ㅓ'], ['공부하다', '공부하', '하'], ['좋다', '좋', '有收音，母音 ㅗ']] })}<p>判斷三件事：① 是不是 하다 ② 最後母音是不是 ㅏ／ㅗ ③ 有沒有收音、是不是不規則。</p>`],
    ['現在式 -아요／어요', '현재', `<ul class="rules"><li>最後母音是 ㅏ、ㅗ → 加 <b>아요</b>：좋다 → 좋아요</li><li>其他母音 → 加 <b>어요</b>：먹다 → 먹어요</li><li>하다 → <b>해요</b>：공부하다 → 공부해요</li></ul><p>沒有收音時會縮約：</p>${table({ head: ['母音', '變化', '例子'], rows: [['ㅏ', '가＋아 → 가', '가요'], ['ㅗ', 'ㅗ＋아 → ㅘ', '봐요'], ['ㅜ', 'ㅜ＋어 → ㅝ', '배워요'], ['ㅣ', 'ㅣ＋어 → ㅕ', '마셔요'], ['ㅐ', 'ㅐ＋어 → ㅐ', '보내요'], ['ㅡ', 'ㅡ 脫落', '써요、바빠요']] })}<ol class="sents">${ex(['가다', '먹다', '마시다', '보다', '공부하다', '배우다', '쓰다'], 0)}</ol>`],
    ['過去式 -았어요／었어요', '과거', `<p>把現在式的「요」拿掉，在最後一字加上 ㅆ 收音，再接 어요。ㅆ 後面接 어，所以一定連音：먹었어요 念 [머거써요]。</p>${table({ head: ['現在', '過去', '發音'], rows: ['가요|갔어요', '먹어요|먹었어요', '해요|했어요', '들어요|들었어요', '매워요|매웠어요'].map(s => s.split('|')).map(r => [r[0], r[1], `[${pronSentence(r[1])}]`]) })}<ol class="sents">${ex(['가다', '먹다', '하다', '듣다', '만나다', '쉬다'], 1)}</ol>`],
    ['未來式 -(으)ㄹ 거예요', '미래', `<ul class="rules"><li>沒有收音 → 加 ㄹ 收音＋거예요：가다 → 갈 거예요</li><li>有收音 → 을 거예요：먹다 → 먹을 거예요</li><li>ㄹ 收音 → 直接 거예요：살다 → 살 거예요</li><li>發音：ㄹ 後面的 거 念 [꺼]，갈 거예요 → [갈 꺼예요]</li><li>形容詞或第三人稱時表示推測：내일은 추울 거예요（明天應該會冷）</li></ul><ol class="sents">${ex(['가다', '먹다', '살다', '보다', '만들다', '춥다'], 2)}</ol>`],
    ['冠形詞形（修飾名詞）', '관형형', `<ul class="rules"><li>動詞現在：語幹＋<b>는</b>：먹는 음식、가는 사람</li><li>形容詞：沒有收音＋<b>ㄴ</b>、有收音＋<b>은</b>：큰 가방、작은 방</li><li>있다、없다（含 맛있다、재미있다）用 <b>는</b>：맛있는 빵</li><li>ㅂ 不規則：매운、더운；ㄹ 語幹 ㄹ 脫落：사는、먼、단</li><li>發音：먹는 [멍는]、맛있는 [마신는] 都是鼻音化</li></ul><ol class="sents">${ATTR_EX.map(s => sentRow(s)).join('')}</ol>`],
    ['不規則變化', '불규칙', `${table({ head: ['類型', '規則', '例子'], rows: [['ㄷ 不規則', 'ㄷ＋母音 → ㄹ', '듣다 → 들어요、들을 거예요'], ['ㅂ 不規則', 'ㅂ＋母音 → 우（워）', '맵다 → 매워요、매울 거예요'], ['르 不規則', '르 → ㄹ라／ㄹ러', '모르다 → 몰라요'], ['ㄹ 語幹', '遇 ㄴ 脫落，未來不加 을', '살다 → 사는、살 거예요'], ['ㅡ 脫落', 'ㅡ 遇 아/어 脫落', '쓰다 → 써요、바쁘다 → 바빠요']] })}<p class="note">注意：不是所有 ㅂ、ㄷ 收音都不規則，例如 입다 → 입어요、받다 → 받아요 是規則變化。</p><ol class="sents">${['듣다', '맵다', '모르다', '살다', '바쁘다', '쓰다'].map((k, i) => { const w = W.find(x => x.k === k); return sentRow(w.ex[i === 5 ? 1 : 0], k); }).join('')}</ol>`],
    ['-(으)러 가요 去做…', '1B 2과', `<ul class="rules"><li>語幹沒有收音或是 ㄹ 收音 → 러 가요：사러 가요、놀러 가요</li><li>有收音 → 으러 가요：먹으러 가요、찾으러 가요</li><li>ㄷ 不規則：들으러 가요</li><li>「가요」可以換成過去 갔어요、未來 갈 거예요</li></ul><ol class="sents">${PURP_EX.map(s => sentRow(s)).join('')}</ol>`]
  ];
  el.innerHTML = `<div class="rcards">${C.map((c, i) => `<article class="rcard"><span class="num">${i + 1}</span><h3>${c[0]} <small class="muted hg" lang="ko" style="font-size:13px;font-weight:400">${c[1]}</small></h3><div class="body">${c[2]}</div></article>`).join('')}</div>`;
}

// ---------- 閃卡 ----------
function cardsPage(el) {
  el.innerHTML = `<div class="qwrap"><p class="intro">看原型和時態，先自己說出變化形和發音，再翻開確認。</p><div class="qcard vfc"></div></div>`;
  const box = $('.vfc', el);
  let st = { w: null, k: null, rev: false };
  const draw = () => {
    if (!st.w) st = { w: pick(allWords()), k: pick(K), rev: false };
    const { w, k, rev } = st, f = forms(w)[k];
    box.innerHTML = `<div class="fc-card"><p class="fc-q">${TYPE[w.t]}・${esc(w.zh)}</p><div class="fc-w hg" lang="ko">${esc(w.k)}</div><p>請說出 <b>${tn(w, k)}</b></p>${rev ? `<div class="fc-a"><span class="hg" lang="ko">${esc(f)}</span>${prHTML(f)}${sayBtn(f)}</div><p class="note">原型真人發音 ${nvBtn(w.k)}</p>` : '<div class="fc-a muted">想好了再翻開</div>'}</div><div class="fc-btns"><button type="button" class="btn" data-v="rev">${rev ? '再聽一次' : '翻開答案'}</button><button type="button" class="btn ghost" data-v="next">下一張</button></div>`;
  };
  box.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; if (b.dataset.v === 'rev') { st.rev = true; draw(); say(forms(st.w)[st.k]); } else { st.w = null; draw(); } };
  draw();
}

// ---------- 測驗 ----------
function wrongForms(w, k) {
  const stem = w.k.slice(0, -1), f = forms(w), reg = forms({ ...w, irr: '' }), c = [];
  if (k === 'pres') c.push(stem + '아요', stem + '어요', reg.pres);
  if (k === 'past') c.push(stem + '았어요', stem + '었어요', reg.past);
  if (k === 'fut') c.push(stem + '을 거예요', stem + ' 거예요', reg.fut, f.pres.replace(/요$/, 'ㄹ 거예요'));
  if (k === 'attr') c.push(stem + '는', stem + '은', reg.attr);
  return uniq(c.filter(x => x !== f[k] && /^[가-힣 ]+$/.test(x)));
}
export function buildQuiz(pool = allWords()) {
  const formQ = w => {
    const k = pick(K), f = forms(w), r = f[k];
    let d = shuffle(wrongForms(w, k)).slice(0, 3);
    for (const x of shuffle(K.map(z => f[z]))) if (d.length < 3 && x !== r && !d.includes(x)) d.push(x);
    return { word: w.k, type: '選出正確變化', prompt: `<div class="qw hg" lang="ko">${esc(w.k)}</div><p>${esc(w.zh)}　請選出 <b>${tn(w, k)}</b></p>`, options: shuffle([r, ...d]).map(x => ({ v: x, h: `<span class="hg" lang="ko">${esc(x)}</span>` })), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b> [${esc(pronSentence(r))}]　${explain(w)[1]}</span>`, after: r };
  };
  const fillQ = w => {
    if (!w.ex.length) return formQ(w);
    const i = Math.floor(Math.random() * 3), k = ['pres', 'past', 'fut'][i], f = forms(w), [ko, zh] = w.ex[i], r = f[k];
    const wr = wrongForms(w, k);
    const opts = uniq([f.pres, f.past, f.fut, pick(wr.length ? wr : [f.attr])]);
    return { word: w.k, type: '句子填空', prompt: `<p>${esc(zh)}</p><div class="qs" lang="ko">${esc(ko).replace(esc(r), '<span class="blank">　？　</span>')}</div><p class="muted">提示：${esc(w.k)}（${esc(w.zh)}）</p>`, options: shuffle(opts).map(x => ({ v: x, h: `<span class="hg" lang="ko">${esc(x)}</span>` })), ans: r, exp: `${sayBtn(ko)}<span lang="ko"><b>${esc(ko)}</b> ${prHTML(ko)}</span>`, after: ko };
  };
  const listenQ = w => {
    const k = pick(K), f = forms(w)[k];
    return { word: w.k, type: '聽音判斷時態', prompt: `<p>聽到的是「<span class="hg" lang="ko">${esc(w.k)}</span>」的哪一種形態？</p><button type="button" class="btn big" data-say="${esc(f)}">${SPK}再播一次</button>`, options: K.map(z => ({ v: z, h: tn(w, z) })), ans: k, exp: `${sayBtn(f)}<span><b lang="ko">${esc(f)}</b> [${esc(pronSentence(f))}] 是${tn(w, k)}</span>`, auto: f };
  };
  const pronQ = w => {
    const f = forms(w), ks = shuffle(K).filter(k => pronSentence(f[k]) !== f[k]);
    if (!ks.length) return formQ(w);
    const k = ks[0], x = f[k], p = pronSentence(x);
    const o = uniq([p, x, detense(x, p), pronSentence(f[pick(K.filter(z => z !== k))])]);
    for (const z of shuffle(allWords())) if (o.length < 4) { const y = pronSentence(forms(z)[k]); if (!o.includes(y)) o.push(y); }
    return { word: w.k, type: '選出正確發音', prompt: `<div class="qw hg" lang="ko">${esc(x)}</div><p>${tn(w, k)}　實際念成哪一個？</p>`, options: shuffle(o.slice(0, 4)).map(y => ({ v: y, h: `<span lang="ko">[${esc(y)}]</span>` })), ans: p, exp: `${sayBtn(x)}<span><b lang="ko">${esc(x)}</b> → <b lang="ko">[${esc(p)}]</b></span>`, after: x };
  };
  const meanQ = w => {
    const all = allWords(); if (all.length < 4) return formQ(w);
    const o = shuffle([w.k, ...shuffle(all.filter(z => z.k !== w.k && z.zh !== w.zh)).slice(0, 3).map(z => z.k)]);
    return { word: w.k, type: '中韓配對', prompt: `<div class="qw">${esc(w.zh)}</div><p>的韓文原型是？</p>`, options: o.map(x => ({ v: x, h: `<span class="hg" lang="ko">${esc(x)}</span>` })), ans: w.k, exp: `${sayBtn(w.k)}<span><b lang="ko">${esc(w.k)}</b> ${prHTML(w.k)} ${esc(w.zh)}</span>`, after: w.k };
  };
  const plan = [formQ, formQ, formQ, fillQ, fillQ, fillQ, listenQ, listenQ, pronQ, meanQ];
  const sp = shuffle(pool);
  return shuffle(plan.map((fn, i) => fn(sp[i % sp.length])));
}
function quizPage(el) {
  el.innerHTML = `<div class="qwrap"><p class="intro">每回 10 題：選出正確變化、句子填空、聽音判斷時態、選出正確發音、中韓配對。</p><div class="qctl"><select class="vq-type" aria-label="詞類"><option value="all">全部詞類</option><option value="v">動詞</option><option value="a">形容詞</option></select><select class="vq-lesson" aria-label="課別">${lessonOpts}</select><button type="button" class="btn qs-start">開始新的一回</button></div><div class="qcard qbox"></div></div>`;
  const ty = $('.vq-type', el), ls = $('.vq-lesson', el), box = $('.qbox', el);
  const start = () => {
    const pool = allWords().filter(w => typeMatch(w, ty.value) && (ls.value === 'all' || w.l === ls.value));
    if (!pool.length) { box.innerHTML = '<p class="muted">這個範圍沒有單字，請換一個詞類或課別。</p>'; return; }
    runQuiz(box, buildQuiz(pool), 'best_vq_' + ty.value + ls.value, start);
  };
  $('.qs-start', el).onclick = start; ty.onchange = start; ls.onchange = start;
  start();
}

export default {
  id: 'verbs',
  title: '動詞・形容詞',
  ko: '동사 · 형용사',
  pages: [
    { id: 'table', title: '變化表', render: tablePage },
    { id: 'rules', title: '變化規則', render: rulesPage },
    { id: 'cards', title: '閃卡', render: cardsPage },
    { id: 'quiz', title: '測驗', render: quizPage }
  ]
};
