# 발음·동사 연습장 — 韓文發音、動詞與句型練習帳

配合世宗韓國語 1A～1B 的私人自學網站，架設在 Azure Static Web Apps，需以受邀的 Microsoft 帳號登入。設定步驟見 [AZURE-SETUP.md](AZURE-SETUP.md)。

目前的單元：

| 單元 | 內容 |
|---|---|
| 首頁 | 打招呼與連續天數、搜尋單字與文法、各單元圖示入口、今日測驗、學習單元卡片與進度 |
| 今日測驗 | 每天一組 10 題：當天的原創新題，加上從各單元挑選的複習題；記錄連續完成天數 |
| 發音規則 | 收音代表音、連音、ㅎ 脫落／激音化、硬音化、鼻音化、流音化、口蓋音化，共 8 步，附例詞、例句、跟讀練習與測驗 |
| 動詞・形容詞 | 現在式、過去式、未來式、冠形詞形變化表、變化規則、閃卡、測驗；可自行新增單字 |
| 名詞 | 依分類整理的名詞表，附 은/는、이/가、을/를、이에요/예요 形態與發音、助詞規則、閃卡、測驗；可自行新增名詞 |
| 數字 | 漢字語與固有語數字表（附羅馬拼音）、用法與量詞、數字與時間轉換、測驗 |
| 文法 | 世宗韓國語 1A～4B 各課文法（課別依世宗學堂教學投影片整理），分冊學習，附規則、例句與測驗；測驗可選已學範圍 |
| 我的紀錄 | 練習次數、正確率、近 30 天紀錄、各單元正確率、錯題本（可重練）；管理者另有「管理」頁看所有人的紀錄並匯出 CSV |

朗讀使用瀏覽器內建的韓文語音（Web Speech API）；單字旁的「Naver」按鈕會在新分頁開啟 Naver 韓中辭典，可聽真人發音。

**學習紀錄**：在 Azure 上登入時，每一題的作答、學習進度、自訂單字都會存到 Cosmos DB，換裝置登入也看得到。沒有 API 的環境（GitHub Pages、本機預覽）會自動改用離線模式，紀錄只存在那台裝置的瀏覽器。

## 檔案結構

```
api/                    學習紀錄 API（Azure Functions，Node.js 22）
  src/functions/api.js  註冊 HTTP 端點（/api/me、/api/state、/api/attempts、/api/stats、/api/manage/*）
  src/lib/handlers.js   API 邏輯與權限檢查
  src/lib/store.js      Cosmos DB 存取；memory-store.js 是測試與本機模擬用的記憶體版
  src/lib/merge.js      學習狀態的合併規則（和 js/core/merge.js 相同）
  src/lib/stats.js      統計與錯題本（和 js/core/stats.js 相同）
  test/                 API 測試（cd api && npm test）
tools/dev-server.mjs    本機模擬伺服器（含登入、API、資料庫）
index.html              網站外框（標題、單元選單），內容由 JavaScript 產生
css/style.css           所有樣式（含手機、平板的 RWD 設定）
js/
  app.js                入口：讀取單元註冊表、產生選單、依網址 # 切換頁面
  core/                 所有單元共用的工具
    hangul.js           韓文字拆解與標準發音推算（連音、硬音化、鼻音化…）
    conjugate.js        動詞／形容詞變化（現在、過去、未來、冠形詞形）
    speech.js           朗讀、語速、Naver 連結
    icons.js            線條圖示（單元圖示、導覽列）
    render.js           例詞卡、例句、對照表等顯示元件
    lesson.js           通用「一步步學習」頁
    lessonQuiz.js       通用測驗頁（直接讀課程資料裡的題目）
    quiz.js             測驗流程（作答、回饋、分數、錯題回顧）
    sync.js             作答上傳、跨裝置同步、離線暫存
    storage.js / dom.js 小工具
modules/
  registry.js           單元註冊表：選單顯示的單元與順序（每個單元有 icon 圖示、glyph 代表字、desc 簡介）
  home/                 首頁
  pronunciation/        發音規則（lessons.js 課程、quiz-data.js 題庫）
  verbs/                動詞・形容詞（words.js 單字與例句）
  nouns/                名詞（nouns.js 名詞、分類與例句）
  numbers/              數字（念法與發音由程式產生）
  daily/                今日測驗（bank.js 每日新題、TOPICS.md 出題範圍）
  grammar/              文法（1a.js～2b.js 各冊資料；index.js 的 PROGRESS 是目前進度）
  records/              我的紀錄、錯題本、管理頁
  _template/            新單元範本（未註冊，不會出現在網站上）
```

## 新增一個單元（例如進階文法）

1. 複製 `modules/_template` 資料夾，改名為新單元，例如 `modules/grammar`。
2. 打開 `modules/grammar/index.js`，修改 `ID`（英文小寫代號）、`title`（中文名稱）、`ko`（韓文小字）。
3. 在 `modules/grammar/lessons.js` 寫課程內容。每一課可以有說明、對照表、規則、例詞、例句、自訂區塊和測驗題，欄位說明寫在檔案裡。
4. 打開 `modules/registry.js`，加上：
   ```js
   import grammar from './grammar/index.js';
   ```
   並把 `grammar` 加進下方清單。清單順序就是選單順序。

完成後上方選單就會出現新單元，包含「學習」和「測驗」兩頁，進度與最佳紀錄會自動分開儲存。例句的發音標示、朗讀、Naver 按鈕都會自動產生。

## 更新學習進度

上到新的課時，修改 `modules/grammar/index.js` 裡的 `PROGRESS`（例如 `{ book: '1B', unit: 3 }`）。今日測驗與文法測驗的「已學範圍」會跟著更新。

## 每日新題

- 題庫在 `modules/daily/bank.js`，每天一組，日期為台灣時間。
- 出題範圍與方向寫在 `modules/daily/TOPICS.md`，修改這份檔案就能調整之後的新題主題。
- 修改題庫後可執行 `node tools/check-bank.mjs` 檢查格式；修改文法資料後可執行 `node tools/check-grammar.mjs`。

## 在既有單元加內容

- **加一課**：在該單元的 `lessons.js` 陣列裡多加一個 `{ … }`。
- **加測驗題**：在該課的 `quiz` 陣列多加一題。`＿` 代表空格，`a` 必須和 `opts` 其中一個完全相同。
- **加名詞**：在 `modules/nouns/nouns.js` 的 `N` 裡加一筆，例句裡最好包含名詞加助詞的形態（助詞規則頁會自動挑來當例句）。
- **加動詞／形容詞**：在 `modules/verbs/words.js` 的 `W` 裡加一筆。三句例句必須依序包含現在式、過去式、未來式的變化形。

## 在自己電腦上預覽

網站使用 JavaScript 模組，直接雙擊 `index.html` 會無法載入。

**完整模擬（含登入、紀錄同步、管理頁）**：需要安裝 Node.js 22 以上。

```
cd api
npm install
cd ..
node tools/dev-server.mjs
```

打開 http://localhost:4280 ，預設以 `me@example.com`（管理者）登入。要模擬其他使用者，打開 `http://localhost:4280/.dev/login?email=anna@example.com`。模擬的資料存在 `tools/.devdata.json`，刪掉就會清空。

**只看畫面（離線模式）**：VS Code 的「Live Server」，或在這個資料夾執行 `python -m http.server` 再打開 http://localhost:8000 。

## 部署與權限

- 網站架設在 Azure Static Web Apps（免費方案），推送到 `main` 分支後會自動部署網站與 `api/`。
- 學習紀錄存在 Azure Cosmos DB（免費層），連接字串設定在 Static Web App 的環境變數 `COSMOS_CONNECTION`。
- `staticwebapp.config.json`：整個網站需要 `learner` 角色，`/api/manage/*` 只有 `admin` 能用，未登入時導向 Microsoft 登入。
- `403.html`：已登入但尚未被邀請時顯示的頁面。
- 第一次設定與邀請使用者的步驟：[AZURE-SETUP.md](AZURE-SETUP.md)。
