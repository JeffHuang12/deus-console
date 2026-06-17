# 產品需求文件（PRD）— DEUS Console

## 1. 專案概述

### 1.1 專案名稱

**DEUS Console** — 電商數據綁定與分析平台

### 1.2 專案目標

讓電商營運人員在單一介面綁定多個數據與行銷來源（Shopline、Meta、Google Ads、GA4、LINE 等），
再由系統產出分析報表、建立投放受眾、管理社群留言、設定監測告警，並透過 LLM 與 MCP 工具輔助決策。
核心價值是把分散在各平台的數據與操作收斂到一個可擴展的中台，降低跨工具切換與人工彙整成本。

目標使用者：類 FDE / PM 角色，負責以廣告、行銷自動化與頁面優化驅動線上營收。
主要解決的問題：資料來源分散、報表需手工彙整、受眾與留言操作跨平台、缺乏統一的 AI 輔助入口。

### 1.3 專案背景

- **市場需求**：電商團隊同時操作多個廣告與社群平台，數據對帳與受眾同步耗費大量人工，且缺乏跨平台一致視圖。
- **競品限制**：既有 BI 或廣告管理工具多聚焦單一面向（純報表或純投放），少有把「綁定 + 分析 + 受眾 + 留言 + 監測 + AI」整合在同一中台者。
- **商業價值**：縮短報表產出時間、提高受眾投放精準度、加速留言回覆與客訴處理，最終提升 ROAS 與回購率。

### 1.4 目前進度

第一階段（UI 骨架）已完成並上線 demo：所有實際串接（OAuth、各源 API、BigQuery、Claude API、各平台推送）皆為 stub，資料為示範值。
- 線上 demo：https://jeffhuang12.github.io/deus-console/
- 原始碼：https://github.com/JeffHuang12/deus-console

## 2. 功能需求

### 2.1 核心功能

#### 2.1.1 數據綁定（/binding）

- **Shopline API Key 綁定**：使用者輸入 access token，程式讀取後即可執行資料更新（本期不實際驗證）。
- **資料源綁定卡片**：Meta 廣告、Meta 粉專、Instagram、Threads、LINE LAP、Google Ads、Bing Ads、GA4、Search Console、Boxful。
    - OAuth 類：點「綁定」走授權流程（Phase 2 接通），狀態切為已連線。
    - API Key 類（Boxful）：彈窗輸入 key 後綁定。
    - 每張卡片顯示綁定方式標籤與連線狀態。

#### 2.1.2 分析中心（/analysis）

- **報表清單**：卡片列出已建立報表（名稱、資料來源、更新頻率、最後更新），可查看 / 重新執行 / 刪除。
- **新建報表（/analysis/new）**：表單含名稱、資料來源、日期區間、更新頻率、使用模型、自訂 Prompt；提供可點選的預設 Prompt 範本（Google Ads 稽核、Meta 素材疲勞、跨平台 ROAS、搜尋字詞清理），帶入後可再編輯。
- **報表詳情（/analysis/:id）**：八區塊 insight（執行摘要、整體數據總覽、漏斗轉換、波動分析、優異 VS 異常、趨勢觀察、優化建議、總結），並可檢視與編輯當初的 Prompt。
- 混合策略：數據區塊為規則計算（Phase 2 由 BigQuery 取數），摘要與建議由 Claude API 潤飾。

#### 2.1.3 受眾管理（/audience）

- **受眾清單**：名稱、建立方式、人數、建立時間、更新頻率、連接通路；操作含廣告受眾建立 / 推播 / 查看報表 / 刪除。
- **新建受眾（/audience/new，四種方式）**：
    - 自然語言：可點範例，解析成結構化條件並可套用。
    - 結構化條件：多欄位條件建構器（Shopline Customer 四大類欄位 + 訂單購買條件），全域且/或 + 每列包含/排除。
    - 智慧分群：9 種預設分群以表格呈現（人數、總/平均消費次數、總/平均消費金額、平均 CLV、購買週期），點列展開定義。
    - RFM 智慧分群：9 個 RANK（含 R/F/M、定義、Action），附級距與發送規則參考。
- **廣告受眾建立（/audience/:id/ad-build）**：Meta / Google / LINE 三通路；選比對欄位與更新頻率，Meta 需手動命名並顯示清洗規則（全小寫、去空格、電話補國碼），Google 顯示 SHA-256 / E.164 規則；建立後狀態為建立中 / 已完成（人數）/ 失敗。
- **推播（/audience/:id/push）**：單次或定期、推送時間、平台（EDM / SMS / LINE）、內容（選範本或自行撰寫）。
- **查看報表（/audience/:id/report）**：日期區間 + 七項 KPI（發信數量、開信率、點擊率、發送失敗率、退訂率、退信率、銷售額）+ 趨勢與每日明細。

#### 2.1.4 留言管理（/comments）

- **留言列表**：留言、貼文網址（可排序）、貼文平台（可排序）、標籤（正面/負面、產品、客服、物流）、留言數量、互動次數。
- **篩選**：平台、貼文連結、標籤。
- **多選自動回覆**：選取多則留言後產生 AI 回覆草稿（依情緒），草稿可編輯後送出。

#### 2.1.5 監測中心（/monitoring）

- 自訂監測規則（指標、條件、門檻、通知方式），可啟用切換與刪除。Phase 2 由排程讀 BigQuery 比對門檻後告警。

### 2.2 進階功能

#### 2.2.1 MCP 設定（/mcp）

- 管理可用的 MCP server（名稱、啟動指令 / URL、狀態）的新增、編輯、刪除。Phase 2 寫入設定並探測連線。

#### 2.2.2 Prompt 互動（/prompt）

- 聊天介面，與系統對話查詢與分析數據。Phase 2 接 Claude API，並可掛 MCP 工具。

### 2.3 使用者介面

#### 2.3.1 Web 介面

- antd Layout：左側可收合選單（七大頁）+ 頂部標題列；全繁體中文、無 emoji、配色簡潔。
- 共用元件：PageHeader、SectionCard、StatusTag、AnalysisReportView、StructuredConditionBuilder、AnalysisControls。
- 圖表一律 Recharts；日期一律 dayjs。

#### 2.3.2 設定系統

- 後端設定集中於 Projects 根目錄單一 `.env`（各資料源 token）。
- 前端以環境變數 `VITE_DEMO_MODE` 切換 demo / 真後端；`vite.config.ts` 依此設定 base path。

## 3. 技術需求

### 3.1 技術堆疊

- **前端**：React 18 + Vite 6 + TypeScript + Ant Design v5 + Recharts + react-router-dom v6 + axios + dayjs。
- **後端**：FastAPI（Python 3.13）+ uvicorn + pydantic v2，提供 REST API（本期回 mock）。
- **資料倉儲（Phase 2）**：Google BigQuery 為集中查詢層。
- **第三方服務（Phase 2）**：Shopline Open API、Meta / Google Ads / GA4 / Bing / Search Console / LINE、Claude API、MCP servers。
- **部署**：GitHub Pages（demo 靜態站）；本機以 uvicorn + Vite dev server 開發。

### 3.2 依賴套件

```
# 後端 backend/requirements.txt
fastapi==0.115.6           # Web 框架與 API 路由
uvicorn[standard]==0.34.0  # ASGI server
pydantic==2.10.4           # 資料模型與驗證

# 前端 frontend/package.json（主要）
react ^18.3                # UI 框架
vite ^6                    # 建置與 dev server
antd ^5                    # UI 元件庫
recharts ^2               # 圖表
react-router-dom ^6        # 路由
axios ^1                  # HTTP client
dayjs ^1                  # 日期處理
```

### 3.3 架構設計

#### 3.3.1 模組結構

```
deus_console/
├── backend/
│   ├── main.py                 # FastAPI app，掛 CORS、註冊各 router（前綴 /api）
│   ├── schemas.py              # 所有 Pydantic 模型
│   ├── mock_data.py            # 集中 mock 資料與產生器
│   ├── routers/                # bindings / analysis / audience / comments / monitoring / mcp / chat
│   ├── integrations/           # Phase 2 接點：oauth / bigquery_client / llm（皆 stub）
│   └── requirements.txt
└── frontend/
    ├── vite.config.ts          # base 依 VITE_DEMO_MODE；dev proxy /api -> :8000
    └── src/
        ├── main.tsx            # BrowserRouter basename = BASE_URL
        ├── App.tsx             # Layout + 側邊 Menu + Routes
        ├── api/                # types / client(httpApi+mockApi) / mocks / presets / audienceMeta / promptTemplates
        ├── components/         # 共用元件
        └── pages/              # 各功能頁
```

#### 3.3.2 設計模式

- **雙模式 API（Strategy）**：`client.ts` 依 `VITE_DEMO_MODE` 在 `httpApi`（真後端）與 `mockApi`（內建 mock）之間切換，兩者方法簽章一致，靜態站不需後端即可操作。
- **整合接口層（Adapter，Phase 2）**：`backend/integrations/` 以統一介面封裝各源 OAuth、BigQuery 查詢與 Claude API，router 不直接耦合外部服務。
- **集中 mock 資料層**：`mock_data.py` 統一管理示範資料與產生器，方便日後抽換為真實查詢。
- **元件組合**：八區塊渲染器、條件建構器等抽為共用元件供多頁重用。

### 3.4 資料儲存

- **記憶體暫存（本期）**：各 router 以記憶體 dict 暫存（報表、受眾、規則、MCP server、留言種子），重啟即還原。
- **瀏覽器內陣列（demo 模式）**：`mocks.ts` 以模組內陣列維持互動狀態。
- **集中 token（.env）**：所有資料源憑證集中於 Projects 根目錄單一 `.env`。
- **BigQuery（Phase 2）**：分析與監測的真實數據集中於 BigQuery。

## 4. API 端點設計（取代 CLI）

### 4.1 綁定與分析

```
GET    /api/bindings                         # 資料源綁定狀態
POST   /api/bindings/shopline                # 儲存 Shopline token（stub）
POST   /api/bindings/{source_id}/connect     # 綁定（oauth/api_key）
POST   /api/bindings/{source_id}/disconnect  # 解除綁定

GET    /api/analysis/reports                  # 報表清單
POST   /api/analysis/reports                  # 新建報表
GET    /api/analysis/reports/{id}             # 報表詳情（含八區塊）
PUT    /api/analysis/reports/{id}             # 更新報表（編輯 prompt）
POST   /api/analysis/reports/{id}/run         # 重新執行
DELETE /api/analysis/reports/{id}             # 刪除
```

### 4.2 受眾與留言

```
GET    /api/audience                          # 受眾清單
POST   /api/audience/preview                  # 受眾預覽（依條件/分群回人數）
POST   /api/audience/parse                    # 自然語言轉結構化條件
POST   /api/audience                          # 建立受眾
PUT    /api/audience/{id}/settings            # 更新頻率/通路
POST   /api/audience/{id}/ad-channel          # 廣告受眾建立（Meta/Google/LINE）
POST   /api/audience/{id}/push                # 推播
GET    /api/audience/{id}/report              # 推播報表

GET    /api/comments                          # 留言列表
POST   /api/comments/reply                    # 多選自動回覆
```

### 4.3 監測、MCP、互動、健康檢查

```
GET/POST/PUT/DELETE /api/monitoring/rules     # 監測規則 CRUD
GET/POST/PUT/DELETE /api/mcp/servers          # MCP server CRUD
POST   /api/chat                              # Prompt 互動
GET    /api/health                            # 健康檢查
```

## 5. 錯誤處理與復原機制

### 5.1 API 錯誤

- **後端**：找不到資源回 `HTTPException 404`（如報表/受眾不存在）；請求模型由 pydantic 驗證，欄位錯誤回 422。
- **前端**：axios 攔截器統一捕捉錯誤，以 antd `message.error` 顯示 `detail`，避免單頁崩潰。

### 5.2 demo 模式降級

- 靜態站無後端，`mockApi` 以本地資料回應；所有方法簽章與真後端一致，確保線上 demo 不因缺後端而失效。

### 5.3 使用者輸入處理

- **輸入驗證**：必填欄位（報表名稱、資料來源、受眾名稱、比對欄位、推送時間/內容）前端即時提示。
- **友善訊息**：操作成功/失敗以 message 提示；刪除以 Popconfirm 二次確認。

## 6. 狀態管理與持久化

### 6.1 狀態保存（本期）

- 後端記憶體 dict 與前端 mock 陣列；範例報表狀態：

```json
{
  "id": "r001",
  "name": "VITABOX 廣告週報",
  "sources": ["Meta", "Google"],
  "frequency": "每週",
  "model": "claude-opus-4-8",
  "prompt": "比較 Meta 與 Google 的 ROAS，標記變動超過 20% 的指標。",
  "updated_at": "2026-06-10 09:00"
}
```

### 6.2 復原機制（Phase 2）

- 由記憶體改為持久化（資料庫 + BigQuery）；報表/受眾/規則具狀態驗證與排程重跑。

## 7. 效能監控與最佳化（Phase 2 為主）

### 7.1 效能指標

- API 回應時間、BigQuery 查詢耗時與成本、LLM 回應延遲與 token 用量。

### 7.2 最佳化策略

- BigQuery 查詢分區與快取；前端 bundle code-splitting（目前單一 chunk 偏大，後續以 manualChunks 拆分）；Claude API 啟用 prompt caching。

### 7.3 效能報告

- 收集查詢耗時、API 用量與成本，定期彙整趨勢。

## 8. 日誌管理與輸出規範

### 8.1 日誌等級

- DEBUG（除錯細節）/ INFO（一般流程）/ WARNING（可容忍異常）/ ERROR（請求失敗）/ CRITICAL（服務中斷）。

### 8.2 格式（Phase 2 統一）

```
console: '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
```

### 8.3 敏感資訊保護

- 禁止記錄 access token、API key、個資；日誌遮罩憑證；`.env` 不進版控。

## 9. 設定檔規範

### 9.1 環境變數（Projects/.env，僅列名稱）

```
SHOPLINE_ACCESS_TOKEN
GA4_OAUTH_CLIENT_SECRET / GA4_OAUTH_TOKEN_PATH / GA4_PROPERTY_ID
GOOGLE_ADS_* / META_* / BING_* / SEARCH_CONSOLE_* / LINE_*
GOOGLE_CLOUD_PROJECT / BIGQUERY_DATASET / GOOGLE_APPLICATION_CREDENTIALS
BOXFUL_API_* / FIRECRAWL_API_KEY
ANTHROPIC_API_KEY
```

### 9.2 前端建置設定

```
VITE_DEMO_MODE=true     # 靜態 demo：api 指向 mockApi，base = /deus-console/
（未設定）              # 本機開發：api 指向真後端，base = /
```

## 10. 整合與擴展

### 10.1 外部整合（Phase 2）

- **資料源**：Shopline、Meta、Google Ads、GA4、Bing、Search Console、LINE、Boxful。
- **AI / 工具**：Claude API（分析潤飾、留言回覆、Prompt 互動）、MCP servers。

### 10.2 擴展機制

- 整合接口層 `backend/integrations/` 預留統一介面（oauth / bigquery_client / llm），新增資料源或模型只需實作對應 adapter。
- 新增功能頁依既有九步流程（schemas → mock_data → router → 註冊 → types → httpApi → mockApi → 頁面 → 選單/路由），httpApi 與 mockApi 必並行。

## 11. 測試需求

### 11.1 單元測試（Phase 2）

- 後端 router 與 schema 驗證、integrations adapter 行為。

### 11.2 整合測試

- 本期以 curl / 直接呼叫 router 函式驗證端點；前端以 `tsc -b` 型別檢查 + Playwright 逐頁互動驗證。

### 11.3 效能測試（Phase 2）

- BigQuery 查詢負載與 LLM 併發。

### 11.4 使用者驗收

- 逐頁點測：綁定、報表清單/新建/詳情、受眾四方式/廣告建立/推播/報表、留言篩選與自動回覆、監測、MCP、Prompt；確認全繁中、無 emoji、無 console error。

## 12. 部署與維運

### 12.1 部署

- **線上 demo**：`VITE_DEMO_MODE=true` 建置 + 404.html fallback，透過 git worktree 快進推送 `gh-pages` 分支；GitHub Pages 出站。
- **本機開發**：`uvicorn main:app --reload --port 8000` + `npm run dev`（Vite proxy /api）。

### 12.2 維運

- 更新線上站：重新 build demo 並推 gh-pages（目前手動）。可改 GitHub Actions 自動部署（需授權 token 的 workflow scope）。

### 12.3 版本管理

- 原始碼於 `main`，demo 產物於 `gh-pages`；提交訊息以功能群組描述。

## 13. 安全考量

### 13.1 資料安全

- 憑證集中 `.env` 且不進版控；demo 靜態站不含任何真實憑證（全 mock）。
- 廣告受眾比對欄位於 Phase 2 套用清洗與雜湊（Email/Phone SHA-256、E.164 正規化）。

### 13.2 系統安全（Phase 2）

- 使用者登入鑑權、權限分層、操作審計；目前單機內部工具尚未導入登入。

### 13.3 合規

- 個資處理遵循最小蒐集與遮罩原則；行銷發送前須檢查訂閱與黑名單狀態。

## 14. 時程與里程碑

### 14.1 開發階段

| 階段 | 時間 | 主要交付 | 驗收條件 |
|------|------|----------|----------|
| 第一階段：UI 骨架 | 已完成（至 2026-06） | 七大頁 UI、雙模式 API、demo 上線 | 逐頁可操作、全 mock、build 通過、無 console error |
| 第二階段：實際串接 | 規劃中 | GA4/各源 OAuth、BigQuery 查詢層、Claude API、推送串接 | 由真實數據產出報表、受眾可同步、推播可發送 |
| 第三階段：維運強化 | 規劃中 | 持久化、排程、登入鑑權、自動部署、監控 | 穩定排程、權限控管、CI/CD |

### 14.2 關鍵里程碑

- **M1**：五頁 UI 骨架上線（已達成）。
- **M2**：分析報表化 + 受眾管理擴充 + 留言管理（已達成）。
- **M3**：GA4 與 BigQuery 串接，分析中心改用真實數據（待辦）。
- **M4**：受眾同步至廣告平台與推播實際發送（待辦）。

## 15. 風險管理

### 15.1 技術風險

| 風險項 | 機率 | 影響 | 因應策略 |
|--------|------|------|----------|
| 各源 OAuth 串接工時與授權審核 | 高 | 高 | 分批接通，優先 GA4（已打通授權）與 Shopline |
| BigQuery 查詢成本與延遲 | 中 | 中 | 分區/快取、限制查詢範圍、預先彙整 |
| LLM 成本與輸出品質不穩 | 中 | 中 | 混合策略（規則計算 + LLM 潤飾）、prompt caching、模型可選 |

### 15.2 專案風險

| 風險項 | 機率 | 影響 | 因應策略 |
|--------|------|------|----------|
| GitHub Pages 靜態限制（無後端） | 高 | 低 | demo 以 mock 呈現；正式環境另部署後端 |
| 範圍持續擴張 | 中 | 中 | 維持雙模式與九步流程，分階段交付 |

## 16. 成功標準與驗收條件

### 16.1 功能驗收

- 七大頁皆可操作，雙模式（真後端 / demo）行為一致；新增功能同時具 httpApi 與 mockApi。

### 16.2 非功能驗收

- `tsc -b && vite build` 通過；逐頁無 console error（favicon 除外）；全繁體中文、無 emoji、版面一致。

### 16.3 商業目標（Phase 2 衡量）

- 報表產出時間下降、受眾投放 ROAS 提升、留言/客訴回覆時效縮短。

---

## 附註

- 本 PRD 反映目前實作現況與第二階段路線，隨專案進度更新。
- 接手延續開發請先讀 `HANDOFF.md`（技術慣例與新增頁面的九步流程）。
