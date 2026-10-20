// 單元註冊表：上方選單會依照這個清單的順序顯示。
// 新增單元：在 modules/ 下建立資料夾（可複製 _template），然後在這裡 import 並加進清單。
import daily from './daily/index.js';
import pronunciation from './pronunciation/index.js';
import verbs from './verbs/index.js';
import nouns from './nouns/index.js';
import questions from './questions/index.js';

export default [
  daily,
  pronunciation,
  verbs,
  nouns,
  questions
];
