// 單元：問句。這個單元只有資料，學習頁和測驗頁都由共用元件產生
import { lessonPage } from '../../js/core/lesson.js';
import { lessonQuizPage } from '../../js/core/lessonQuiz.js';
import { LESSONS } from './lessons.js';

export default {
  id: 'questions',
  title: '問句',
  ko: '의문문',
  pages: [
    { id: 'learn', title: '學習', render: lessonPage({ lessons: LESSONS, doneKey: 'done_questions', curKey: 'lesson_questions', quizRoute: 'questions-quiz' }) },
    { id: 'quiz', title: '測驗', render: lessonQuizPage({ lessons: LESSONS, key: 'best_questions', intro: '從各課的題目中隨機出題，答完會列出錯題和說明。' }) }
  ]
};
