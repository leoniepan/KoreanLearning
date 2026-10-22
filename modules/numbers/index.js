// 單元：數字（漢字語數字、固有語數字、量詞、時間、價錢）
import { $, esc, shuffle, pick, uniq } from '../../js/core/dom.js';
import { pronSentence } from '../../js/core/hangul.js';
import { SPK, sayBtn, nvBtn } from '../../js/core/speech.js';
import { diffHTML, sentRow, table } from '../../js/core/render.js';
import { runQuiz } from '../../js/core/quiz.js';

// ---------- 念法 ----------
const SD = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
function sino4(n) {
  let s = '';
  for (const [u, name] of [[1000, '천'], [100, '백'], [10, '십'], [1, '']]) {
    const d = Math.floor(n / u) % 10;
    if (d) s += (d === 1 && u > 1 ? '' : SD[d]) + name;
  }
  return s;
}
// 漢字語數字（0～99,999,999）：만 為一段，段與段之間空一格
export function sino(n) {
  if (n === 0) return '영';
  const man = Math.floor(n / 10000), rest = n % 10000, parts = [];
  if (man) parts.push((man === 1 ? '' : sino4(man)) + '만');
  if (rest) parts.push(sino4(rest));
  return parts.join(' ');
}
const NU = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const MU = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const NT = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
// 固有語數字（1～99）；mod=true 時是接量詞的形態（한 개、스무 살）
export function native(n, mod = false) {
  if (n < 1 || n > 99) return '';
  const t = Math.floor(n / 10), u = n % 10;
  if (mod && n === 20) return '스무';
  return NT[t] + (mod ? MU : NU)[u];
}
const month = m => m === 6 ? '유월' : m === 10 ? '시월' : sino(m) + '월';
const timeRead = (h, m) => `${native(h, true)} 시${m ? ` ${sino(m)} 분` : ''}`;

// 漢字語數字的發音：십육 [심뉵]（ㄴ 添加）、칠십 [칠씹]（漢字語 ㄹ 後硬音化）再交給發音引擎
const pronNum = s => pronSentence(s.replace(/([십백천만])육/g, '$1뉵').replace(/([일칠팔])십/g, '$1씹'));
const prNum = s => `<span class="pr">[${diffHTML(s, pronNum(s))}]</span>`;
const fmt = n => n.toLocaleString('en-US');
const WD = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const WDZ = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const dateRead = (y, m, d) => `${y ? sino(y) + ' 년 ' : ''}${month(m)} ${sino(d)} 일`;
const won = n => `${sino(n)} 원`;
const hours = h => `${native(h, true)} 시간`;
// 漢字語數字的例句（附數字專用發音）
const sentsN = list => `<ol class="sents">${list.map(([ko, zh]) => `<li class="sent">${sayBtn(ko)}<div class="sent-b"><div class="ko" lang="ko">${esc(ko)}</div>${prNum(ko)}<div class="zh">${esc(zh)}</div></div></li>`).join('')}</ol>`;
const cards = C => `<div class="rcards">${C.map((c, i) => `<article class="rcard"><span class="num">${i + 1}</span><h3>${c[0]} <small class="muted hg" lang="ko" style="font-size:13px;font-weight:400">${c[1]}</small></h3><div class="body">${c[2]}</div></article>`).join('')}</div>`;

// ---------- 數字表 ----------
// [數字, 韓文, 羅馬拼音, 說明]
const SINO = [
  [0, '영 / 공', 'yeong / gong', '공 用在電話號碼'], [1, '일', 'il'], [2, '이', 'i'], [3, '삼', 'sam'], [4, '사', 'sa'], [5, '오', 'o'],
  [6, '육', 'yuk'], [7, '칠', 'chil'], [8, '팔', 'pal'], [9, '구', 'gu'], [10, '십', 'sip'],
  [11, '십일', 'sibil'], [12, '십이', 'sibi'], [16, '십육', 'simnyuk', '念 [심뉵]'], [20, '이십', 'isip'], [30, '삼십', 'samsip'],
  [40, '사십', 'sasip'], [50, '오십', 'osip'], [60, '육십', 'yuksip'], [70, '칠십', 'chilsip'], [80, '팔십', 'palsip'], [90, '구십', 'gusip'],
  [100, '백', 'baek', '不說 일백'], [1000, '천', 'cheon', '不說 일천'], [10000, '만', 'man', '不說 일만'], [100000, '십만', 'simman'], [1000000, '백만', 'baengman']
];
// [數字, 韓文, 接量詞的形態, 羅馬拼音]
const NATIVE = [
  [1, '하나', '한', 'hana / han'], [2, '둘', '두', 'dul / du'], [3, '셋', '세', 'set / se'], [4, '넷', '네', 'net / ne'], [5, '다섯', '다섯', 'daseot'],
  [6, '여섯', '여섯', 'yeoseot'], [7, '일곱', '일곱', 'ilgop'], [8, '여덟', '여덟', 'yeodeol'], [9, '아홉', '아홉', 'ahop'], [10, '열', '열', 'yeol'],
  [20, '스물', '스무', 'seumul / seumu'], [30, '서른', '서른', 'seoreun'], [40, '마흔', '마흔', 'maheun'], [50, '쉰', '쉰', 'swin'],
  [60, '예순', '예순', 'yesun'], [70, '일흔', '일흔', 'ilheun'], [80, '여든', '여든', 'yeodeun'], [90, '아흔', '아흔', 'aheun']
];
const rd = (k, prFn) => `<button type="button" class="fm" data-say="${esc(k)}"><span class="hg" lang="ko">${esc(k)}</span>${prFn(k)}</button>`;

function tablePage(el) {
  const sinoRows = SINO.map(([n, k, r, note]) => `<tr><td class="num-n">${fmt(n)}</td><td>${k.includes('/') ? `<span class="hg" lang="ko">${esc(k)}</span>` : rd(k, prNum)}</td><td class="rom">${r}</td><td class="muted">${note || ''}</td></tr>`).join('');
  const natRows = NATIVE.map(([n, k, m, r]) => `<tr><td class="num-n">${n}</td><td>${rd(k, w => `<span class="pr">[${diffHTML(w, pronSentence(w))}]</span>`)}</td><td>${m !== k ? `<span class="hg" lang="ko">${m}</span>` : '<span class="muted">同左</span>'}</td><td class="rom">${r}</td></tr>`).join('');
  el.innerHTML = `
  <p class="intro" style="margin-bottom:16px">韓文有兩套數字：<b>漢字語數字</b>（일、이、삼…）和<b>固有語數字</b>（하나、둘、셋…）。點任何一個念法都可以聽發音；羅馬拼音依韓國官方的「國語羅馬字表記法」。</p>
  <div class="numgrid">
    <section class="block"><h3>漢字語數字<small>한자어 수사</small></h3>
      <div class="ctab-wrap"><table class="ctab ntab"><tr><th>數字</th><th>念法</th><th>羅馬拼音</th><th>說明</th></tr>${sinoRows}</table></div>
      <p class="note">組合方式和中文一樣：23 ＝ 이십삼、365 ＝ 삼백육십오、2026 ＝ 이천이십육。</p>
    </section>
    <section class="block"><h3>固有語數字<small>고유어 수사</small></h3>
      <div class="ctab-wrap"><table class="ctab ntab"><tr><th>數字</th><th>念法</th><th>接量詞時</th><th>羅馬拼音</th></tr>${natRows}</table></div>
      <p class="note">固有語數字通常只用到 99：11 ＝ 열하나、25 ＝ 스물다섯。100 以上改用漢字語數字。</p>
    </section>
  </div>`;
}

// ---------- 用法與量詞 ----------
function usagePage(el) {
  const C = [
    ['什麼時候用哪一套', '언제 무엇을', `${table({ head: ['漢字語數字', '固有語數字'], rows: [['日期：年、月、日', '個數：개（個）'], ['時間的「分」：분', '時間的「點」：시'], ['價錢：원（元）', '人數：명（名）'], ['電話號碼、門牌、樓層：층', '年齡：살（歲）'], ['分鐘數、公里、公斤等單位', '杯：잔、本：권、張：장、瓶：병']] })}<p>簡單記法：<b>數「東西、人、年紀、點鐘」用固有語</b>；其他大多用漢字語。</p>`],
    ['固有語接量詞的變形', '수 관형사', `<ul class="rules"><li>1～4 和 20 接量詞時要變形：하나 → <b>한</b>、둘 → <b>두</b>、셋 → <b>세</b>、넷 → <b>네</b>、스물 → <b>스무</b></li><li>十幾、二十幾也一樣：열한 개、스물두 살</li><li>5 以上不變：다섯 명、여섯 잔</li></ul><ol class="sents">${[['사과 세 개 주세요.', '請給我三個蘋果。'], ['커피 두 잔 주세요.', '請給我兩杯咖啡。'], ['학생이 다섯 명 있어요.', '有五個學生。'], ['저는 스무 살이에요.', '我二十歲。'], ['책을 한 권 샀어요.', '買了一本書。'], ['동생은 열한 살이에요.', '弟弟十一歲。']].map(s => sentRow(s)).join('')}</ol>`],
    ['漢字語數字的用法', '한자어 수사', `<ul class="rules"><li>價錢：삼만 원（30,000 元）、사천오백 원（4,500 元）</li><li>樓層、分鐘：이 층（2 樓）、오십 분（50 分鐘）</li><li>年份：이천이십육 년（2026 年）</li><li>發音：십육 念 [심뉵]、칠십 念 [칠씹]、팔십 念 [팔씹]</li></ul><ol class="sents">${[['이 가방은 삼만 원이에요.', '這個包包三萬元。'], ['커피는 사천오백 원이에요.', '咖啡四千五百元。'], ['저는 이 층에 살아요.', '我住在二樓。'], ['수업은 오십 분이에요.', '一堂課五十分鐘。'], ['이천이십육 년에 한국에 갔어요.', '2026 年去了韓國。']].map(([ko, zh]) => `<li class="sent">${sayBtn(ko)}<div class="sent-b"><div class="ko" lang="ko">${esc(ko)}</div>${prNum(ko)}<div class="zh">${esc(zh)}</div></div></li>`).join('')}</ol>`],
    ['時間：點用固有語、分用漢字語', '시간', `<ul class="rules"><li>「幾點」用固有語：한 시、두 시、열두 시</li><li>「幾分」用漢字語：십 분、삼십 분；30 分也可以說 반（半）</li><li>問時間：지금 몇 시예요?（現在幾點？）</li></ul>${table({ head: ['時間', '念法'], rows: [['1:00', timeRead(1, 0)], ['3:30', timeRead(3, 30) + '／세 시 반'], ['7:15', timeRead(7, 15)], ['10:45', timeRead(10, 45)], ['12:20', timeRead(12, 20)]] })}<ol class="sents">${[['지금 세 시예요.', '現在三點。'], ['아침 일곱 시에 일어나요.', '早上七點起床。'], ['두 시 반에 만나요.', '兩點半見。']].map(s => sentRow(s)).join('')}</ol>`],
    ['月份與日期', '월과 일', `<p>月份都用漢字語數字，只有 <b>6 月 유월</b>、<b>10 月 시월</b> 要特別記（不是 육월、십월）。</p>${table({ head: ['月', '念法', '月', '念法'], rows: [1, 2, 3, 4, 5, 6].map(m => [`${m} 月`, month(m), `${m + 6} 月`, month(m + 6)]) })}<ol class="sents">${[['제 생일은 유월 십오 일이에요.', '我的生日是六月十五日。'], ['시월에 한국에 갈 거예요.', '十月要去韓國。']].map(([ko, zh]) => `<li class="sent">${sayBtn(ko)}<div class="sent-b"><div class="ko" lang="ko">${esc(ko)}</div>${prNum(ko)}<div class="zh">${esc(zh)}</div></div></li>`).join('')}</ol>`]
  ];
  el.innerHTML = `<div class="rcards">${C.map((c, i) => `<article class="rcard"><span class="num">${i + 1}</span><h3>${c[0]} <small class="muted hg" lang="ko" style="font-size:13px;font-weight:400">${c[1]}</small></h3><div class="body">${c[2]}</div></article>`).join('')}</div>`;
}

// ---------- 星期・日期・時間 ----------
function datesPage(el) {
  const C = [
    ['星期', '요일', `${table({ head: ['星期', '韓文', '漢字'], rows: [1, 2, 3, 4, 5, 6, 0].map(i => [WDZ[i], WD[i], '月火水木金土日'[(i + 6) % 7]]) })}
      <ul class="rules"><li>問星期幾：오늘이 무슨 요일이에요?（不說 몇 요일）</li><li>「在星期幾」加 에：월요일에 만나요</li><li>平日 평일、週末 주말；週一到週五 월요일부터 금요일까지</li></ul>
      ${sentsN([['오늘이 무슨 요일이에요? — 수요일이에요.', '今天星期幾？— 星期三。'], ['토요일에 친구를 만나요.', '星期六和朋友見面。'], ['주말에는 회사에 안 가요.', '週末不去公司。'], ['월요일부터 금요일까지 일해요.', '星期一到星期五工作。']])}`],
    ['相對的日子', '어제・오늘・내일', `${table({ head: ['前天', '昨天', '今天', '明天', '後天'], rows: [['그저께', '어제', '오늘', '내일', '모레']] })}
      ${table({ head: ['', '上一個', '這一個', '下一個'], rows: [['週', '지난주', '이번 주', '다음 주'], ['月', '지난달', '이번 달', '다음 달'], ['年', '작년', '올해', '내년']] })}
      <p class="note">어제、오늘、내일、모레 和 지난주、올해 這類詞後面<b>不加 에</b>：내일 만나요。</p>
      ${sentsN([['모레 시험이 있어요.', '後天有考試。'], ['지난주 토요일에 부산에 갔어요.', '上週六去了釜山。'], ['다음 달 초에 이사해요.', '下個月初搬家。'], ['올해 한국어를 배우기 시작했어요.', '今年開始學韓文。']])}`],
    ['年・月・日', '년・월・일', `<ul class="rules"><li>順序和中文一樣：年 → 月 → 日，全部用漢字語數字</li><li>6 月 <b>유월</b>、10 月 <b>시월</b> 是特殊念法</li><li>問日期：오늘이 며칠이에요?（幾號，寫成 며칠，不寫 몇 일）</li><li>問「什麼時候」：생일이 언제예요?</li></ul>
      ${table({ head: ['寫法', '念法'], rows: [['2026年10月22日', dateRead(2026, 10, 22)], ['6月6日', dateRead(0, 6, 6)], ['1月1日', dateRead(0, 1, 1)], ['12月25日', dateRead(0, 12, 25)]] })}
      ${sentsN([['오늘이 며칠이에요? — 시월 이십이 일이에요.', '今天幾號？— 十月二十二日。'], ['제 생일은 유월 육 일이에요.', '我的生日是六月六日。'], ['이천이십육 년에 대학교를 졸업했어요.', '2026 年大學畢業。'], ['크리스마스는 십이월 이십오 일이에요.', '聖誕節是十二月二十五日。']])}`],
    ['一天的時段', '오전・오후', `${table({ head: ['時段', '韓文'], rows: [['上午', '오전'], ['下午', '오후'], ['凌晨', '새벽'], ['早上', '아침'], ['中午', '점심'], ['傍晚、晚上', '저녁'], ['夜晚', '밤']] })}
      <ul class="rules"><li>時段放在時間前面：오후 세 시（下午三點）、아침 일곱 시（早上七點）</li><li>大約：세 시쯤（三點左右）；整點：정각（세 시 정각）</li><li>差幾分：세 시 오 분 전（差五分三點）</li></ul>
      ${sentsN([['오후 두 시에 회의가 있어요.', '下午兩點有會議。'], ['새벽 다섯 시에 일어났어요.', '凌晨五點起床了。'], ['일곱 시쯤 만날까요?', '七點左右見面好嗎？'], ['지금 열 시 오 분 전이에요.', '現在差五分十點。']])}`],
    ['時間長度', '얼마나 걸려요?', `${table({ head: ['長度', '韓文', '數字'], rows: [['1 小時', hours(1), '固有語'], ['2 個半小時', hours(2) + ' 반', '固有語'], ['30 分鐘', '삼십 분', '漢字語'], ['3 天', '삼 일', '漢字語'], ['1 週', '일주일', '漢字語'], ['2 個月', '이 개월／두 달', '漢字語／固有語'], ['5 年', '오 년', '漢字語']] })}
      <ul class="rules"><li>「幾小時」시간 用固有語：두 시간、열두 시간</li><li>「幾點」시 也用固有語，但「幾分」분 用漢字語</li><li>問多久：얼마나 걸려요?、몇 시간 걸려요?</li></ul>
      ${sentsN([['집에서 회사까지 한 시간 걸려요.', '從家到公司要一個小時。'], ['비행기로 두 시간 반 걸렸어요.', '搭飛機花了兩個半小時。'], ['삼 일 동안 여행했어요.', '旅行了三天。'], ['한국어를 육 개월 배웠어요.', '學了六個月韓文。']])}`]
  ];
  const VOC = [['星期', ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일', '요일', '평일', '주말']], ['哪一天', ['그저께', '어제', '오늘', '내일', '모레', '매일', '하루', '날짜', '생일']], ['週・月・年', ['지난주', '이번 주', '다음 주', '지난달', '이번 달', '다음 달', '작년', '올해', '내년']], ['一天的時段', ['새벽', '아침', '오전', '점심', '오후', '저녁', '밤']]];
  const zh = { 월요일: '星期一', 화요일: '星期二', 수요일: '星期三', 목요일: '星期四', 금요일: '星期五', 토요일: '星期六', 일요일: '星期日', 요일: '星期（幾）', 평일: '平日', 주말: '週末', 그저께: '前天', 어제: '昨天', 오늘: '今天', 내일: '明天', 모레: '後天', 매일: '每天', 하루: '一天', 날짜: '日期', 생일: '生日', 지난주: '上週', '이번 주': '這週', '다음 주': '下週', 지난달: '上個月', '이번 달': '這個月', '다음 달': '下個月', 작년: '去年', 올해: '今年', 내년: '明年', 새벽: '凌晨', 아침: '早上', 오전: '上午', 점심: '中午', 오후: '下午', 저녁: '傍晚、晚上', 밤: '夜晚' };
  const voc = `<section class="block"><h3>詞彙<small>點單字聽發音，Naver 可聽真人發音；這些字也收在「名詞」的「時間」分類，可以在名詞測驗練習</small></h3>${VOC.map(([t, ws]) => `<h4 class="voc-h">${t}</h4><div class="voc-grid">${ws.map(w => `<div class="voc"><button type="button" class="fm" data-say="${esc(w)}"><span class="hg" lang="ko">${esc(w)}</span><span class="pr">[${diffHTML(w, pronSentence(w))}]</span></button><span class="voc-zh">${zh[w]}</span>${nvBtn(w.replace(' ', ''))}</div>`).join('')}</div>`).join('')}</section>`;
  el.innerHTML = `<p class="intro" style="margin-bottom:16px">星期、日期、時段和時間長度的說法。按喇叭可以聽整句，[ ] 是標準發音。</p>${voc}<div style="height:16px"></div>${cards(C)}`;
}

// ---------- 金錢 ----------
function moneyPage(el) {
  const P = [100, 500, 1000, 1500, 5000, 10000, 12000, 35000, 50000, 100000, 1250000];
  const C = [
    ['價錢的念法', '원', `<ul class="rules"><li>價錢一律用漢字語數字＋원（元）</li><li>1 開頭的 백、천、만 前面不加 일：천 원、만 원（不說 일천 원、일만 원）</li><li>以「萬」為單位分段：12,000 ＝ 만 이천 원、350,000 ＝ 삼십오만 원</li><li>發音：만 원 [마눤]、천 원 [처눤]、십만 원 [심마눤]</li></ul>
      ${table({ head: ['金額', '念法'], rows: P.map(n => [fmt(n) + ' 원', won(n)]) })}`],
    ['問價錢、結帳', '얼마예요?', `<ul class="rules"><li>多少錢：이거 얼마예요?、모두 얼마예요?（全部多少？）</li><li>…一個（單價）：한 개에 천 원이에요</li><li>…的東西：만 원짜리（一萬元的）</li><li>找錢：거스름돈；收據：영수증；刷卡：카드로 계산할게요</li></ul>
      ${sentsN([['이 사과 얼마예요? — 한 개에 천오백 원이에요.', '這個蘋果多少錢？— 一個一千五百元。'], ['모두 만 이천 원입니다.', '總共一萬兩千元。'], ['카드로 계산할게요.', '我刷卡。'], ['여기 거스름돈 삼천 원이요.', '找您三千元。'], ['오만 원짜리 지폐밖에 없어요.', '我只有五萬元的鈔票。']])}`],
    ['折扣與錢的單位', '할인', `${table({ head: ['中文', '韓文'], rows: [['打折', '할인'], ['10% 折扣', '십 퍼센트 할인（口語：십 프로）'], ['半價', '반값'], ['鈔票', '지폐'], ['硬幣', '동전'], ['現金', '현금'], ['韓元／台幣／美元', '원／대만 달러／달러']] })}
      <p class="note">韓國的折扣說法和台灣相反：「30% 할인」是<b>便宜 30%</b>（台灣說的七折）。</p>
      ${sentsN([['지금 삼십 퍼센트 할인해요.', '現在打七折（便宜 30%）。'], ['이 신발은 반값이에요.', '這雙鞋半價。'], ['현금으로 내면 더 싸요.', '付現金更便宜。'], ['천 원짜리 동전은 없어요.', '沒有一千元的硬幣。']])}`]
  ];
  el.innerHTML = `<p class="intro" style="margin-bottom:16px">韓國的貨幣是원（韓元）。價錢全部用漢字語數字，以「萬」為單位分段。可以到「數字轉換」輸入金額聽念法。</p>${cards(C)}`;
}

// ---------- 數字轉換 ----------
function convertPage(el) {
  el.innerHTML = `<div class="qwrap">
    <p class="intro">輸入數字、金額、日期或時間，看韓文怎麼念，並按喇叭聽發音。</p>
    <section class="block"><h3>數字</h3>
      <label class="conv-in" for="cv-n"><span class="muted">輸入 0～99,999,999</span><input type="text" id="cv-n" inputmode="numeric" value="2026" autocomplete="off"></label>
      <div class="conv-out" id="cv-out" aria-live="polite"></div>
      <div class="chip-row" id="cv-ex">${[3, 16, 25, 70, 365, 1500, 12000, 2026, 100000].map(n => `<button type="button" class="chip" data-n="${n}">${fmt(n)}</button>`).join('')}</div>
    </section>
    <section class="block"><h3>金額</h3>
      <label class="conv-in" for="cv-m"><span class="muted">輸入金額（원）</span><input type="text" id="cv-m" inputmode="numeric" value="12500" autocomplete="off"></label>
      <div class="conv-out" id="cv-mout" aria-live="polite"></div>
    </section>
    <section class="block"><h3>日期</h3>
      <label class="conv-in" for="cv-d"><span class="muted">選擇日期</span><input type="date" id="cv-d"></label>
      <div class="conv-out" id="cv-dout" aria-live="polite"></div>
    </section>
    <section class="block"><h3>時間</h3>
      <label class="conv-in" for="cv-t"><span class="muted">選擇時間（12 小時制念法）</span><input type="time" id="cv-t" value="15:30"></label>
      <div class="conv-out" id="cv-tout" aria-live="polite"></div>
    </section>
  </div>`;
  const inp = $('#cv-n', el), out = $('#cv-out', el), tin = $('#cv-t', el), tout = $('#cv-tout', el);
  const row = (label, k, pr, extra = '') => `<div class="conv-row"><span class="conv-l">${label}</span><span class="hg conv-k" lang="ko">${esc(k)}</span>${pr}${sayBtn(k)}${extra}</div>`;
  function drawN() {
    const raw = inp.value.replace(/[,\s]/g, '');
    if (!/^\d+$/.test(raw) || +raw > 99999999) { out.innerHTML = '<p class="muted">請輸入 0 到 99,999,999 之間的整數。</p>'; return; }
    const n = +raw, s = sino(n);
    let h = row('漢字語', s, prNum(s));
    if (n >= 1 && n <= 99) {
      const a = native(n), m = native(n, true);
      h += row('固有語', a, '') + (m !== a ? row('接量詞', m + ' 개', '', `<span class="muted">例：${esc(m)} 개、${esc(m)} 명</span>`) : '');
    } else if (n > 99) h += '<p class="note">100 以上只用漢字語數字。</p>';
    if (n > 0) h += row('價錢', s + ' 원', prNum(s + ' 원'));
    out.innerHTML = h;
  }
  function drawT() {
    const [H, M] = (tin.value || '00:00').split(':').map(Number);
    const h12 = H % 12 || 12, k = timeRead(h12, M);
    tout.innerHTML = row(`${H < 12 ? '上午' : '下午'} ${h12}:${String(M).padStart(2, '0')}`, k, `<span class="pr">[${diffHTML(k, pronSentence(k))}]</span>`) + (M === 30 ? row('也可以說', `${native(h12, true)} 시 반`, '') : '') + `<p class="note">上午、下午分別是 오전、오후，例如 ${H < 12 ? '오전' : '오후'} ${esc(k)}。</p>`;
  }
  const min = $('#cv-m', el), mout = $('#cv-mout', el), din = $('#cv-d', el), dout = $('#cv-dout', el);
  function drawM() {
    const raw = min.value.replace(/[,\s원]/g, '');
    if (!/^\d+$/.test(raw) || +raw < 1 || +raw > 99999999) { mout.innerHTML = '<p class="muted">請輸入 1 到 99,999,999 之間的金額。</p>'; return; }
    const k = won(+raw); mout.innerHTML = row(fmt(+raw) + ' 원', k, prNum(k));
  }
  function drawD() {
    const [Y, M, D] = (din.value || '').split('-').map(Number); if (!Y) return;
    const w = new Date(Y, M - 1, D).getDay(), k = dateRead(Y, M, D) + ' ' + WD[w];
    dout.innerHTML = row(`${Y}/${M}/${D}（${WDZ[w]}）`, k, prNum(k)) + (M === 6 || M === 10 ? `<p class="note">${M} 月念 ${esc(month(M))}（特殊念法）。</p>` : '');
  }
  { const t = new Date(); din.value = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }
  min.oninput = drawM; din.oninput = drawD; drawM(); drawD();
  inp.oninput = drawN; tin.oninput = drawT;
  $('#cv-ex', el).onclick = e => { const b = e.target.closest('[data-n]'); if (b) { inp.value = b.dataset.n; drawN(); } };
  drawN(); drawT();
}

// ---------- 測驗 ----------
const COUNTERS = [
  { nat: true, k: '개', zh: '個', noun: '사과', nzh: '蘋果', max: 12 },
  { nat: true, k: '명', zh: '名', noun: '학생', nzh: '學生', max: 20 },
  { nat: true, k: '잔', zh: '杯', noun: '커피', nzh: '咖啡', max: 5 },
  { nat: true, k: '권', zh: '本', noun: '책', nzh: '書', max: 10 },
  { nat: true, k: '살', zh: '歲', noun: '', nzh: '年齡', max: 40 },
  { nat: false, k: '원', zh: '元', noun: '', nzh: '價錢', vals: [500, 1000, 3000, 4500, 12000, 25000] },
  { nat: false, k: '층', zh: '樓', noun: '', nzh: '樓層', max: 15 },
  { nat: false, k: '분', zh: '分鐘', noun: '', nzh: '時間長度', vals: [10, 15, 20, 30, 45, 50] }
];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const opt = x => ({ v: x, h: `<span class="hg" lang="ko">${esc(x)}</span>` });
function fill(list, right, gen) { const o = uniq(list.filter(x => x && x !== right)); let g = 0; while (o.length < 3 && g++ < 30) { const x = gen(); if (x && x !== right && !o.includes(x)) o.push(x); } return shuffle([right, ...o.slice(0, 3)]); }

export function buildQuiz() {
  const sinoQ = () => { const n = pick([rnd(11, 99), rnd(11, 99), rnd(101, 999), rnd(1001, 9999)]), r = sino(n); const sw = +String(n).split('').reverse().join(''); return { type: '漢字語數字', prompt: `<div class="qw">${fmt(n)}</div><p>用<b>漢字語數字</b>怎麼念？</p>`, options: fill([sino(sw), sino(n + 10), native(n), sino(n + 1)], r, () => sino(rnd(10, 9999))).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b> ${prNum(r)}</span>`, after: r }; };
  const nativeQ = () => { const n = rnd(1, 99), r = native(n); return { type: '固有語數字', prompt: `<div class="qw">${n}</div><p>用<b>固有語數字</b>怎麼念？</p>`, options: fill([sino(n), native(n === 99 ? 98 : n + 1), native(n, true) !== r ? native(n, true) : '', native(+String(n).padStart(2, '0').split('').reverse().join('') || 1)], r, () => native(rnd(1, 99))).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b>　數東西、人、年紀時用固有語</span>`, after: r }; };
  const counterQ = () => {
    const c = pick(COUNTERS), n = c.vals ? pick(c.vals) : rnd(1, c.max);
    const say = x => `${c.noun ? c.noun + ' ' : ''}${x} ${c.k}`;
    const r = say(c.nat ? native(n, true) : sino(n));
    const wrong = c.nat ? [say(sino(n)), native(n) !== native(n, true) ? say(native(n)) : '', say(native(n + 1, true))] : [n <= 99 ? say(native(n, true)) : '', say(sino(n * 10)), say(sino(n + 1))];
    return { type: '數字＋量詞', prompt: `<div class="qw">${c.noun ? c.nzh + ' ' : ''}${fmt(n)} ${c.zh}</div><p>${c.noun ? '' : c.nzh + '　'}韓文怎麼說？</p>`, options: fill(wrong, r, () => say(c.nat ? native(rnd(1, 20), true) : sino(rnd(1, 50)))).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b>　量詞 ${c.k} 前面用${c.nat ? '固有語數字（1～4、20 要變形）' : '漢字語數字'}</span>`, after: r };
  };
  const timeQ = () => { const h = rnd(1, 12), m = pick([0, 10, 15, 20, 30, 40, 45, 50]), r = timeRead(h, m); return { type: '時間', prompt: `<div class="qw">${h}:${String(m).padStart(2, '0')}</div><p>韓文怎麼說？</p>`, options: fill([`${sino(h)} 시${m ? ` ${sino(m)} 분` : ''}`, m ? `${native(h, true)} 시 ${native(m)} 분` : `${native(h)} 시`, timeRead(h % 12 + 1, m)], r, () => timeRead(rnd(1, 12), pick([0, 10, 20, 30]))).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b>　點用固有語、分用漢字語</span>`, after: r }; };
  const listenQ = () => { const n = rnd(11, 99), s = sino(n), sw = +String(n).split('').reverse().join(''); const o = uniq([n, sw, n + 10 > 99 ? n - 10 : n + 10, n + 1 > 99 ? n - 1 : n + 1].filter(x => x !== n && x > 0)); return { type: '聽音選數字', prompt: `<p>聽發音，選出正確的數字</p><button type="button" class="btn big" data-say="${esc(s)}">${SPK}再播一次</button>`, options: shuffle([n, ...o.slice(0, 3)]).map(x => ({ v: x, h: String(x) })), ans: n, exp: `${sayBtn(s)}<span><b lang="ko">${esc(s)}</b> ${prNum(s)} ＝ ${n}</span>`, auto: s }; };
  const monthQ = () => { const m = pick([6, 10, 6, 10, rnd(1, 12)]), r = month(m); return { type: '月份', prompt: `<div class="qw">${m} 月</div><p>韓文怎麼說？</p>`, options: fill([sino(m) + '월', native(m, true) + ' 월', month(m === 12 ? 11 : m + 1)], r, () => month(rnd(1, 12))).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b>${m === 6 || m === 10 ? '　6 月 유월、10 月 시월 是特殊念法' : '　月份用漢字語數字'}</span>`, after: r }; };
  const weekQ = () => { const i = rnd(0, 6), r = WD[i]; return { type: '星期', prompt: `<div class="qw">${WDZ[i]}</div><p>韓文怎麼說？</p>`, options: fill([WD[(i + 1) % 7], WD[(i + 6) % 7], WD[(i + 3) % 7]], r, () => pick(WD)).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b>　月火水木金土日：월・화・수・목・금・토・일</span>`, after: r }; };
  const dateQ = () => { const m = pick([rnd(1, 12), 6, 10]), d = rnd(1, 31 - (m === 2 ? 3 : 0)), r = dateRead(0, m, d); return { type: '日期', prompt: `<div class="qw">${m} 月 ${d} 日</div><p>韓文怎麼說？</p>`, options: fill([`${sino(m)}월 ${sino(d)} 일`, `${month(m)} ${native(d > 99 ? 1 : d)} 일`, dateRead(0, m, d === 31 ? 30 : d + 1)], r, () => dateRead(0, rnd(1, 12), rnd(1, 28))).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b>　月、日都用漢字語數字${m === 6 || m === 10 ? '；6 月 유월、10 月 시월' : ''}</span>`, after: r }; };
  const durQ = () => { const h = rnd(1, 12), half = Math.random() < 0.4, r = hours(h) + (half ? ' 반' : ''); return { type: '時間長度', prompt: `<div class="qw">${h}${half ? ' 個半' : ''} 小時</div><p>「要花…小時」的韓文是？</p>`, options: fill([`${sino(h)} 시간${half ? ' 반' : ''}`, `${native(h, true)} 시${half ? ' 반' : ''}`, hours(h % 12 + 1) + (half ? ' 반' : '')], r, () => hours(rnd(1, 12))).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b>　시간（小時）前面用固有語數字</span>`, after: r }; };
  const moneyQ = () => { const n = pick([1000, 1500, 3000, 5000, 7500, 10000, 12000, 15000, 25000, 30000, 50000, 120000, 350000]), r = won(n); return { type: '金錢', prompt: `<div class="qw">${fmt(n)} 원</div><p>韓文怎麼念？</p>`, options: fill([/^[백천만]/.test(sino(n)) ? `일${sino(n)} 원` : won(n / 10), won(n * 10), n % 10000 ? won(n + 1000) : won(n + 10000)], r, () => won(pick([2000, 4000, 8000, 20000, 60000]))).map(opt), ans: r, exp: `${sayBtn(r)}<span><b lang="ko">${esc(r)}</b> ${prNum(r)}　價錢用漢字語數字，천、만 前面不加 일</span>`, after: r }; };
  return shuffle([sinoQ, nativeQ, counterQ, counterQ, timeQ, listenQ, monthQ, weekQ, dateQ, durQ, moneyQ, moneyQ].map(f => f())).slice(0, 10);
}
function quizPage(el) {
  el.innerHTML = `<div class="qwrap"><p class="intro">每回 10 題：漢字語與固有語數字、量詞、星期、日期、時間與時間長度、金錢、聽音選數字。</p><div class="qctl"><button type="button" class="btn qs-start">開始新的一回</button></div><div class="qcard qbox"></div></div>`;
  const box = $('.qbox', el);
  const start = () => runQuiz(box, buildQuiz(), 'best_numq', start);
  $('.qs-start', el).onclick = start;
  start();
}

export default {
  id: 'numbers',
  title: '數字',
  ko: '숫자',
  icon: 'hash',
  glyph: '일',
  desc: '數字、量詞、星期、日期、時間與金錢',
  pages: [
    { id: 'table', title: '數字表', render: tablePage },
    { id: 'usage', title: '用法與量詞', render: usagePage },
    { id: 'dates', title: '日期・時間', render: datesPage },
    { id: 'money', title: '金錢', render: moneyPage },
    { id: 'convert', title: '數字轉換', render: convertPage },
    { id: 'quiz', title: '測驗', render: quizPage }
  ]
};
