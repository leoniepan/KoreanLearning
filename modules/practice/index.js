// 練習：測驗集中在這裡（今日測驗、文法、字母、發音、單字、數字）；TOPIK 是獨立的單元
import { group } from '../../js/core/group.js';
import daily from '../daily/index.js';
import grammar from '../grammar/index.js';
import pron from '../pronunciation/index.js';
import verbs from '../verbs/index.js';
import nouns from '../nouns/index.js';
import numbers from '../numbers/index.js';
import { quizPage as hangulQuiz } from '../hangul/index.js';
import { readingPage } from '../reading/index.js';

const pg = (m, id) => m.pages.find(p => p.id === id);

export default {
  id: 'practice',
  title: '練習',
  ko: '연습',
  icon: 'quiz',
  glyph: '연',
  desc: '測驗都在這裡：今日測驗、每日短文、文法、字母、發音、單字、數字',
  pages: [
    { id: 'daily', title: '今日測驗', render: pg(daily, 'quiz').render, fresh: true, mod: 'daily' },
    { id: 'reading', title: '每日短文', render: readingPage, mod: 'reading' },
    { id: 'grammar', title: '文法', render: pg(grammar, 'quiz').render, mod: 'grammar' },
    { id: 'hangul', title: '字母', render: hangulQuiz, mod: 'hangul' },
    { id: 'pron', title: '發音', render: pg(pron, 'quiz').render, mod: 'pron' },
    { id: 'words', title: '單字', mod: 'verbs', render: group('words', [
      { id: 'verbs', title: '動詞・形容詞測驗', render: pg(verbs, 'quiz').render, fresh: true, mod: 'verbs' },
      { id: 'nouns', title: '名詞測驗', render: pg(nouns, 'quiz').render, fresh: true, mod: 'nouns' },
      { id: 'vcards', title: '動詞閃卡', render: pg(verbs, 'cards').render, mod: 'verbs' },
      { id: 'ncards', title: '名詞閃卡', render: pg(nouns, 'cards').render, mod: 'nouns' }
    ], { label: '單字練習' }) },
    { id: 'numbers', title: '數字', render: pg(numbers, 'quiz').render, mod: 'numbers' }
  ]
};
