// 發音示範：衛生紙測試（平音／激音／硬音）、子音的發音位置（舌頭擺放）、母音嘴型與舌位
// 圖都是用 SVG 自己畫的示意圖；影片只放外部連結（另開分頁），不嵌入、不轉載。
import { esc } from '../../js/core/dom.js';

const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
const vlink = (href, t, sub) => `<a class="vlink" href="${href}" target="_blank" rel="noopener noreferrer"><span class="vlink-i" aria-hidden="true">▶</span><span><b>${esc(t)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></a>`;
const say = (s, cls = 'chip') => `<button type="button" class="${cls}" data-say="${s}" lang="ko">${s}</button>`;

// ---------- 衛生紙測試 ----------
const tissueSVG = `<svg viewBox="0 0 150 100" class="tis-svg" aria-hidden="true">
  <path class="face" d="M30,2 C30,14 22,24 14,30 C10,34 16,38 24,40 C22,44 20,46 24,48 L32,48 C26,52 26,56 32,58 C24,62 26,70 34,78 C36,90 34,98 34,100"/>
  <g class="puff"><path d="M40,53 h18"/><path d="M42,47 h12"/><path d="M42,59 h12"/></g>
  <line class="clip" x1="78" y1="6" x2="98" y2="6"/>
  <path class="tis" d="M80,8 L96,8 C98,30 94,50 97,92 L81,92 C78,60 83,30 80,8 Z"/>
</svg>`;
const TISSUE = [
  ['weak', '平音', '輕輕吐氣，衛生紙微微晃一下', ['가', '다', '바', '자']],
  ['strong', '激音', '用力送氣，衛生紙被吹得飄起來', ['카', '타', '파', '차']],
  ['still', '硬音', '喉嚨用力憋住，幾乎沒有氣，衛生紙不動', ['까', '따', '빠', '짜']]
];
export const tissueHTML = () => `<section class="block"><h3>平音・激音・硬音：衛生紙測試<small>點字母聽發音，看看衛生紙的反應</small></h3>
  <p>拿一張衛生紙（或薄紙）垂在嘴巴前面大約 5 公分，念念看下面三組字。<b>送出來的氣</b>有多少，就是三種子音最大的差別。</p>
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
// 側面剖面示意圖：臉朝左。舌頭形狀、嘴唇開合、接觸點、氣流依位置不同。
const TONGUE = {
  rest: 'M46,97 C44,89 50,84 62,82 C90,77 120,73 140,78 C156,84 162,102 160,130 L158,178 L72,178 C60,150 52,122 46,97 Z',
  tip: 'M47,92 C42,80 44,68 52,63 C62,64 72,72 92,76 C116,74 136,74 148,82 C160,92 162,106 160,130 L158,178 L72,178 C60,150 52,122 47,92 Z',
  near: 'M47,93 C43,83 46,74 54,70 C64,70 74,74 92,77 C116,75 136,75 148,82 C160,92 162,106 160,130 L158,178 L72,178 C60,150 52,122 47,93 Z',
  blade: 'M48,95 C44,86 48,76 56,70 C62,62 72,58 84,60 C104,66 130,72 148,82 C160,92 162,106 160,130 L158,178 L72,178 C60,150 52,122 48,95 Z',
  back: 'M46,97 C44,89 50,86 62,86 C82,86 102,80 118,66 C128,57 142,56 150,64 C160,76 162,102 160,130 L158,178 L72,178 C60,150 52,122 46,97 Z'
};
function headSVG({ tongue = 'rest', lips = 'open', hit, gap, air, nose }) {
  const up = lips === 'closed' ? 5 : 0, dn = lips === 'closed' ? -5 : lips === 'wide' ? 5 : 0;
  return `<svg viewBox="0 0 200 180" class="head" aria-hidden="true">
    <path class="hd-line" d="M22,6 C24,18 12,30 10,38 C10,44 22,48 30,54"/>
    <path class="hd-line" d="M30,${108 + dn} C24,120 28,136 46,146 C60,152 70,164 72,180"/>
    <path class="hd-line" d="M62,40 C96,30 140,34 172,52" stroke-dasharray="3 3"/>
    <path class="hd-line" d="M178,40 C182,80 180,130 176,180"/>
    <path class="hd-tongue" d="${TONGUE[tongue]}"/>
    <path class="hd-palate" d="M44,66 C46,60 52,56 60,55 C82,50 106,46 126,50 C142,53 152,60 158,72 C162,80 160,88 153,90"/>
    <g transform="translate(0,${up})"><path class="hd-lip" d="M42,58 C30,56 20,60 16,68 C18,74 28,77 42,75 Z"/><path class="hd-teeth" d="M38,60 L46,62 L45,74 L39,76 Z"/></g>
    <g transform="translate(0,${dn})"><path class="hd-lip" d="M42,88 C30,86 20,88 18,94 C20,102 30,106 42,102 Z"/><path class="hd-teeth" d="M39,86 L45,88 L46,98 L38,99 Z"/></g>
    ${hit ? `<circle class="hd-hit" cx="${hit[0]}" cy="${hit[1]}" r="7"/>` : ''}
    ${gap ? `<path class="hd-air" d="${gap}"/>` : ''}
    ${air ? `<path class="hd-air" d="${air}"/>` : ''}
    ${nose ? `<path class="hd-air" d="M168,150 C170,104 168,72 152,58 C132,42 92,36 62,40 C44,42 30,40 16,38"/>` : ''}
    <text x="100" y="26" class="hd-lbl">鼻腔</text><text x="96" y="122" class="hd-lbl">舌頭</text><text x="182" y="120" class="hd-lbl" text-anchor="end">喉</text>
  </svg>`;
}
const PLACES = [
  ['雙唇', ['ㅁ', 'ㅂ', 'ㅍ', 'ㅃ'], '上下嘴唇閉起來再打開。ㅁ 是鼻音，嘴唇閉著時氣從鼻子出來（虛線）。', { lips: 'closed', hit: [22, 81], nose: true }],
  ['舌尖碰齒齦', ['ㄴ', 'ㄷ', 'ㅌ', 'ㄸ', 'ㄹ'], '舌尖頂住上排牙齒後面那塊硬硬的牙齦（齒齦）。ㄹ 在字首只輕輕彈一下；收尾時舌尖頂著不放。ㄴ 的氣從鼻子出來。', { tongue: 'tip', hit: [52, 61] }],
  ['舌尖靠近齒齦', ['ㅅ', 'ㅆ'], '舌尖靠近齒齦但不碰到，留一條細縫讓氣「ㄙ」地擦出來。ㅆ 更緊、氣更細。', { tongue: 'near', hit: [55, 64], gap: 'M70,70 C60,66 52,64 40,70 L20,80' }],
  ['舌面貼硬顎前端', ['ㅈ', 'ㅊ', 'ㅉ'], '舌頭前半段的舌面貼住齒齦後方、上顎前端，放開時帶一點摩擦，像注音 ㄐ。', { tongue: 'blade', hit: [70, 56] }],
  ['舌根碰軟顎', ['ㄱ', 'ㅋ', 'ㄲ', 'ㅇ'], '舌頭後半部抬高，頂住上顎後面軟軟的地方（軟顎）。收尾的 ㅇ 也是這個位置，氣從鼻子出來，念 ng。', { tongue: 'back', hit: [138, 58] }],
  ['喉嚨', ['ㅎ'], '舌頭放鬆、嘴巴打開，氣直接從喉嚨呼出來，像輕輕的「哈」。', { lips: 'wide', air: 'M168,170 C170,120 168,96 140,92 C110,88 70,84 14,84' }]
];
export const placeHTML = () => `<section class="block"><h3>子音的發音位置（舌頭擺放）<small>側面剖面示意圖，臉朝左；紅圈是接觸的地方，點字母聽發音</small></h3>
  <div class="place-grid">${PLACES.map(([t, xs, d, o]) => `<div class="place">${headSVG(o)}<div class="place-b"><b>${t}</b><div class="chip-row">${xs.map(c => say(c === 'ㅇ' ? '앙' : String.fromCharCode(0xAC00 + 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.indexOf(c) * 588))).join('')}</div><p class="muted">${d}</p></div></div>`).join('')}</div>
  <p class="tip">韓文子音的字形就是照發音器官畫的：<b lang="ko">ㄱ</b> 像舌根往上擋住喉嚨、<b lang="ko">ㄴ</b> 像舌尖碰到齒齦、<b lang="ko">ㅁ</b> 像嘴巴、<b lang="ko">ㅅ</b> 像牙齒、<b lang="ko">ㅇ</b> 像喉嚨。其他子音是在這五個字上加筆畫（ㄱ→ㅋ、ㄴ→ㄷ→ㅌ、ㅁ→ㅂ→ㅍ、ㅅ→ㅈ→ㅊ、ㅇ→ㅎ）。</p>
  <div class="vlinks">${vlink(yt('韓文 子音 發音位置 舌頭'), 'YouTube 搜尋：子音舌頭位置', '韓文 子音 發音位置 舌頭')}${vlink(yt('한국어 자음 발음 위치 혀'), 'YouTube 搜尋（韓文）', '한국어 자음 발음 위치 혀')}</div>
</section>`;

// ---------- 母音嘴型 ----------
// 正面嘴型：[母音, 開口寬, 開口高, 是否圓唇, 看得到牙齒, 說明]
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
function lipSVG([, w, h, round, teeth]) {
  const ow = w + (round ? 13 : 12), oh = h + (round ? 12 : 9);
  return `<svg viewBox="0 0 90 60" class="lips" aria-hidden="true">
    <ellipse class="lp-o" cx="45" cy="30" rx="${ow}" ry="${oh}"/>
    <clipPath id="lc${w}${h}"><ellipse cx="45" cy="30" rx="${w}" ry="${h}"/></clipPath>
    <ellipse class="lp-i" cx="45" cy="30" rx="${w}" ry="${h}"/>
    ${teeth ? `<rect class="lp-t" x="${45 - w}" y="${30 - h - 1}" width="${w * 2}" height="${Math.max(3, h * 0.6)}" clip-path="url(#lc${w}${h})"/>` : ''}
    ${round ? '' : `<path class="lp-c" d="M${45 - ow},30 l-4,0 M${45 + ow},30 l4,0"/>`}
  </svg>`;
}
const vs = v => String.fromCharCode(0xAC00 + 11 * 588 + 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.indexOf(v) * 28);
export const lipsHTML = () => `<section class="block"><h3>母音的嘴型與舌位<small>點嘴型或字母聽發音；對著鏡子比較最清楚</small></h3>
  <div class="lip-grid">${LIPS.map(l => `<button type="button" class="lip" data-say="${vs(l[0])}">${lipSVG(l)}<span class="hj-l" lang="ko">${l[0]}</span><span class="muted">${l[5]}</span></button>`).join('')}</div>
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
