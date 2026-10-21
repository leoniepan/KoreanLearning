# 用 Azure 架設私人網站（Microsoft 帳號登入＋學習紀錄）

設定完成後：
- 打開網站會先要求用 Microsoft 帳號登入。
- 只有你邀請過的帳號能看到內容，其他人登入後只會看到「這個帳號還沒有使用權限」。
- 每位使用者的作答、進度、錯題都存在雲端資料庫，換裝置登入也看得到。
- 只有管理者（你）可以在「我的紀錄 → 管理」看到所有人的紀錄並匯出。
- 推送到 GitHub 的 `main` 分支後，網站會自動更新。

整個流程大約 30～40 分鐘，使用 Static Web Apps 的免費方案和 Cosmos DB 免費層。

---

## 1. 把 GitHub repo 改成私人，並停用 GitHub Pages

1. 打開 https://github.com/leoniepan/KoreanLearning/settings/pages ，在「Source」選 **None**（或按 **Unpublish site**），停用舊的公開網址。
2. 打開 https://github.com/leoniepan/KoreanLearning/settings ，捲到最下方 **Danger Zone** → **Change repository visibility** → 選 **Make private**，依畫面確認。

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
| 存放庫 Repository | `KoreanLearning` |
| 分支 Branch | `main` |
| 組建預設 Build Presets | **Custom** |
| 應用程式位置 App location | `/` |
| API 位置 Api location | `api` |
| 輸出位置 Output location | 留空 |

3. 按 **檢閱 + 建立** → **建立**。
4. Azure 會自動在 repo 裡新增一個部署設定檔（`.github/workflows/azure-static-web-apps-….yml`），並開始第一次部署。進度可以在 GitHub repo 的 **Actions** 分頁看到，大約 1～3 分鐘。
5. 部署完成後，回到 Azure 上這個 Static Web App 的「概觀」頁，會看到網址，格式像 `https://xxxx-xxxx.azurestaticapps.net`。

> 這時候打開網址，登入後會看到「這個帳號還沒有使用權限」。這是正常的，因為連你自己都還沒被邀請，請接著做第 4、5 步。

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

## 5. 邀請自己（管理者）與其他人

1. 在 Static Web App → 左側選單 **設定 Settings** → **角色管理 Role management** → **邀請 Invite**。
2. 填寫：

| 欄位 | 填寫內容 |
|---|---|
| 驗證提供者 Authorization provider | **Microsoft Entra ID**（可能顯示為 Azure Active Directory） |
| 被邀請者詳細資料 Invitee details | 對方登入用的 Microsoft 帳號 email |
| 網域 Domain | 選你的網站網址 |
| 角色 Role | 你自己填 `learner,admin`；其他人填 `learner`（小寫、用逗號分隔、不要空格） |
| 邀請到期時間 Invitation expiration | 例如 `24`（小時，最多 168） |

3. 按 **產生 Generate**，複製邀請連結。
4. 用那個 email 的帳號打開連結並登入，就能看到網站了。邀請別人時，把連結傳給對方即可。

免費方案最多可以透過邀請指派 25 個人。

**移除某人的權限**：同一個「角色管理」頁面，找到那個人 → **編輯** → 把角色清空並儲存。

> 注意：把人刪除後再重新邀請，Azure 會給他一個新的使用者代號，之前的紀錄就接不上了。只是要暫停使用的話，清空角色即可，不要刪除。

**隱私**：網站會記錄每個人的 Microsoft 帳號 email 和作答內容，管理者看得到。邀請別人前，請先讓對方知道。

## 6. 之後的更新

- 內容修改照常推送到 GitHub 的 `main` 分支，網站會自動重新部署。
- 左側欄下方會顯示登入的帳號、同步狀態和「登出」。
- 你自己登入後，「我的紀錄」會多一個「管理」頁籤。

## 常見問題

- **登入後一直看到「還沒有使用權限」**：確認邀請時填的 email 和登入的帳號相同、角色是 `learner`，而且已經點過邀請連結。
- **左側欄顯示「雲端紀錄暫時無法使用」**：通常是第 4 步的 `COSMOS_CONNECTION` 沒有設定或貼錯。修正後重新整理網頁即可。
- **看不到「管理」頁籤**：確認你自己的角色是 `learner,admin`，然後登出再登入一次。
- **網路斷線時做的測驗會不見嗎？** 不會。會先暫存在那台裝置，下次連線時自動補送。
- **權限設定在哪裡？** 在 repo 根目錄的 `staticwebapp.config.json`。目前設定是：整個網站需要 `learner` 角色、`/api/manage/*` 只有 `admin` 能用、未登入自動導向 Microsoft 登入、關閉 GitHub 登入。API 本身也會再檢查一次角色。
