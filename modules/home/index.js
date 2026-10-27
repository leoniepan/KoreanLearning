// 首頁：打招呼、單元圖示入口、今日測驗、學習單元卡片
import { latestReading } from '../reading/index.js';
import { esc } from '../../js/core/dom.js';
import { LS } from '../../js/core/storage.js';
import { icon } from '../../js/core/icons.js';
import { sync } from '../../js/core/sync.js';
import { BOOKS, UNITS } from '../../js/core/progress.js';
import { lessonTitle } from '../course/index.js';
import { THEMES } from '../course/themes.js';

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
function streak() {
  const log = LS.get('daily_log', {});
  const d = new Date(); if (log[ymd(d)] == null) d.setDate(d.getDate() - 1);
  let n = 0; while (log[ymd(d)] != null) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function render(el, ctx) {
  const name = sync.me?.email ? sync.me.email.split('@')[0] : '同學';
  const st = streak();
  const t = today(), todayScore = LS.get('daily_log', {})[t];
  const rd = latestReading();
  const done = new Set(LS.get('done_course', []));
  // 繼續學習：最後打開的冊別與那一冊目前的課
  const lastBook = (LS.get('page_course', '') || '').toUpperCase();
  const cb = BOOKS.includes(lastBook) ? lastBook : '1A', cu = LS.get('course_cur_' + cb, 1);
  const th = THEMES[`${cb}-${cu}`] || ['', ''];
  const started = BOOKS.includes(lastBook);

  el.innerHTML = `
  <div class="home-top">
    <div class="hello-r">
      <span class="streak" title="連續完成今日測驗的天數">${icon('fire')}<b>${st}</b> 天</span>
      <button type="button" class="round-btn" data-go="records-mistakes" aria-label="錯題本">${icon('bell')}</button>
    </div>
  </div>

  <section class="feature">
    <div class="feature-glyph" aria-hidden="true" lang="ko">${started ? esc(cb) : '가'}</div>
    <div class="feature-t">
      <p class="eyebrow">${started ? '繼續學習' : '從這裡開始'}</p>
      <h3 lang="ko">${started ? `${cb} 第 ${cu} 課　${esc(lessonTitle(cb, cu))}` : '韓文字母'}</h3>
      <p>${started ? `詞彙主題：${esc(th[1])}` : '先認識子音和母音，點字母就能聽發音。'}</p>
    </div>
    <button type="button" class="btn light" data-go="${started ? 'course-' + cb.toLowerCase() : 'course-hangul'}">${started ? '繼續' : '開始'}</button>
  </section>

  <section>
    <div class="sec-h"><h3>課程</h3><span class="muted">已完成 ${done.size} 課</span></div>
    <div class="books">
      <button type="button" class="book" data-go="course-hangul"><span class="tile" lang="ko">가</span><b>韓文字母</b><small>子音・母音・發音</small></button>
      ${BOOKS.map(b => { const n = Array.from({ length: UNITS[b] }, (_, i) => i + 1).filter(u => done.has(`${b}-${u}`)).length; return `<button type="button" class="book" data-go="course-${b.toLowerCase()}"><span class="tile">${b}</span><b>${b}</b><small>${n} / ${UNITS[b]} 課</small><span class="bbar"><i style="width:${n / UNITS[b] * 100}%"></i></span></button>`; }).join('')}
    </div>
  </section>

  <section>
    <div class="sec-h"><h3>練習與基本</h3></div>
    <div class="courses">
      <button type="button" class="course" data-go="practice-daily"><span class="course-top"><span class="tile" lang="ko">오</span><span class="course-t"><b>今日測驗</b><small>${todayScore != null ? `今天答對 ${todayScore} 題` : '今天還沒做'}</small><span class="course-d">每天一組，可以自己設定範圍</span></span></span><span class="course-foot">開始${icon('arrow')}</span></button>
      <button type="button" class="course" data-go="practice-reading"><span class="course-top"><span class="tile" lang="ko">읽</span><span class="course-t"><b>每日短文</b><small>${rd.date ? `${rd.date.slice(5).replace('-', '/')} 更新 ${rd.n} 篇` : '읽기'}</small><span class="course-d">有趣的韓文短文，讀完做閱讀測驗</span></span></span><span class="course-foot">閱讀${icon('arrow')}</span></button>
      <button type="button" class="course" data-mod="practice"><span class="course-top"><span class="tile" lang="ko">연</span><span class="course-t"><b>練習</b><small>연습</small><span class="course-d">文法、字母、發音、單字、數字測驗</span></span></span><span class="course-foot">前往${icon('arrow')}</span></button>
      <button type="button" class="course" data-mod="topik"><span class="course-top"><span class="tile" lang="ko">토</span><span class="course-t"><b>TOPIK</b><small>한국어능력시험</small><span class="course-d">考試介紹、題型練習、模擬考</span></span></span><span class="course-foot">前往${icon('arrow')}</span></button>
      <button type="button" class="course" data-mod="ref"><span class="course-top"><span class="tile" lang="ko">기</span><span class="course-t"><b>基本</b><small>기본</small><span class="course-d">字母表、發音規則、動詞變化、名詞、數字、文法總覽</span></span></span><span class="course-foot">前往${icon('arrow')}</span></button>
      <button type="button" class="course" data-go="records-mistakes"><span class="course-top"><span class="tile" lang="ko">틀</span><span class="course-t"><b>錯題本</b><small>오답 노트</small><span class="course-d">答錯的題目都在這裡，可以重練</span></span></span><span class="course-foot">前往${icon('arrow')}</span></button>
    </div>
  </section>`;

  el.onclick = e => {
    const g = e.target.closest('[data-go]');
    if (g) { ctx.go(g.dataset.go); return; }
    const m = e.target.closest('[data-mod]');
    if (m) ctx.openModule(m.dataset.mod);
  };
}

export default {
  id: 'home',
  title: '首頁',
  ko: '홈',
  icon: 'home',
  glyph: '홈',
  desc: '',
  pages: [{ id: 'main', title: '首頁', render, fresh: true }]
};
