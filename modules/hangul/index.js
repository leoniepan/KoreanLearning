// 韓文字母：子音、母音對照表（可點字母聽發音）、字母組合表、字母測驗
import { $, esc, shuffle, pick, uniq } from '../../js/core/dom.js';
import { LJ, VJ, TJ } from '../../js/core/hangul.js';
import { say, sayBtn, SPK } from '../../js/core/speech.js';
import { runQuiz } from '../../js/core/quiz.js';

// 子音：[字母, 名稱, 羅馬拼音（字首/收尾）, 注音近似音, 類別, 例詞, 例詞中文]
export const CONS = [
  ['ㄱ', '기역', 'g / k', '介於 ㄍ 和 ㄎ 之間，比 ㄎ 輕', '平音', '가방', '包包'],
  ['ㄴ', '니은', 'n', 'ㄋ', '鼻音', '나무', '樹'],
  ['ㄷ', '디귿', 'd / t', '介於 ㄉ 和 ㄊ 之間', '平音', '다리', '腿；橋'],
  ['ㄹ', '리을', 'r / l', '字首像輕輕的 ㄌ，收尾像捲舌的 l', '流音', '라면', '泡麵'],
  ['ㅁ', '미음', 'm', 'ㄇ', '鼻音', '마음', '心'],
  ['ㅂ', '비읍', 'b / p', '介於 ㄅ 和 ㄆ 之間', '平音', '바다', '海'],
  ['ㅅ', '시옷', 's', 'ㄙ；接 ㅣ、ㅑ 等時像 ㄒ', '平音', '사과', '蘋果'],
  ['ㅇ', '이응', '— / ng', '在字首不發音；在收尾念 ㄥ（ng）', '鼻音', '아이', '小孩'],
  ['ㅈ', '지읒', 'j', '介於 ㄐ／ㄗ 之間', '平音', '자다', '睡覺'],
  ['ㅊ', '치읓', 'ch', 'ㄑ／ㄘ，送氣', '激音', '차', '車；茶'],
  ['ㅋ', '키읔', 'k', 'ㄎ，用力送氣', '激音', '커피', '咖啡'],
  ['ㅌ', '티읕', 't', 'ㄊ，用力送氣', '激音', '토마토', '番茄'],
  ['ㅍ', '피읖', 'p', 'ㄆ，用力送氣', '激音', '포도', '葡萄'],
  ['ㅎ', '히읗', 'h', 'ㄏ（比較輕）', '喉音', '하나', '一'],
  ['ㄲ', '쌍기역', 'kk', '緊繃的 ㄍ，不送氣', '硬音', '꽃', '花'],
  ['ㄸ', '쌍디귿', 'tt', '緊繃的 ㄉ，不送氣', '硬音', '딸기', '草莓'],
  ['ㅃ', '쌍비읍', 'pp', '緊繃的 ㄅ，不送氣', '硬音', '빵', '麵包'],
  ['ㅆ', '쌍시옷', 'ss', '緊繃的 ㄙ', '硬音', '쌀', '米'],
  ['ㅉ', '쌍지읒', 'jj', '緊繃的 ㄗ', '硬音', '짜다', '鹹']
];
// 母音：[字母, 羅馬拼音, 注音近似音, 類別, 例詞, 例詞中文]
export const VOWS = [
  ['ㅏ', 'a', 'ㄚ', '基本', '아빠', '爸爸'],
  ['ㅑ', 'ya', 'ㄧㄚ', '基本', '야구', '棒球'],
  ['ㅓ', 'eo', 'ㄛ，嘴巴張大、不圓唇', '基本', '어머니', '媽媽'],
  ['ㅕ', 'yeo', 'ㄧㄛ（不圓唇）', '基本', '여자', '女生'],
  ['ㅗ', 'o', 'ㄛ，嘴唇圓起來', '基本', '오이', '小黃瓜'],
  ['ㅛ', 'yo', 'ㄧㄛ（圓唇）', '基本', '요리', '料理'],
  ['ㅜ', 'u', 'ㄨ', '基本', '우유', '牛奶'],
  ['ㅠ', 'yu', 'ㄧㄨ', '基本', '유리', '玻璃'],
  ['ㅡ', 'eu', 'ㄜ／ㄭ，嘴角往兩邊拉', '基本', '그림', '畫'],
  ['ㅣ', 'i', 'ㄧ', '基本', '이', '牙齒；二'],
  ['ㅐ', 'ae', 'ㄝ（嘴巴稍大）', '複合', '개', '狗'],
  ['ㅒ', 'yae', 'ㄧㄝ', '複合', '얘기', '話、聊天'],
  ['ㅔ', 'e', 'ㄝ', '複合', '네', '是的'],
  ['ㅖ', 'ye', 'ㄧㄝ', '複合', '시계', '時鐘'],
  ['ㅘ', 'wa', 'ㄨㄚ', '複合', '사과', '蘋果'],
  ['ㅙ', 'wae', 'ㄨㄝ', '複合', '왜', '為什麼'],
  ['ㅚ', 'oe', 'ㄨㄝ（現代念法和 ㅙ、ㅞ 幾乎一樣）', '複合', '회사', '公司'],
  ['ㅝ', 'wo', 'ㄨㄛ', '複合', '뭐', '什麼'],
  ['ㅞ', 'we', 'ㄨㄝ', '複合', '웨이터', '服務生'],
  ['ㅟ', 'wi', 'ㄩ／ㄨㄧ', '複合', '귀', '耳朵'],
  ['ㅢ', 'ui', 'ㄜ＋ㄧ 快速連念', '複合', '의사', '醫生']
];
const BASIC_C = CONS.slice(0, 14).map(c => c[0]);
const BASIC_V = VOWS.slice(0, 10).map(v => v[0]);
// 子音＋母音（＋收尾）組成一個字
export const syl = (c, v, t = '') => String.fromCharCode(0xAC00 + (LJ.indexOf(c) * 21 + VJ.indexOf(v)) * 28 + TJ.indexOf(t));
// 子音念「子音＋ㅏ」，母音念「ㅇ＋母音」
const soundOfC = c => syl(c, 'ㅏ');
const soundOfV = v => syl('ㅇ', v);

// ---------- 對照表（學習、速查共用） ----------
export function chartPage(el, ctx) {
  const cTile = c => `<button type="button" class="hj" data-say="${soundOfC(c[0])}" title="念 ${soundOfC(c[0])}"><span class="hj-l" lang="ko">${c[0]}</span><span class="hj-r">${c[2]}</span><span class="hj-n" lang="ko">${c[1]}</span></button>`;
  const vTile = v => `<button type="button" class="hj" data-say="${soundOfV(v[0])}" title="念 ${soundOfV(v[0])}"><span class="hj-l" lang="ko">${v[0]}</span><span class="hj-r">${v[1]}</span><span class="hj-n" lang="ko">${soundOfV(v[0])}</span></button>`;
  const grp = (t, list) => `<div class="hj-grp"><h4>${t}</h4><div class="hj-grid">${list.join('')}</div></div>`;
  const byType = t => CONS.filter(c => c[4] === t).map(cTile);
  const detailRows = (list, isC) => `<div class="hj-list">${list.map(x => isC
    ? `<div class="hj-item"><button type="button" class="hj-mini" data-say="${soundOfC(x[0])}" lang="ko">${x[0]}</button><div class="hj-info"><b lang="ko">${x[1]}</b><span class="rom">${x[2]}</span><span class="muted">${esc(x[3])}</span></div><button type="button" class="fm hj-ex" data-say="${x[5]}"><span class="hg" lang="ko">${x[5]}</span><small class="muted">${x[6]}</small></button></div>`
    : `<div class="hj-item"><button type="button" class="hj-mini" data-say="${soundOfV(x[0])}" lang="ko">${x[0]}</button><div class="hj-info"><span class="rom">${x[1]}</span><span class="muted">${esc(x[2])}</span></div><button type="button" class="fm hj-ex" data-say="${x[4]}"><span class="hg" lang="ko">${x[4]}</span><small class="muted">${x[5]}</small></button></div>`).join('')}</div>`;
  const grid = `<div class="ctab-wrap"><table class="ctab bj"><tr><th></th>${BASIC_V.map(v => `<th lang="ko">${v}</th>`).join('')}</tr>${BASIC_C.map(c => `<tr><th lang="ko">${c}</th>${BASIC_V.map(v => { const s = syl(c, v); return `<td><button type="button" class="bj-s" data-say="${s}" lang="ko">${s}</button></td>`; }).join('')}</tr>`).join('')}</table></div>`;
  el.innerHTML = `<div class="stack">
    ${ctx && ctx.quizRoute ? `<div class="lq-top"><button type="button" class="btn" data-hgo="${ctx.quizRoute}">字母測驗</button><span class="muted">看字母選拼音、聽音分辨、拼字</span></div>` : ''}
    <p class="intro">韓文由<b>子音</b>和<b>母音</b>組成，一個字至少是「子音＋母音」。點任何一個字母都可以聽發音（子音用「子音＋ㅏ」念、母音用「ㅇ＋母音」念）。注音只是近似音，請以喇叭和 Naver 的發音為準。</p>
    <section class="block"><h3>子音 19 個<small>點字母聽「子音＋ㅏ」，下方小字是字母名稱</small></h3>
      ${grp('平音（輕輕發，不送氣）', byType('平音'))}
      ${grp('激音（用力送氣）', byType('激音'))}
      ${grp('硬音（喉嚨緊，不送氣）', byType('硬音'))}
      ${grp('鼻音・流音・喉音', [...byType('鼻音'), ...byType('流音'), ...byType('喉音')])}
      <p class="tip">最容易混淆的三組：가／카／까、다／타／따、바／파／빠、자／차／짜。平音輕、激音送氣、硬音緊。</p>
    </section>
    <section class="block"><h3>母音 21 個<small>點字母聽「ㅇ＋母音」</small></h3>
      ${grp('基本母音 10 個', VOWS.filter(v => v[3] === '基本').map(vTile))}
      ${grp('複合母音 11 個', VOWS.filter(v => v[3] === '複合').map(vTile))}
      <p class="tip">ㅓ 和 ㅗ 都像「ㄛ」：ㅓ 嘴巴張大不圓唇，ㅗ 嘴唇圓起來。ㅐ 和 ㅔ 現在的首爾話幾乎念得一樣。</p>
    </section>
    <section class="block"><h3>字母組合表（反切表）<small>基本子音 × 基本母音，點字聽發音</small></h3>${grid}
      <p class="note">寫法：ㅏㅑㅓㅕㅣ 這類直的母音寫在子音右邊（가）；ㅗㅛㅜㅠㅡ 這類橫的母音寫在子音下面（고）。</p>
    </section>
    <section class="block"><h3>子音詳細對照<small>名稱、羅馬拼音、注音近似音和例詞；點例詞聽發音</small></h3>${detailRows(CONS, true)}</section>
    <section class="block"><h3>母音詳細對照<small>羅馬拼音、注音近似音和例詞</small></h3>${detailRows(VOWS, false)}</section>
    <section class="block"><h3>收尾音（받침）</h3><p>字的最下面那個子音叫收尾音。收尾雖然寫法很多，念起來只有 7 種：<b lang="ko">ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ</b>（例如 ㅋ、ㄲ 收尾都念 ㄱ）。詳細規則在「發音規則」。</p>
      <div class="hj-grid">${[['ㄱ', '각'], ['ㄴ', '간'], ['ㄷ', '갇'], ['ㄹ', '갈'], ['ㅁ', '감'], ['ㅂ', '갑'], ['ㅇ', '강']].map(([t, s]) => `<button type="button" class="hj" data-say="${s}"><span class="hj-l" lang="ko">${s}</span><span class="hj-r">收尾 ${t}</span></button>`).join('')}</div></section>
  </div>`;
  el.onclick = e => { const b = e.target.closest('[data-hgo]'); if (b && ctx) ctx.go(b.dataset.hgo); };
}

// ---------- 測驗 ----------
const opt = x => ({ v: x, h: `<span class="hg" lang="ko">${esc(x)}</span>` });
const SIM = [['ㄱ', 'ㅋ', 'ㄲ'], ['ㄷ', 'ㅌ', 'ㄸ'], ['ㅂ', 'ㅍ', 'ㅃ'], ['ㅈ', 'ㅊ', 'ㅉ'], ['ㅅ', 'ㅆ', 'ㅎ']];
const SIMV = [['ㅓ', 'ㅗ', 'ㅜ', 'ㅡ'], ['ㅐ', 'ㅔ', 'ㅓ', 'ㅏ'], ['ㅕ', 'ㅛ', 'ㅑ', 'ㅠ'], ['ㅘ', 'ㅝ', 'ㅙ', 'ㅟ'], ['ㅡ', 'ㅢ', 'ㅣ', 'ㅜ']];
export function buildQuiz(focus = 'all') {
  const consPool = focus === 'v' ? [] : CONS, vowPool = focus === 'c' ? [] : VOWS;
  const romC = () => { const c = pick(consPool); return { type: '子音的羅馬拼音', prompt: `<div class="qw hg" lang="ko">${c[0]}</div><p>這個子音的羅馬拼音是？</p>`, options: shuffle(uniq([c[2], ...shuffle(CONS.filter(x => x[2] !== c[2])).slice(0, 3).map(x => x[2])])).map(x => ({ v: x, h: x })), ans: c[2], exp: `${sayBtn(soundOfC(c[0]))}<span><b lang="ko">${c[0]}</b>（${c[1]}）＝ ${c[2]}；${esc(c[3])}</span>`, after: soundOfC(c[0]) }; };
  const nameC = () => { const c = pick(consPool); return { type: '子音的名稱', prompt: `<div class="qw hg" lang="ko">${c[0]}</div><p>這個子音的名稱是？</p>`, options: shuffle([c[1], ...shuffle(CONS.filter(x => x !== c)).slice(0, 3).map(x => x[1])]).map(opt), ans: c[1], exp: `${sayBtn(c[1])}<span><b lang="ko">${c[0]}</b> 的名稱是 <b lang="ko">${c[1]}</b></span>`, after: c[1] }; };
  const romV = () => { const v = pick(vowPool); return { type: '母音的羅馬拼音', prompt: `<div class="qw hg" lang="ko">${v[0]}</div><p>這個母音的羅馬拼音是？</p>`, options: shuffle([v[1], ...shuffle(VOWS.filter(x => x !== v)).slice(0, 3).map(x => x[1])]).map(x => ({ v: x, h: x })), ans: v[1], exp: `${sayBtn(soundOfV(v[0]))}<span><b lang="ko">${v[0]}</b> ＝ ${v[1]}；${esc(v[2])}</span>`, after: soundOfV(v[0]) }; };
  const listenC = () => { const g = pick(SIM.filter(s => s.some(c => consPool.some(x => x[0] === c)))), v = pick(['ㅏ', 'ㅗ', 'ㅣ', 'ㅜ']), c = pick(g), r = syl(c, v); return { type: '聽音選字（子音）', prompt: `<p>聽發音，選出正確的字（注意平音／激音／硬音）</p><button type="button" class="btn big" data-say="${r}">${SPK}再播一次</button>`, options: shuffle(g.map(x => syl(x, v))).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${r}</b>　子音 ${c}（${CONS.find(x => x[0] === c)[4]}）</span>`, auto: r }; };
  const listenV = () => { const g = pick(SIMV.filter(s => s.some(v => vowPool.some(x => x[0] === v)))), v = pick(g), r = soundOfV(v); return { type: '聽音選字（母音）', prompt: `<p>聽發音，選出正確的字</p><button type="button" class="btn big" data-say="${r}">${SPK}再播一次</button>`, options: shuffle(g.map(soundOfV)).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${r}</b>　母音 ${v}（${VOWS.find(x => x[0] === v)[1]}）</span>`, auto: r }; };
  const compose = () => { const c = pick(BASIC_C.concat(['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'])), v = pick(VOWS)[0], r = syl(c, v); const wrong = uniq([syl(c, pick(VOWS.filter(x => x[0] !== v))[0]), syl(pick(CONS.filter(x => x[0] !== c))[0], v), syl(pick(CONS.filter(x => x[0] !== c))[0], pick(VOWS)[0])]).filter(x => x !== r); return { type: '拼出一個字', prompt: `<div class="qw hg" lang="ko">${c} ＋ ${v}</div><p>組合起來是哪一個字？</p>`, options: shuffle([r, ...wrong.slice(0, 3)]).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${c} ＋ ${v} ＝ ${r}</b></span>`, after: r }; };
  const readW = () => { const w = pick((focus === 'v' ? VOWS.map(v => [v[4], v[5]]) : focus === 'c' ? CONS.map(c => [c[5], c[6]]) : CONS.map(c => [c[5], c[6]]).concat(VOWS.map(v => [v[4], v[5]])))); const all = CONS.map(c => [c[5], c[6]]).concat(VOWS.map(v => [v[4], v[5]])); return { type: '認讀單字', prompt: `<div class="qw hg" lang="ko">${w[0]}</div><p>念念看，中文意思是？</p>`, options: shuffle(uniq([w[1], ...shuffle(all.filter(x => x[1] !== w[1])).slice(0, 3).map(x => x[1])])).map(x => ({ v: x, h: esc(x) })), ans: w[1], exp: `${sayBtn(w[0])}<span><b lang="ko">${w[0]}</b>　${esc(w[1])}</span>`, after: w[0] }; };
  const plan = focus === 'c' ? [romC, romC, nameC, nameC, listenC, listenC, listenC, compose, compose, readW] : focus === 'v' ? [romV, romV, romV, listenV, listenV, listenV, compose, compose, readW, readW] : [romC, nameC, romV, romV, listenC, listenC, listenV, listenV, compose, readW];
  return shuffle(plan.map(f => f()));
}

export function quizPage(el) {
  el.innerHTML = `<div class="qwrap"><p class="intro">每回 10 題：看字母選拼音、子音名稱、聽音分辨平音／激音／硬音、聽音分辨母音、拼字、認讀單字。</p>
    <div class="qctl"><select class="qf" aria-label="範圍"><option value="all">子音＋母音（綜合）</option><option value="c">只考子音</option><option value="v">只考母音</option></select><button type="button" class="btn qs-start">開始新的一回</button></div>
    <div class="qcard qbox"></div></div>`;
  const sel = $('.qf', el), box = $('.qbox', el);
  const start = () => runQuiz(box, buildQuiz(sel.value), 'best_hangul_' + sel.value, start);
  $('.qs-start', el).onclick = start; sel.onchange = start;
  start();
}
