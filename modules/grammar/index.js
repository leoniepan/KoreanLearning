// 單元：文法（世宗韓國語 1A～4B）
// 每冊一個學習頁，另有測驗頁。各課文法依世宗學堂教學投影片整理（1a.js～4b.js）；說明、例句與題目為原創。
import { lessonPage } from '../../js/core/lesson.js';
import { lessonQuizPage } from '../../js/core/lessonQuiz.js';
import { isLearned } from '../../js/core/progress.js';
import { G1A } from './1a.js';
import { G1B } from './1b.js';
import { G2A } from './2a.js';
import { G2B } from './2b.js';
import { G3A } from './3a.js';
import { G3B } from './3b.js';
import { G4A } from './4a.js';
import { G4B } from './4b.js';

// 目前進度由使用者在「今日測驗」或首頁選擇（js/core/progress.js）。

const BOOKS = [['1A', G1A], ['1B', G1B], ['2A', G2A], ['2B', G2B], ['3A', G3A], ['3B', G3B], ['4A', G4A], ['4B', G4B]];
export const ALL = BOOKS.flatMap(([, g]) => g);
export const learned = l => isLearned(l.book, l.unit);

const intro = book => `世宗韓國語 ${book} 各課的文法，課別依世宗學堂教學投影片整理；說明、例句與題目為原創。每課先看規則和例句，再按「測驗這一課」。`;

export default {
  id: 'grammar',
  title: '文法',
  ko: '문법',
  icon: 'layers',
  glyph: '문',
  desc: '世宗韓國語 1A～4B 各課文法',
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
          { id: 'learned', label: '已學範圍（依我的進度）', match: learned },
          ...BOOKS.map(([book]) => ({ id: book, label: `${book} 全冊`, match: l => l.book === book }))
        ],
        defaultScope: 'learned'
      })
    }
  ]
};
