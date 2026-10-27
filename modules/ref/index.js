// 基本：查資料用的表格與規則（字母、發音規則、動詞變化、名詞、數字、文法總覽）
import { esc } from '../../js/core/dom.js';
import { group } from '../../js/core/group.js';
import pron from '../pronunciation/index.js';
import verbs from '../verbs/index.js';
import nouns from '../nouns/index.js';
import numbers from '../numbers/index.js';
import { chartPage } from '../hangul/index.js';
import { ALL as GRAMMAR } from '../grammar/index.js';
import { BOOKS, UNITS } from '../../js/core/progress.js';
import { lessonTitle } from '../course/index.js';

const pg = (m, id) => m.pages.find(p => p.id === id);

// 文法總覽：所有冊別、課別的文法一覽，點了跳到課程那一課
function grammarIndex(el, ctx) {
  el.innerHTML = `<div class="stack"><p class="intro">世宗韓國語 1A～4B 每一課的文法。點文法名稱會打開「課程」裡的那一課。上方可以輸入關鍵字篩選（韓文或中文）。</p>
    <div class="search gsearch" role="search"><input type="text" class="gi-q" placeholder="例如 -아서、因為、-는데" aria-label="篩選文法" autocomplete="off"></div>
    ${BOOKS.map(b => `<section class="block gi-book"><h3>${b}</h3><div class="ctab-wrap"><table class="ctab gi"><tr><th>課</th><th>課名</th><th>文法</th></tr>${Array.from({ length: UNITS[b] }, (_, i) => i + 1).map(u => `<tr><td class="num-n">${u}</td><td lang="ko">${esc(lessonTitle(b, u))}</td><td>${GRAMMAR.filter(l => l.book === b && l.unit === u && !l.ko.includes('어휘')).map(l => `<button type="button" class="gi-l" data-b="${b}" data-id="${l.id}">${esc(l.name)}</button>`).join('')}</td></tr>`).join('')}</table></div></section>`).join('')}</div>`;
  const q = el.querySelector('.gi-q');
  q.oninput = () => {
    const s = q.value.trim();
    el.querySelectorAll('.gi tr').forEach((tr, i) => { if (!tr.querySelector('td')) return; tr.hidden = !!s && !tr.textContent.includes(s); });
    el.querySelectorAll('.gi-book').forEach(sec => { sec.hidden = !!s && ![...sec.querySelectorAll('tr')].some(tr => tr.querySelector('td') && !tr.hidden); });
  };
  el.onclick = e => { const b = e.target.closest('.gi-l'); if (b) ctx.go('course-' + b.dataset.b.toLowerCase(), { lesson: b.dataset.id }); };
}

export default {
  id: 'ref',
  title: '基本',
  ko: '기본',
  icon: 'layers',
  glyph: '기',
  desc: '查資料用：字母、發音規則、動詞變化、名詞、數字、文法總覽',
  pages: [
    { id: 'hangul', title: '字母', render: (el, ctx) => chartPage(el, { go: ctx.go, quizRoute: 'practice-hangul' }) },
    { id: 'pron', title: '發音規則', render: pg(pron, 'learn').render },
    { id: 'verbs', title: '動詞・形容詞', render: group('rverbs', [
      { id: 'table', title: '變化表', render: pg(verbs, 'table').render },
      { id: 'rules', title: '變化規則', render: pg(verbs, 'rules').render }
    ]) },
    { id: 'nouns', title: '名詞', render: group('rnouns', [
      { id: 'table', title: '名詞表', render: pg(nouns, 'table').render },
      { id: 'rules', title: '助詞規則', render: pg(nouns, 'rules').render }
    ]) },
    { id: 'numbers', title: '數字', render: group('rnum', [
      { id: 'table', title: '數字表', render: pg(numbers, 'table').render },
      { id: 'usage', title: '用法與量詞', render: pg(numbers, 'usage').render },
      { id: 'dates', title: '日期・時間', render: pg(numbers, 'dates').render },
      { id: 'money', title: '金錢', render: pg(numbers, 'money').render },
      { id: 'convert', title: '數字轉換', render: pg(numbers, 'convert').render }
    ]) },
    { id: 'grammar', title: '文法總覽', render: grammarIndex }
  ]
};
