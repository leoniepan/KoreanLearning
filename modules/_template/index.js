// ===== 新單元範本 =====
// 1. 把整個 _template 資料夾複製一份，改成新單元的名字，例如 modules/grammar
// 2. 修改下面的 id、title、ko，以及 lessons.js 裡的課程內容
// 3. 打開 modules/registry.js，加上一行 import 並放進清單
// 這個資料夾本身沒有被註冊，所以不會出現在網站上
import { lessonPage } from '../../js/core/lesson.js';
import { lessonQuizPage } from '../../js/core/lessonQuiz.js';
import { LESSONS } from './lessons.js';

const ID = 'template';   // 網址與進度紀錄用的代號：只用英文小寫，不能和其他單元重複

export default {
  id: ID,
  title: '新單元',        // 上方選單顯示的中文名稱
  ko: '새 단원',          // 選單下方的韓文小字
  pages: [
    { id: 'learn', title: '學習', render: lessonPage({ lessons: LESSONS, doneKey: 'done_' + ID, curKey: 'lesson_' + ID, quizRoute: ID + '-quiz' }) },
    { id: 'quiz', title: '測驗', render: lessonQuizPage({ lessons: LESSONS, key: 'best_' + ID }) }
  ]
};
