"""頁二:分析中心 — 八區塊 insight + 常用報表。

混合策略:
  - 規則計算區塊(KPI、漏斗、波動、趨勢、優異/異常日期)→ 本期由 mock_data 提供,
    Phase 2 改由 integrations/bigquery_client.query() 取數後在此計算。
  - LLM 潤飾區塊(執行摘要、優化建議、總結)→ Phase 2 交給 integrations/llm.refine_insight(),
    使用 config.model 與 config.prompt。
"""

from __future__ import annotations

from datetime import datetime
from itertools import count

from fastapi import APIRouter, HTTPException

import mock_data
from schemas import (
    AnalysisReport,
    CompareMode,
    DatePreset,
    ReportConfig,
    SavedReport,
    SavedReportCreate,
)

router = APIRouter(prefix="/analysis", tags=["analysis"])

# 常用報表暫存(記憶體)。Phase 2 改持久化,並由排程每日重跑 schedule_daily=True 的報表。
_saved: dict[int, SavedReport] = {}
_id_seq = count(1)

_PRESET_LABEL: dict[DatePreset, str] = {
    "last_7d": "過去 7 天",
    "last_14d": "過去 14 天",
    "last_week": "上週(一至日)",
    "this_month": "本月",
    "last_month": "上個月",
    "custom": "自訂區間",
}

_COMPARE_LABEL: dict[CompareMode, str] = {
    "prev_period": "對比前期",
    "yoy": "對比去年同期",
}


def _range_label(config: ReportConfig) -> str:
    if config.date_preset == "custom" and config.start_date and config.end_date:
        return f"{config.start_date} ~ {config.end_date}"
    return _PRESET_LABEL.get(config.date_preset, "過去 7 天")


def _build(config: ReportConfig) -> AnalysisReport:
    # TODO Phase 2:
    #   computed = bigquery_client.query(...) 依 config 的日期/資料源取數並做規則計算
    #   report.executive_summary = llm.refine_insight("executive_summary", computed, model=config.model, prompt=config.prompt)
    #   report.recommendations = llm.refine_insight("recommendations", computed, ...)
    #   report.conclusion = llm.refine_insight("conclusion", computed, ...)
    return mock_data.build_analysis_report(
        range_label=_range_label(config),
        compare_label=_COMPARE_LABEL.get(config.compare_mode, "對比前期"),
    )


@router.get("", response_model=AnalysisReport)
def get_analysis() -> AnalysisReport:
    """以預設設定回傳分析報告(過去 7 天、對比前期)。本期為 mock。"""
    return _build(ReportConfig())


@router.post("/run", response_model=AnalysisReport)
def run_analysis(config: ReportConfig) -> AnalysisReport:
    """依控制列設定產生分析報告。本期為 mock,僅反映日期/對比文字。"""
    return _build(config)


@router.get("/saved", response_model=list[SavedReport])
def list_saved() -> list[SavedReport]:
    return list(_saved.values())


@router.post("/saved", response_model=SavedReport)
def create_saved(payload: SavedReportCreate) -> SavedReport:
    rid = next(_id_seq)
    report = SavedReport(id=rid, created_at=datetime.now(), **payload.model_dump())
    _saved[rid] = report
    return report


@router.delete("/saved/{report_id}")
def delete_saved(report_id: int) -> dict:
    if report_id not in _saved:
        raise HTTPException(status_code=404, detail="常用報表不存在")
    del _saved[report_id]
    return {"deleted": report_id}
