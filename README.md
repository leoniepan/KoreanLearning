# 발음·동사 연습장 — 韓文發音、動詞與句型練習帳

配合世宗韓國語 1A～4B 的私人自學網站，架設在 Azure Static Web Apps，需以受邀的 Microsoft 帳號登入。設定步驟見 [AZURE-SETUP.md](AZURE-SETUP.md)。

網站分成五個部分（左側選單）：

| 選單 | 內容 |
|---|---|
| 首頁 | 繼續學習、各冊進度、搜尋課程／單字／文法、今日測驗與錯題本入口 |
| 課程 | **主要的學習路線**。「韓文字母」入門（子音、母音對照表，點字母聽發音），以及 1A～4B 每一課：該課的詞彙、文法（規則與例句）和本課測驗 |
| 練習 | 所有測驗：今日測驗（可設定範圍、內容、題數）、文法、字母、發音、單字（動詞、名詞、閃卡）、數字、TOPIK 題型與模擬考 |
| 速查 | 查資料用：字母表、發音規則、動詞變化表與規則、名詞表與助詞規則、數字（數字表、量詞、日期時間、金錢、轉換）、文法總覽、TOPIK 介紹 |
| 我的紀錄 | 練習次數、正確率、近 30 天紀錄、各單元正確率、錯題本（可重練）；管理者另有「管理」頁 |

`modules/` 裡的 pronunciation、verbs、nouns、numbers、grammar、topik、daily、hangul 是內容單元，由 course（課程）、practice（練習）、ref（速查）組合使用；舊網址（例如 `#verbs-table`）會自動轉到新位置。

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
  grammar/              文法（1a.js～4b.js 各冊資料）
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

## 今日測驗的範圍

在「今日測驗」上方的「出題範圍設定」選擇課別範圍（從哪一課到哪一課）、出題內容與題數，設定會自動儲存。

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
