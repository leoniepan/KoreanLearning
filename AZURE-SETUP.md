# 用 Azure 架設私人網站（Microsoft 帳號登入＋學習紀錄）

設定完成後：
- 打開網站會先要求用 Microsoft 帳號登入。
- 任何人登入後都能瀏覽課程和練習，但要等你在網站裡**核准**，他的作答、進度、錯題才會存到雲端資料庫（換裝置登入也看得到）。核准前做的練習會先存在他的裝置，核准後自動補上傳。
- 你可以隨時在「我的紀錄 → 帳號開通」核准、停用或重新啟用任何人，不需要回 Azure 操作，也沒有人數上限。
- 只有管理者（你）可以在「我的紀錄 → 管理」看到所有人的紀錄並匯出。
- 推送到 GitHub 的 `main` 分支後，網站會自動更新。

整個流程大約 30～40 分鐘，使用 Static Web Apps 的免費方案和 Cosmos DB 免費層。

---

## 1. 確認 GitHub repo 是私人的

Azure 版放在 `leoniepan/KoreanLearning_Azure`。

1. 打開 https://github.com/leoniepan/KoreanLearning_Azure/settings ，確認 repo 是 **Private**。如果不是，捲到最下方 **Danger Zone** → **Change repository visibility** → 選 **Make private**。
2. 舊的 `leoniepan/KoreanLearning` 如果還開著 GitHub Pages，那個公開網址仍然看得到網站內容。不想公開的話，到 https://github.com/leoniepan/KoreanLearning/settings/pages 的「Source」選 **None**（或按 **Unpublish site**）。

## 2. 申請 Azure 帳號

1. 到 https://azure.microsoft.com/free ，用你的 Microsoft 帳號登入並註冊。
2. 註冊時通常需要信用卡驗證身分。只要使用 Static Web Apps 的 **Free** 方案、Cosmos DB 的**免費層**，就不會收費。
3. 建議設定預算警示：上方搜尋「成本管理 Cost Management」→ **預算 Budgets** → **新增**，金額填例如 NT$30，達到 50% 時寄信給你。萬一設定錯誤產生費用，會第一時間知道。

## 3. 建立 Static Web App

1. 登入 https://portal.azure.com ，上方搜尋「Static Web Apps」→ **建立（Create）**。
2. 依序填寫：

| 欄位 | 填寫內容 |
|---|---|
| 訂用帳戶 Subscription | 你剛申請的訂用帳戶 |
| 資源群組 Resource group | 按「新建」，例如 `korean-learning-rg` |
| 名稱 Name | 例如 `korean-learning` |
| 方案類型 Plan type | **Free** |
| 區域 Region | East Asia（或離你最近的區域） |
| 來源 Source | **GitHub**，按「使用 GitHub 登入」並授權 |
| 組織 Organization | `leoniepan` |
| 存放庫 Repository | `KoreanLearning_Azure` |
| 分支 Branch | `main` |
| 組建預設 Build Presets | **Custom** |
| 應用程式位置 App location | `/` |
| API 位置 Api location | `api` |
| 輸出位置 Output location | 留空 |

3. 按 **檢閱 + 建立** → **建立**。
4. Azure 會自動在 repo 裡新增一個部署設定檔（`.github/workflows/azure-static-web-apps-….yml`），並開始第一次部署。進度可以在 GitHub repo 的 **Actions** 分頁看到，大約 1～3 分鐘。
5. 部署完成後，回到 Azure 上這個 Static Web App 的「概觀」頁，會看到網址，格式像 `https://xxxx-xxxx.azurestaticapps.net`。

> 這時候打開網址並登入，左側欄會顯示「雲端紀錄暫時無法使用」。這是正常的，因為還沒有資料庫，請接著做第 4、5 步。

## 4. 建立 Cosmos DB（免費層）並連到網站

1. 在 Azure 入口網站上方搜尋「Azure Cosmos DB」→ **建立** → 選 **Azure Cosmos DB for NoSQL**。
2. 填寫：

| 欄位 | 填寫內容 |
|---|---|
| 資源群組 Resource group | 和網站相同，例如 `korean-learning-rg` |
| 帳戶名稱 Account name | 例如 `korean-learning-db`（全球唯一，小寫） |
| 位置 Location | East Asia（或和網站相同的區域） |
| 容量模式 Capacity mode | **佈建的輸送量 Provisioned throughput**（不要選無伺服器） |
| 套用免費層折扣 Apply Free Tier Discount | **套用 Apply**（每個訂用帳戶只能套用一次，建立後無法再開） |
| 限制帳戶總輸送量 Limit total account throughput | **勾選**（確保不會超過免費的 1000 RU/s） |

3. 按 **檢閱 + 建立** → **建立**，等幾分鐘。
4. 建立完成後打開這個 Cosmos DB → 左側 **資料總管 Data Explorer** → **New Container**：

| 欄位 | 填寫內容 |
|---|---|
| Database id | 選 **Create new**，填 `korean`，勾選 **Share throughput across containers**，輸送量選 **Manual**、`1000` |
| Container id | `records` |
| Partition key | `/userId` |

5. 左側 **設定 Settings** → **金鑰 Keys**，複製 **主要連接字串 PRIMARY CONNECTION STRING**。
6. 回到 Static Web App → 左側 **設定 Settings** → **環境變數 Environment variables** → 選 Production → **+ 新增**：
   - 名稱：`COSMOS_CONNECTION`
   - 值：剛才複製的連接字串
   - 按 **套用 Apply**，再按一次 **套用** 儲存。

> 連接字串等同資料庫的密碼，只貼在這裡，不要放進 GitHub 或傳給別人。

## 5. 把自己設為管理者（只需要做一次）

管理者是唯一需要在 Azure 設定的人，其他人都在網站裡核准即可。

1. 在 Static Web App → 左側選單 **設定 Settings** → **角色管理 Role management** → **邀請 Invite**。
2. 填寫：

| 欄位 | 填寫內容 |
|---|---|
| 驗證提供者 Authorization provider | **Microsoft Entra ID**（可能顯示為 Azure Active Directory） |
| 被邀請者詳細資料 Invitee details | 你自己登入用的 Microsoft 帳號 email |
| 網域 Domain | 選你的網站網址 |
| 角色 Role | `learner,admin`（小寫、用逗號分隔、不要空格） |
| 邀請到期時間 Invitation expiration | 例如 `24`（小時，最多 168） |

3. 按 **產生 Generate**，複製邀請連結。
4. 用你自己的帳號打開連結並登入。「我的紀錄」出現「管理」和「帳號開通」兩個頁籤，就設定完成了。

## 6. 讓其他人使用

1. 把網站網址傳給對方，請他用 Microsoft 帳號登入。
2. 對方第一次登入後，畫面上方會顯示「帳號等待開通」，他仍然可以先瀏覽、練習。
3. 你到「我的紀錄 → 帳號開通」，在他的帳號旁按 **核准**。
4. 請對方重新整理網頁，之後的紀錄就會存到雲端。

**停用某人**：在「帳號開通」按 **停用**。之後他的新紀錄不會再存到雲端，已存的紀錄會保留；按 **重新啟用** 即可恢復。管理者本身無法在網站裡停用，要到 Azure「角色管理」調整。

> 以前用 Azure 邀請、角色是 `learner` 的人不受影響，會自動視為已開通，在「帳號開通」也可以停用他們。
>
> **課程內容的可見範圍**：在免費方案下，網站只能判斷「有沒有登入」，所以任何 Microsoft 帳號登入後都看得到課程和題目；**學習紀錄**則只有核准過的人能存、只有管理者能看。如果希望「未核准的人連課程都看不到」，需要改用 Static Web Apps 的 Standard 方案（約 US$9／月）並設定自訂角色函式。

**隱私**：網站會記錄每個登入者的 Microsoft 帳號 email（包括還沒被核准的人），以及核准後的作答內容，管理者看得到。請別人使用前，請先讓對方知道。

## 7. 之後的更新

- 內容修改照常推送到 GitHub 的 `main` 分支，網站會自動重新部署。
- 左側欄下方會顯示登入的帳號、同步狀態和「登出」。
- 你自己登入後，「我的紀錄」會多出「管理」和「帳號開通」頁籤。有人等待核准時，「管理」頁最上方會提醒。

## 常見問題

- **對方一直看到「帳號等待開通」**：到「帳號開通」確認已經按了核准，再請對方重新整理網頁。如果列表裡找不到他，表示他還沒登入過，或登入的是另一個帳號。
- **左側欄顯示「雲端紀錄暫時無法使用」**：通常是第 4 步的 `COSMOS_CONNECTION` 沒有設定或貼錯。修正後重新整理網頁即可。
- **看不到「管理」「帳號開通」頁籤**：確認你自己的角色是 `learner,admin`，然後登出再登入一次。
- **網路斷線時做的測驗會不見嗎？** 不會。會先暫存在那台裝置，下次連線時自動補送。
- **同一台電腦換帳號登入，紀錄會混在一起嗎？** 雲端紀錄不會：每筆等待上傳的紀錄都記著是誰做的，只會上傳到那個人的帳號。
- **權限設定在哪裡？** 有兩層：
  - `staticwebapp.config.json`：整個網站需要登入（`authenticated`）、`/api/manage/*` 只有 `admin` 能用、未登入自動導向 Microsoft 登入、關閉 GitHub 登入。
  - API（`api/src/lib/handlers.js` 的 `effectiveStatus`）：讀取資料庫裡的開通狀態，未核准或已停用的帳號不能存取學習紀錄；管理端點會再檢查一次 `admin` 角色。
