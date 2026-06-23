# GA4 自然語言查詢頁

在 DEUS Console 新增的「GA4 查詢」頁:輸入一句中文,由 Claude Agent 透過官方 GA4 MCP
server(`analytics-mcp`)自動選維度指標查 GA4,回傳文字 + 表格 + 圖表。

這是本專案第一個「真整合」功能(非 stub)。

## 架構

```
前端 Ga4QueryPage (antd + Recharts)
  → POST /api/ga4/query {text}
后端 routers/ga4.py → integrations/ga4_agent.py
  → claude-agent-sdk query()  (cli_path 釘住,重用 Claude Code 訂閱認證)
  → analytics-mcp (stdio 子程序, ADC authorized_user 認證)
  → GA4 Data API (property 378552427)
```

數字由程式掌握:後端攔截 `run_report` 工具結果(GA4 `proto_to_dict`,snake_case)組表格;
模型只負責文字說明與圖表規格(回覆結尾的 ```json``` 區塊)。

## 一次性設定

1. 認證(GA4 走 ADC)。現有 OAuth refresh token 可能已過期,需重新授權一次:

   ```
   /Users/jeffhuang/Claude/Projects/ga4/.venv/bin/python /Users/jeffhuang/Claude/Projects/ga4/reauth_adc.py
   ```

   會開瀏覽器要你用對 property 378552427 有檢視權的 Google 帳號同意授權,
   成功後寫出 `ga4/ga4_oauth_token.json` 與 `ga4/ga4_adc.json`(皆 chmod 600)。
   OAuth 同意畫面若仍「測試中」,登入帳號須在測試使用者清單內。

2. 中央 `.env`(Projects 根目錄)已填:
   - `GOOGLE_APPLICATION_CREDENTIALS` → `ga4/ga4_adc.json`
   - `GOOGLE_PROJECT_ID` = `jeff-sideproject-01`
   - `GA4_PROPERTY_ID` = `378552427`

3. 後端相依已加進 `backend/requirements.txt`:`claude-agent-sdk`、`analytics-mcp`、
   `python-dotenv`。安裝:`backend/.venv/bin/pip install -r backend/requirements.txt`。

## 啟動

後端:
```
cd backend && .venv/bin/uvicorn main:app --reload --port 8000
```
前端:
```
cd frontend && npm run dev    # http://localhost:5173,選單「GA4 查詢」
```

Demo 模式(`VITE_DEMO_MODE=true`)走 mock,回示範表格/圖表,不打後端。

## 環境變數(選用)

- `CLAUDE_CLI_PATH`:覆寫 Claude CLI 路徑。預設 `/Applications/cmux.app/Contents/Resources/bin/claude`,
  找不到時讓 SDK 自行尋找 PATH。對外部署時可改設 `ANTHROPIC_API_KEY` 走 API 計費。
- `GA4_DOTENV_PATH`:覆寫 .env 位置。

## 模型切換(Claude / Gemini)與成本

頁面上方有「模型」下拉,可選 Claude(Haiku/Sonnet/Opus)或 Gemini(2.5 Flash/Pro)。
後端 `integrations/ga4_agent.py` 依 model 前綴分流:`claude-*` 走 claude-agent-sdk、
`gemini-*` 走 google-genai(把 MCP `ClientSession` 當 tool,自動函式呼叫),兩條路徑共用同一個
analytics-mcp 與結果解析。選到的 model 會存進歷史並顯示標籤。

- 用 Gemini 前:在 `/Users/jeffhuang/Claude/Projects/.env` 填 `GEMINI_API_KEY`(Google AI Studio 取得)後**重啟後端**。未填時選 Gemini 會回可讀錯誤,不影響 Claude。
- 降 token 成本(已套用):預設模型改 **Haiku 4.5**(原本 Opus,每筆約 $0.09);`max_turns` 12→6;
  精簡工具清單(只留 run_report / run_realtime_report / get_custom_dimensions_and_metrics / get_property_details)以減少每輪工具 schema。
- 說明:analytics-mcp 的 `run_report` 工具描述很長且每輪都送,是輸入 token 的主要固定成本;
  不改 MCP server 難縮短,故以「換小模型 + 減輪數 + 減工具」為務實解。Gemini Flash 也是低成本選項。

## 查詢歷史

每次查詢(問題 + 文字 + 表格 + 圖表)自動存進**後端檔案**,顯示在頁面左欄。
點任一筆可在同頁回看當時報表(不重打 agent),可單筆刪除或清除全部。重啟 uvicorn 不會消失,
同一後端可跨裝置/瀏覽器共用。

- 端點(`backend/routers/ga4.py`):
  - `GET /api/ga4/history` 列出、`POST /api/ga4/history` 存一筆(回傳含 id/created_at)、
    `DELETE /api/ga4/history/{id}` 刪一筆、`DELETE /api/ga4/history` 清空。
- 儲存:`backend/integrations/ga4_history_store.py`,落地在 `backend/data/ga4_history.json`(上限 200 筆,含 lock)。規模變大再換 DB。
- 前端依雙軌慣例:`client.ts` 的 httpApi 與 `mocks.ts`(demo 模式用記憶體陣列)各有 `getGa4History/saveGa4History/deleteGa4History/clearGa4History`。

## 已知限制 / 後續

- 目前固定查 property 378552427。多客戶要加「選屬性」下拉,把 property 當參數傳後端。
- 表格目前解析 `run_report` / `run_realtime_report`(dimension_headers/metric_headers/rows)。
  漏斗報表(run_funnel_report)結構不同,本期只回文字、不組表格。
- agent 預設用 Claude CLI 的預設 model;回應約數秒到數十秒,前端 timeout 設 120s。
