// 發音示範：衛生紙測試（平音／激音／硬音）、子音的發音位置（舌頭擺放）、母音嘴型與舌位
// 圖都是用 SVG 自己畫的示意圖；影片只放外部連結（另開分頁），不嵌入、不轉載。
import { esc } from '../../js/core/dom.js';

const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
const vlink = (href, t, sub) => `<a class="vlink" href="${href}" target="_blank" rel="noopener noreferrer"><span class="vlink-i" aria-hidden="true">▶</span><span><b>${esc(t)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></a>`;
const say = (s, cls = 'chip') => `<button type="button" class="${cls}" data-say="${s}" lang="ko">${s}</button>`;

// ---------- 衛生紙測試 ----------
const tissueSVG = `<svg viewBox="0 0 150 100" class="tis-svg" aria-hidden="true">
  <path class="face" d="M0,0 H50 C54,8 56,16 56,22 C58,26 60,30 66,38 C68,41 66,43 61,44 C62,46 63,48 63,50 C61,52 59,53 58,54 C60,55 62,56 62,58 C61,60 59,62 59,64 C60,70 56,76 50,78 C46,80 44,88 44,100 H0 Z"/>
  <path class="mouth" d="M57,54 h5"/>
  <circle class="eye" cx="44" cy="24" r="2"/>
  <g class="puff"><path d="M66,54 h8"/><path d="M66,50 l7,-2"/><path d="M66,58 l7,2"/></g>
  <path class="hand" d="M70,30 h22"/>
  <path class="tis" d="M74,31 L90,31 C92,48 88,64 91,88 L75,88 C72,64 77,48 74,31 Z"/>
</svg>`;
const TISSUE = [
  ['weak', '平音', '輕輕吐氣，衛生紙微微晃一下', ['가', '다', '바', '자']],
  ['strong', '激音', '用力送氣，衛生紙被吹得飄起來', ['카', '타', '파', '차']],
  ['still', '硬音', '喉嚨用力憋住，幾乎沒有氣，衛生紙不動', ['까', '따', '빠', '짜']]
];
export const tissueHTML = () => `<section class="block"><h3>平音・激音・硬音：衛生紙測試<small>點字母聽發音，看看衛生紙的反應</small></h3>
  <p>拿一張衛生紙（或薄紙）垂在嘴巴正前方，離嘴唇大約 3～5 公分，念念看下面三組字。<b>送出來的氣</b>有多少，就是三種子音最大的差別。</p>
  <div class="tis-row">${TISSUE.map(([k, t, d, xs]) => `<div class="tis-card" data-tis="${k}">
    <button type="button" class="tis-pic" data-say="${xs[0]}" aria-label="念 ${xs[0]}">${tissueSVG}</button>
    <div class="tis-t"><b>${t}</b><span class="muted">${d}</span></div>
    <div class="chip-row">${xs.map(x => say(x)).join('')}</div></div>`).join('')}</div>
  <p class="tip">硬音念之前喉嚨先「憋一下」，像中文說「嗯！」用力時的感覺；念完氣不往外衝。激音則像吹蠟燭一樣把氣送出來。</p>
  <div class="vlinks">${vlink(yt('韓文 平音 激音 硬音 衛生紙'), 'YouTube 搜尋：衛生紙示範', '韓文 平音 激音 硬音 衛生紙')}
    ${vlink('https://www.youtube.com/watch?v=gZ-z5ejEUGw', '平音・硬音・激音發音比較', '신나는한국어 辛老師・中文字幕')}
    ${vlink('https://www.youtube.com/watch?v=lxw3Ec6_fV0', 'Telling Apart ㄱ/ㅋ/ㄲ', 'Your Korean Saem・英文')}</div>
</section>`;

// ---------- 子音的發音位置 ----------
const PLACES = [
  ['雙唇', ['ㅁ', 'ㅂ', 'ㅍ', 'ㅃ'], '上下嘴唇閉起來再打開。ㅁ 是鼻音，嘴唇閉著時氣從鼻子出來。'],
  ['舌尖碰齒齦', ['ㄴ', 'ㄷ', 'ㅌ', 'ㄸ', 'ㄹ'], '舌尖頂住上排牙齒後面那塊硬硬的牙齦（齒齦）。ㄹ 在字首只輕輕彈一下；收尾時舌尖頂著不放。ㄴ 的氣從鼻子出來。'],
  ['舌尖靠近齒齦', ['ㅅ', 'ㅆ'], '舌尖靠近齒齦但不碰到，留一條細縫讓氣「ㄙ」地擦出來。ㅆ 更緊、氣更細。'],
  ['舌面貼硬顎前端', ['ㅈ', 'ㅊ', 'ㅉ'], '舌頭前半段的舌面貼住齒齦後方、上顎前端，放開時帶一點摩擦，像注音 ㄐ。'],
  ['舌根碰軟顎', ['ㄱ', 'ㅋ', 'ㄲ', 'ㅇ'], '舌頭後半部抬高，頂住上顎後面軟軟的地方（軟顎）。收尾的 ㅇ 也是這個位置，氣從鼻子出來，念 ng。'],
  ['喉嚨', ['ㅎ'], '舌頭放鬆、嘴巴打開，氣直接從喉嚨呼出來，像輕輕的「哈」。']
];
export const placeHTML = () => `<section class="block"><h3>子音的發音位置（舌頭擺放）<small>點字母聽發音，對著鏡子練習</small></h3>
  <div class="place-grid">${PLACES.map(([t, xs, d]) => `<div class="place"><div class="place-b"><b>${t}</b><div class="chip-row">${xs.map(c => say(c === 'ㅇ' ? '앙' : String.fromCharCode(0xAC00 + 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.indexOf(c) * 588))).join('')}</div><p class="muted">${d}</p></div></div>`).join('')}</div>
  <p class="tip">韓文子音的字形就是照發音器官畫的：<b lang="ko">ㄱ</b> 像舌根往上擋住喉嚨、<b lang="ko">ㄴ</b> 像舌尖碰到齒齦、<b lang="ko">ㅁ</b> 像嘴巴、<b lang="ko">ㅅ</b> 像牙齒、<b lang="ko">ㅇ</b> 像喉嚨。其他子音是在這五個字上加筆畫（ㄱ→ㅋ、ㄴ→ㄷ→ㅌ、ㅁ→ㅂ→ㅍ、ㅅ→ㅈ→ㅊ、ㅇ→ㅎ）。</p>
  <div class="vlinks">${vlink(yt('韓文 子音 發音位置 舌頭'), 'YouTube 搜尋：子音舌頭位置', '韓文 子音 發音位置 舌頭')}${vlink(yt('한국어 자음 발음 위치 혀'), 'YouTube 搜尋（韓文）', '한국어 자음 발음 위치 혀')}</div>
</section>`;

// ---------- 母音嘴型 ----------
// 嘴型說明：[母音, 開口寬, 開口高, 是否圓唇, 看得到牙齒, 說明]（數值目前沒用到）
const LIPS = [
  ['ㅏ', 22, 20, 0, 0, '嘴巴張大，下巴往下'],
  ['ㅓ', 22, 13, 0, 0, '嘴巴半開，不要圓唇'],
  ['ㅗ', 10, 10, 1, 0, '嘴唇圓起來、往前噘'],
  ['ㅜ', 7, 7, 1, 0, '比 ㅗ 更小更圓，嘴唇往前推'],
  ['ㅡ', 28, 3, 0, 1, '嘴角往兩邊拉平，上下牙快碰到'],
  ['ㅣ', 26, 6, 0, 1, '嘴角往兩邊拉，像微笑'],
  ['ㅔ', 22, 9, 0, 1, '嘴巴稍微打開，嘴角放鬆'],
  ['ㅐ', 23, 13, 0, 1, '比 ㅔ 再張大一點（現在多半念得一樣）']
];
const vs = v => String.fromCharCode(0xAC00 + 11 * 588 + 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.indexOf(v) * 28);
export const lipsHTML = () => `<section class="block"><h3>母音的嘴型與舌位<small>點字母聽發音；對著鏡子看自己的嘴型最清楚</small></h3>
  <div class="lip-grid">${LIPS.map(l => `<button type="button" class="lip" data-say="${vs(l[0])}"><span class="hj-l" lang="ko">${l[0]}</span><span class="muted">${l[5]}</span></button>`).join('')}</div>
  <h4 class="voc-h">舌位表</h4>
  <p class="muted">直的方向是舌頭高低（嘴巴越開、舌頭越低），橫的方向是舌頭偏前還是偏後。</p>
  <div class="ctab-wrap"><table class="ctab vtab"><tr><th></th><th>舌前<br><small>不圓唇</small></th><th>舌後<br><small>不圓唇</small></th><th>舌後<br><small>圓唇</small></th></tr>
    ${[['高<br><small>嘴巴小</small>', 'ㅣ', 'ㅡ', 'ㅜ'], ['中', 'ㅔ', 'ㅓ', 'ㅗ'], ['低<br><small>嘴巴大</small>', 'ㅐ', 'ㅏ', '']].map(([r, ...xs]) => `<tr><th>${r}</th>${xs.map(x => `<td>${x ? `<button type="button" class="bj-s" data-say="${vs(x)}" lang="ko">${x}</button>` : ''}</td>`).join('')}</tr>`).join('')}</table></div>
  <h4 class="voc-h">複合母音：從一個嘴型滑到另一個</h4>
  <div class="glide">${[['ㅣ 開頭', [['ㅑ', 'ㅣ→ㅏ'], ['ㅕ', 'ㅣ→ㅓ'], ['ㅛ', 'ㅣ→ㅗ'], ['ㅠ', 'ㅣ→ㅜ'], ['ㅒ', 'ㅣ→ㅐ'], ['ㅖ', 'ㅣ→ㅔ']]],
    ['ㅗ／ㅜ 開頭（先圓唇）', [['ㅘ', 'ㅗ→ㅏ'], ['ㅙ', 'ㅗ→ㅐ'], ['ㅚ', 'ㅗ→ㅔ'], ['ㅝ', 'ㅜ→ㅓ'], ['ㅞ', 'ㅜ→ㅔ'], ['ㅟ', 'ㅜ→ㅣ']]],
    ['ㅡ 開頭', [['ㅢ', 'ㅡ→ㅣ']]]].map(([t, xs]) => `<div class="glide-g"><b>${t}</b><div class="chip-row">${xs.map(([v, d]) => `<button type="button" class="chip" data-say="${vs(v)}"><span lang="ko">${v}</span> <small class="muted">${d}</small></button>`).join('')}</div></div>`).join('')}</div>
  <div class="vlinks">${vlink(yt('韓文 母音 嘴型 發音'), 'YouTube 搜尋：母音嘴型示範', '韓文 母音 嘴型 發音')}${vlink(yt('한국어 모음 입모양'), 'YouTube 搜尋（韓文）', '한국어 모음 입모양')}</div>
</section>`;

// 衛生紙動畫：點同一張卡片裡的任何字都會動一次
export function bindTissue(el) {
  el.addEventListener('click', e => {
    const card = e.target.closest('[data-tis]'); if (!card || !e.target.closest('[data-say]')) return;
    card.classList.remove('go'); void card.offsetWidth; card.classList.add('go');
  });
}
