# 用 Azure Static Web Apps 架設私人網站（Microsoft 帳號登入）

設定完成後：
- 打開網站會先要求用 Microsoft 帳號登入。
- 只有你邀請過的帳號能看到內容，其他人登入後只會看到「這個帳號還沒有使用權限」。
- 推送到 GitHub 的 `main` 分支後，網站會自動更新。

整個流程大約 20～30 分鐘，使用免費方案（Free）。

---

## 1. 把 GitHub repo 改成私人，並停用 GitHub Pages

1. 打開 https://github.com/leoniepan/KoreanLearning/settings/pages ，在「Source」選 **None**（或按 **Unpublish site**），停用舊的公開網址。
2. 打開 https://github.com/leoniepan/KoreanLearning/settings ，捲到最下方 **Danger Zone** → **Change repository visibility** → 選 **Make private**，依畫面確認。

## 2. 申請 Azure 帳號

1. 到 https://azure.microsoft.com/free ，用你的 Microsoft 帳號登入並註冊。
2. 註冊時通常需要信用卡驗證身分。只要使用 Static Web Apps 的 **Free** 方案，就不會收費。

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
| API 位置 Api location | 留空 |
| 輸出位置 Output location | 留空 |

3. 按 **檢閱 + 建立** → **建立**。
4. Azure 會自動在 repo 裡新增一個部署設定檔（`.github/workflows/azure-static-web-apps-….yml`），並開始第一次部署。進度可以在 GitHub repo 的 **Actions** 分頁看到，大約 1～3 分鐘。
5. 部署完成後，回到 Azure 上這個 Static Web App 的「概觀」頁，會看到網址，格式像 `https://xxxx-xxxx.azurestaticapps.net`。

> 這時候打開網址，登入後會看到「這個帳號還沒有使用權限」。這是正常的，因為連你自己都還沒被邀請，請接著做第 4 步。

## 4. 邀請自己（以及其他人）

1. 在 Azure 上打開這個 Static Web App → 左側選單 **設定 Settings** → **角色管理 Role management** → **邀請 Invite**。
2. 填寫：

| 欄位 | 填寫內容 |
|---|---|
| 驗證提供者 Authorization provider | **Microsoft Entra ID**（可能顯示為 Azure Active Directory） |
| 被邀請者詳細資料 Invitee details | 對方登入用的 Microsoft 帳號 email |
| 網域 Domain | 選你的網站網址 |
| 角色 Role | `learner`（一定要完全相同，小寫） |
| 邀請到期時間 Invitation expiration | 例如 `24`（小時，最多 168） |

3. 按 **產生 Generate**，複製邀請連結。
4. 用那個 email 的帳號打開連結並登入，就能看到網站了。邀請別人時，把連結傳給對方即可。

免費方案最多可以透過邀請指派 25 個人。

**移除某人的權限**：同一個「角色管理」頁面，找到那個人 → **編輯** → 把角色清空並儲存。

## 5. 之後的更新

- 內容修改照常推送到 GitHub 的 `main` 分支，網站會自動重新部署。
- 網站右上角會顯示登入的帳號，旁邊有「登出」。

## 常見問題

- **登入後一直看到「還沒有使用權限」**：確認邀請時填的 email 和登入的帳號相同、角色是 `learner`，而且已經點過邀請連結。
- **學習進度會跟著帳號走嗎？** 目前不會。進度、測驗紀錄、自訂單字仍然存在各自的瀏覽器裡，換裝置不會同步。若之後想同步，可以再加上 Azure Functions 與資料庫。
- **權限設定在哪裡？** 在 repo 根目錄的 `staticwebapp.config.json`。目前設定是：整個網站需要 `learner` 角色、未登入自動導向 Microsoft 登入、關閉 GitHub 登入。
