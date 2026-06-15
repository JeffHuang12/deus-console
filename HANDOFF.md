# DEUS Console 交接文件（給延續開發的 Claude）

本文件目的：讓接手的 Claude 讀完即可延續既有設計與慣例，產出新的功能頁面，並與使用者一起發想其他頁面。
請嚴格沿用既有模式與風格，不要另起爐灶。

## 1. 專案概述

- 名稱：DEUS Console — 數據綁定平台
- 性質：內部數據工具，讓使用者綁定多個資料源，再產出分析 insight、設定監測、與 AI 互動。
- 現況：第一階段只做 UI 骨架。所有實際串接（OAuth、各源 API、BigQuery、Claude API）皆為 stub。
- 線上 Demo：https://jeffhuang12.github.io/deus-console/
- 原始碼倉庫：https://github.com/JeffHuang12/deus-console （公開）
- 本機路徑：`/Users/jeffhuang/Claude/Projects/deus_console/`

## 2. 既有五頁與狀態

| 頁面 | 路由 | 內容 | 狀態 |
|------|------|------|------|
| 數據綁定 | /binding | Shopline API Key 輸入 + 10 個資料源卡片（含 Boxful，API Key 類走 modal、其餘 OAuth 類） | UI 完成，連線為 stub |
| 分析中心 | /analysis | 控制列（日期/快速選項、資料源多選、模型、自訂 Prompt、對比期間、存常用報表）+ 八區塊報告（執行摘要、總覽、漏斗、波動、優異VS異常、趨勢、優化建議、總結） | UI 完成，資料為 mock |
| 監測中心 | /monitoring | 監測規則表單 + 列表（指標/條件/門檻/通知，啟用切換、刪除） | UI 完成，記憶體暫存 |
| MCP 設定 | /mcp | MCP server 清單 CRUD | UI 完成，記憶體暫存 |
| Prompt 互動 | /prompt | 聊天介面 | UI 完成，回覆為 stub |

## 3. 技術堆疊與慣例

- 前端：React 18 + Vite + TypeScript + Ant Design (antd) v5 + Recharts + react-router-dom v6 + axios + dayjs
- 後端：FastAPI（Python 3.13，沿用 `Projects/.venv`），回 mock JSON
- 圖表一律用 Recharts；日期一律用 dayjs（antd 內建）
- 命名語意清晰、模組化、集中 API 呼叫層，不硬編碼
- 前後端方法簽章必須一致（demo 模式與後端可互換）

## 4. 目錄結構

```
deus_console/
├── backend/
│   ├── main.py                 # FastAPI app，掛 CORS、註冊 router（API 前綴 /api）
│   ├── schemas.py              # 所有 Pydantic 模型
│   ├── mock_data.py            # 集中 mock 資料
│   ├── routers/                # bindings / analysis / monitoring / mcp / chat
│   └── integrations/           # ★ Phase 2 接點：oauth.py / bigquery_client.py / llm.py（皆 stub）
└── frontend/
    ├── vite.config.ts          # base 依 VITE_DEMO_MODE 切 / 或 /deus-console/；dev proxy /api -> :8000
    └── src/
        ├── main.tsx            # BrowserRouter basename = import.meta.env.BASE_URL
        ├── App.tsx             # antd Layout + 側邊 Menu（MENU 陣列）+ Routes
        ├── api/
        │   ├── types.ts        # 與 schemas.py 對應的 TS 型別
        │   ├── client.ts       # httpApi（axios）+ mockApi 切換，匯出 api
        │   ├── mocks.ts        # demo 模式內建 mock（移植自後端）
        │   └── presets.ts      # 模型清單、日期快速選項
        ├── components/         # 共用：PageHeader / SectionCard / StatusTag / AnalysisControls
        └── pages/              # 五個頁面元件
```

## 5. 新增一個功能頁面的標準做法（務必照此模式）

以新頁面「X」為例，依序：

1. 後端型別：`backend/schemas.py` 新增 Pydantic 模型（請求/回應）。
2. 後端資料：`backend/mock_data.py` 加 mock，或直接在 router 內回 mock。
3. 後端路由：`backend/routers/x.py` 建 `APIRouter(prefix="/x")`，回 mock；到 `main.py` 用 `app.include_router(x.router, prefix="/api")` 註冊。實際串接寫成 TODO，呼叫 `integrations/` 對應 stub。
4. 前端型別：`frontend/src/api/types.ts` 加對應 interface（與 schemas 一致）。
5. 前端 HTTP：`client.ts` 的 `httpApi` 加方法（走 `/api/x`）。
6. 前端 mock：`mocks.ts` 的 `mockApi` 加同名同簽章方法（回 Promise，用 `delay()`）。兩者簽章必須一致。
7. 頁面元件：`frontend/src/pages/XPage.tsx`，最上面用 `<PageHeader title description />`，內容用 antd `Card` 或共用 `SectionCard`，資料一律經 `api`（`import { api } from "../api/client"`）。
8. 導覽與路由：`App.tsx` 的 `MENU` 陣列加一項（key=路由、icon、label），並在 `<Routes>` 加 `<Route path label element>`。
9. 驗證：`cd backend && uvicorn main:app --reload --port 8000`；`cd frontend && npm run dev`；逐頁點過，確認 mock 渲染、無 CORS 錯誤。demo 建置：`VITE_DEMO_MODE=true npm run build`。

關鍵原則：任何新頁面都要同時在 `httpApi`（真後端）與 `mockApi`（demo）實作，否則線上 demo 會壞。

## 6. 設計與風格規範（回覆使用者與寫程式都適用）

- 一律繁體中文，絕對禁止 emoji。
- 回覆使用者採雙層結構：先 200–300 字總結，再條列重點；遇到錯誤推論直接指出，不迎合。
- 介面用語直接、實務導向，避免浮誇與冗字。
- 可選用的 Claude 模型（見 `presets.ts`）：claude-opus-4-8（預設）、claude-sonnet-4-6、claude-haiku-4-5-20251001。

## 7. Phase 2 串接接點（目前皆 stub）

- `backend/integrations/oauth.py`：各源 OAuth 與 Shopline token 驗證。GA4 可沿用 `Projects/ga4` 既有 OAuth。
- `backend/integrations/bigquery_client.py`：集中 BigQuery 查詢。分析/監測最終資料集中到 BigQuery，設定讀 `Projects/.env`（GOOGLE_CLOUD_PROJECT、BIGQUERY_DATASET、GOOGLE_APPLICATION_CREDENTIALS）。
- `backend/integrations/llm.py`：Claude API。分析中心採混合策略（規則計算 + LLM 潤飾摘要/建議/總結）；Prompt 互動頁的對話也走這裡。

## 8. Demo 模式與部署

- demo 模式：`client.ts` 依 `import.meta.env.VITE_DEMO_MODE === "true"` 把 `api` 指向 `mockApi`，不打後端。GitHub Pages 用此模式。
- 部署現況：用 `gh-pages` 分支出站（非 GitHub Actions，因登入 token 缺 `workflow` scope）。
- 更新線上站：`cd frontend && VITE_DEMO_MODE=true npm run build && cp dist/index.html dist/404.html`，再從 `dist/` commit 並 push 到 `gh-pages` 分支。
- 若要改回 Actions 自動部署：請使用者執行 `gh auth refresh -h github.com -s workflow` 授權後，把 `.github/workflows/deploy.yml` 加回（內容見 git 歷史或重建：build 用 VITE_DEMO_MODE=true、cp 404.html、upload-pages-artifact + deploy-pages）。

## 9. 與使用者一起發想新頁面時，先釐清這些再動手

每要新增一個頁面，先問清楚（資訊不足主動追問，不要自行假設）：

1. 這頁要解決什麼問題？使用者進來想完成什麼動作或得到什麼結論？
2. 主要資料來自哪裡？（BigQuery / 某資料源 API / 既有頁面狀態 / 純前端）
3. 是純展示，還是有輸入/設定/CRUD？需要持久化嗎？
4. 是否需要 LLM（Claude API）或 MCP 工具？若需要，輸入與輸出長怎樣？
5. 視覺呈現偏好：KPI 卡、表格、圖表（哪種）、表單、聊天？
6. 這頁與既有五頁的關係（資料是否相依、是否共用綁定狀態）？
7. 本期是否只做 UI（mock），還是要實際串接？

釐清後，照第 5 節的標準做法實作，並先在 demo 模式驗證。

## 10. 指令速查

```
# 後端
cd deus_console/backend && source ../../.venv/bin/activate && pip install -r requirements.txt
uvicorn main:app --reload --port 8000        # http://localhost:8000/docs

# 前端（本機，連真後端）
cd deus_console/frontend && npm install && npm run dev   # http://localhost:5173

# demo 建置（內建 mock，不需後端）
VITE_DEMO_MODE=true npm run build
```
