// 單元：文法（世宗韓國語 1A～2B）
// 每冊一個學習頁，另有測驗頁。每課的文法依課名推估，請對照課本修正 1a.js～2b.js。
import { lessonPage } from '../../js/core/lesson.js';
import { lessonQuizPage } from '../../js/core/lessonQuiz.js';
import { G1A } from './1a.js';
import { G1B } from './1b.js';
import { G2A } from './2a.js';
import { G2B } from './2b.js';

// 目前上到的進度：今日測驗只會從這裡以前的文法出題。上到新的課時修改這裡。
export const PROGRESS = { book: '1B', unit: 2 };

const BOOKS = [['1A', G1A], ['1B', G1B], ['2A', G2A], ['2B', G2B]];
const ORDER = { '1A': 1, '1B': 2, '2A': 3, '2B': 4 };
export const ALL = BOOKS.flatMap(([, g]) => g);
export const learned = l => ORDER[l.book] < ORDER[PROGRESS.book] || (l.book === PROGRESS.book && l.unit <= PROGRESS.unit);

const intro = book => `世宗韓國語 ${book} 各課的主要文法，依課名推估整理${book === '2B' ? '（2B 只查到英文版課名，所以課名以中文表示）' : ''}，例句與題目為原創。如果和課本不同，請告訴我修正。${book === PROGRESS.book ? `目前進度：${PROGRESS.book} 第 ${PROGRESS.unit} 課。` : ''}`;

export default {
  id: 'grammar',
  title: '文法',
  ko: '문법',
  pages: [
    ...BOOKS.map(([book, g]) => ({
      id: book.toLowerCase(), title: book,
      render: lessonPage({ lessons: g, doneKey: 'done_grammar_' + book, curKey: 'lesson_grammar_' + book, quizRoute: 'grammar-quiz', intro: intro(book) })
    })),
    {
      id: 'quiz', title: '測驗',
      render: lessonQuizPage({
        lessons: ALL, key: 'best_grammar',
        intro: '從文法題目中隨機出題，可以選「已學範圍」、某一冊或某一課。答完會列出錯題和說明。',
        scopes: [
          { id: 'learned', label: `已學範圍（到 ${PROGRESS.book} 第 ${PROGRESS.unit} 課）`, match: learned },
          ...BOOKS.map(([book]) => ({ id: book, label: `${book} 全冊`, match: l => l.book === book }))
        ],
        defaultScope: 'learned'
      })
    }
  ]
};
