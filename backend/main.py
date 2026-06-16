"""DEUS Console 後端 — FastAPI 入口。

第一階段:提供五個頁面的 stub REST API,皆回 mock 資料。
啟動:uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analysis, audience, bindings, chat, comments, mcp, monitoring

app = FastAPI(title="DEUS Console API", version="0.1.0")

# 允許 Vite dev server 跨域呼叫
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"
app.include_router(bindings.router, prefix=API_PREFIX)
app.include_router(analysis.router, prefix=API_PREFIX)
app.include_router(audience.router, prefix=API_PREFIX)
app.include_router(comments.router, prefix=API_PREFIX)
app.include_router(monitoring.router, prefix=API_PREFIX)
app.include_router(mcp.router, prefix=API_PREFIX)
app.include_router(chat.router, prefix=API_PREFIX)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
