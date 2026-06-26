# 頁面 AI 驗收 runbook

用「另一個 AI」對每個頁面截圖並評分，當作頁面是否「夠好」的驗收門檻。
執行主體是 Claude Preview MCP（截圖）＋ vision 子代理（評分），不是可獨立跑的腳本。

## 前置

- `.claude/launch.json` 已有 `deus-demo`（`npm run dev:demo --prefix frontend`，port 5173）。
- `frontend/package.json` 已有 `dev:demo`（`VITE_DEMO_MODE=true vite`）。
- demo 模式 base 為 `/deus-console/`，所以頁面網址是 `http://localhost:5173/deus-console/<route>`。
- demo 走 mockApi，不需起後端。

## 步驟

1. `preview_start("deus-demo")` 取得 serverId。
2. 對下方每個 route：
   - 用 `preview_eval` 設定 `window.location.hash`/`pathname` 導到 `/deus-console/<route>`，或用 `preview_click` 點側欄選單。
   - `preview_console_logs` 抓 console error。
   - `preview_screenshot` 取圖。
3. 每頁把「截圖 + 該頁用途 + console log」交給一個 vision 子代理，餵下方 REVIEWER_PROMPT 打分。
4. 彙整成 `scripts/review_report.md`，逐頁列分數與修正點。
5. 未達合格線的頁面，依修正點改完重跑。

## 合格線

總分 >= 80，且兩項合規（無 console error、無 emoji）皆滿分。否則該頁不過。

## REVIEWER_PROMPT（評審子代理用，固定）

```
你是 UI 驗收者。下圖是 DEUS Console 的「<頁名>」頁，用途：<用途>。
只看畫面，依下表打分（共 100），並逐題說明扣分原因與具體修正點。全程繁體中文、禁 emoji。
- 老闆視角｜不看程式能否說出這頁在做什麼功能：25
- 老闆視角｜功能價值與狀態（已上線/規劃中）是否一眼可辨：15
- 工程師視角｜版面結構是否像可實作的真實頁（非空殼）：20
- 工程師視角｜是否沿用既有元件與 antd 風格、與其他頁一致：15
- 合規｜全繁中、無 emoji：10（出現 emoji 此項 0）
- 合規｜無 console error、demo 可開：15（有 console error 此項 0）
輸出：總分、逐題得分與理由、修正點清單、是否合格（>=80 且兩合規項滿分）。
```

## 要截圖的 route 清單（demo base）

| route | 頁名 | 用途（餵 REVIEWER_PROMPT） |
|-------|------|------|
| /deus-console/feature-catalog | 功能總覽 | 一頁看完數據中台所有功能與狀態 |
| /deus-console/binding | 數據綁定 | 綁定多個資料源 |
| /deus-console/analysis | 分析中心 | 報表清單與八區塊洞察 |
| /deus-console/ga4-query | GA4 查詢 | 自然語言查 GA4（demo 走 mock） |
| /deus-console/attribution | 歸因分析 | 多通路歸因與素材疲勞 |
| /deus-console/audience | 受眾管理 | 受眾建立、廣告同步、推播 |
| /deus-console/comments | 留言管理 | 留言篩選與 AI 回覆 |
| /deus-console/conversations | 客服對話中心 | 對話標籤、摘要、派工、回覆草稿 |
| /deus-console/predictions | 預測模型中心 | 預測模型結果與觸發 |
| /deus-console/merchandising | 商品與庫存中心 | 缺貨暫停廣告、商品關聯、內容生成 |
| /deus-console/monitoring | 監測中心 | 監測規則 |
| /deus-console/mcp | MCP 設定 | MCP server 管理 |
| /deus-console/prompt | Prompt 互動 | 與系統對話 |

GA4 例外：`/ga4-query` demo 走 mockApi 可截圖；真實能力需後端＋憑證，另以本機 dev 驗。
