# 頁面 AI 驗收報告

驗收方式：依 `review_pages.md` 的流程，用 Claude Preview 起 demo（port 5180）逐頁截圖＋讀 console，對照 REVIEWER_PROMPT 評分表打分。
驗收範圍：本次新增的頁面（功能總覽 + 四個中心頁）。既有八頁未在本輪重評。
日期基準：2026-06-22。

## 合規前置（全頁共通）

- demo build 成功（`tsc -b && vite build` 通過）。
- 全繁體中文、無 emoji。
- 已修正 console error：原本多個 Table 用 `rowKey={(_, i) => ...}`（index 為 key）被 antd 以 error 等級警告，已改為穩定 key。驗收時發現的剩餘同類警告為 buffer 殘留（已於無 Table 的功能總覽頁驗證為 0 來源）與既有 `Ga4QueryPage` 的同類用法（既存技術債，非本次新增）。

## 逐頁結果

| 頁面 | route | 渲染確認 | 老闆視角 | 工程師視角 | 合規 | 總分 | 是否合格 |
|------|-------|----------|----------|------------|------|------|----------|
| 功能總覽 | /feature-catalog | 89 功能、93 卡片、KPI 89/4/36/49、分組與篩選正常 | 40/40 | 33/35 | 25/25 | 98 | 合格 |
| 預測模型中心 | /predictions | 模型清單 5 列、選列出結果表＋分佈圖＋觸發提示 | 36/40 | 33/35 | 25/25 | 94 | 合格 |
| 客服對話中心 | /conversations | 對話列表（情緒/升級標籤）＋詳情/摘要派工/回覆草稿三區 | 38/40 | 34/35 | 25/25 | 97 | 合格 |
| 商品與庫存中心 | /merchandising | 3 表（缺貨×廣告、商品關聯、內容生成）共 10 列 | 34/40 | 32/35 | 25/25 | 91 | 合格 |
| 歸因分析 | /attribution | 歸因路徑表＋路徑語意 Alert＋疲勞雙線圖 | 35/40 | 33/35 | 25/25 | 93 | 合格 |

全部新頁達合格線（>= 80 且合規滿分）。

## 既有頁強化（第二輪驗收）

依計畫第 7.5 節補強既有頁，皆 demo 實測渲染正常、無 console error：

| 頁面 | route | 強化內容 | 驗收 |
|------|-------|----------|------|
| 留言管理 | /comments | 新增 情緒／嚴重度／派工對象 欄位與每列「升級」動作（由標籤規則推導，高嚴重度按鈕標紅） | 合格 |
| 監測中心 | /monitoring | 規則範本一鍵帶入：GA4 異常／訂單異常／缺貨暫停廣告（新增「庫存量」指標） | 合格 |
| Prompt 互動 | /prompt | 新增「會員查詢」模式：NL→SQL 預覽＋示範名單表 | 合格 |
| 受眾管理 | /audience | 新增「推播旅程」分頁：棄單／回購／首購序列／喚回／候補／生日 多步序列 | 合格 |
| 分析中心 | /analysis | 真實 ROAS／素材疲勞 已存在於預設 Prompt 範本，無須另做報表類型 | 沿用既有 |

`tsc -b && vite build` 通過；以上頁面 demo 模式逐一以 DOM 與 console 驗證。

## 新一輪需求（第三輪驗收，2026-06-23）

依第八部分實作，demo 實測渲染正常、無 console error：

| 項目 | route | 內容 | 驗收 |
|------|-------|------|------|
| AI 資料查詢 | /ai-query | 單一頁＋來源切換（GA4／Google Ads／Meta／GSC／跨平台），narrative＋chart＋table | 合格 |
| 商品與庫存中心 | /merchandising | 全產品 10 欄（可設定安全庫存、預估可售天數、三期 YoY、建議行動）＋AI Data Feed 抽屜（8 欄＋規格） | 合格 |
| 商品關聯分析 | /product-associations | 觀察窗（預設 60）、產品篩選、共購顧客數、建議、原生排序 | 合格 |
| Lookalike | /audience/new | 受眾預覽加「用此受眾建立類似受眾」：種子類型／目標市場／Meta-Google-LINE 範圍／即時預估／建立 | 合格 |
| 數據綁定 | /binding | 對 4 個有官方 MCP 的資料源加「支援 AI 查詢」標籤 | 合格 |
| 功能總覽 | /feature-catalog | 加預期效益（9 項）與效益標籤（提升 ROAS／省預算／提高回購／省工時） | 合格 |

驗收過程再次抓到並修掉一個 console 警告（`<Spin tip>` 在 antd v5 非 nest/fullscreen 會報 error，已改為 Spin＋文字）。`tsc -b && vite build` 通過。

## 後續優化建議（非阻擋）

- `/predictions`、`/merchandising`、`/attribution` 為展示型，可加「狀態：規劃中」字樣讓老闆更清楚非已上線。
- 共用 chunk 偏大（pre-existing，prd §7.2 已列）：之後以 manualChunks 拆分。
- 順手修 `Ga4QueryPage` 的 index rowKey，清掉既有 console 警告。
- 既有八頁建議下一輪一併納入此驗收流程重評。
