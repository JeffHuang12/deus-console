"""GA4 自然語言查詢 — 真整合(非 stub)。

POST /api/ga4/query:收一句自然語言,交給 Claude Agent + analytics-mcp 查 GA4,
回傳文字 + 表格 + 圖表規格。前端用 Recharts 與 antd Table 呈現。

/api/ga4/history:查詢歷史的檔案持久化(可在同頁回看、跨裝置共用)。
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

from integrations import ga4_history_store as store
from integrations.ga4_agent import run_ga4_query
from schemas import (
    Ga4HistoryEntry,
    Ga4HistorySaveRequest,
    Ga4QueryRequest,
    Ga4QueryResponse,
)

router = APIRouter(prefix="/ga4", tags=["ga4"])


@router.post("/query", response_model=Ga4QueryResponse)
async def query_ga4(req: Ga4QueryRequest) -> Ga4QueryResponse:
    result = await run_ga4_query(req.text, req.model)
    return Ga4QueryResponse(**result)


@router.get("/history", response_model=list[Ga4HistoryEntry])
def list_history() -> list[dict]:
    return store.list_entries()


@router.post("/history", response_model=Ga4HistoryEntry)
def save_history(req: Ga4HistorySaveRequest) -> Ga4HistoryEntry:
    entry = Ga4HistoryEntry(
        id=uuid.uuid4().hex,
        text=req.text,
        model=req.model,
        narrative=req.narrative,
        table=req.table,
        chart=req.chart,
        error=req.error,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    store.add_entry(entry.model_dump())
    return entry


@router.delete("/history/{entry_id}")
def delete_history(entry_id: str) -> dict:
    store.delete_entry(entry_id)
    return {"deleted": entry_id}


@router.delete("/history")
def clear_history() -> dict:
    store.clear()
    return {"cleared": True}
