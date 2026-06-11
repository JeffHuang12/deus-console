# DEUS Console — 數據綁定平台(第一階段)

五頁 UI 骨架:數據綁定、分析中心、監測中心、MCP 設定、Prompt 互動。
本期所有實際串接(OAuth、各源 API、BigQuery、Claude API)皆為 stub,集中在 `backend/integrations/`,
標註 `TODO Phase 2`。

## 線上 Demo

https://jeffhuang12.github.io/deus-console/

GitHub Pages 只能跑靜態網站,所以線上版以 demo 模式運作:前端內建示範資料(`frontend/src/api/mocks.ts`),
不連後端,五頁皆可操作但資料為示範值。每次 push 到 main 會由 GitHub Actions 自動重新部署。

## 技術
- 後端:FastAPI(Python 3.13),回 mock JSON
- 前端:React + Vite + TypeScript + Ant Design + Recharts

## 啟動

後端:
```
cd backend
python -m venv .venv && source .venv/bin/activate   # 或沿用 Projects/.venv
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API 文件:http://localhost:8000/docs

前端:
```
cd frontend
npm install
npm run dev
```
開啟:http://localhost:5173(/api 由 Vite proxy 轉到 :8000)

## Phase 2 接點
- `backend/integrations/oauth.py` — 各資料源 OAuth / Shopline token 驗證
- `backend/integrations/bigquery_client.py` — 集中 BigQuery 查詢
- `backend/integrations/llm.py` — Claude API(insight 潤飾 + Prompt 互動)
