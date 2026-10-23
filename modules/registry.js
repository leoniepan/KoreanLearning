// 單元註冊表：上方選單會依照這個清單的順序顯示。
// 新增單元：在 modules/ 下建立資料夾（可複製 _template），然後在這裡 import 並加進清單。
import home from './home/index.js';
import course from './course/index.js';
import practice from './practice/index.js';
import ref from './ref/index.js';
import records from './records/index.js';

// 其他單元（發音、動詞、名詞、數字、文法、TOPIK、今日測驗、字母）的頁面
// 由「課程」「練習」「速查」組合使用，不直接出現在選單上。
export default [
  home,
  course,
  practice,
  ref,
  records
];
