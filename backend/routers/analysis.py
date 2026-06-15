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
    Report,
    ReportConfig,
    ReportCreate,
    ReportDetail,
    ReportUpdate,
)

router = APIRouter(prefix="/analysis", tags=["analysis"])

# 報表清單暫存(記憶體),以 MOCK_REPORTS 為種子。Phase 2 改持久化,並由排程依 frequency 重跑。
_reports: dict[str, Report] = {r.id: r for r in mock_data.MOCK_REPORTS}
_id_seq = count(4)  # 種子已用 r001-r003

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


def _sections() -> AnalysisReport:
    """報表詳情的八區塊內容(本期 mock)。"""
    return _build(ReportConfig())


@router.get("/reports", response_model=list[Report])
def list_reports() -> list[Report]:
    """報表清單。"""
    return list(_reports.values())


@router.post("/reports", response_model=Report)
def create_report(payload: ReportCreate) -> Report:
    """新建報表。本期僅存設定,回新報表(id 為 r00X)。"""
    rid = f"r{next(_id_seq):03d}"
    report = Report(
        id=rid,
        name=payload.name,
        sources=payload.sources,
        updated_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
        frequency=payload.frequency,
        model=payload.model,
        prompt=payload.prompt,
    )
    _reports[rid] = report
    return report


@router.put("/reports/{report_id}", response_model=Report)
def update_report(report_id: str, payload: ReportUpdate) -> Report:
    """更新報表(目前支援編輯 prompt)。"""
    report = _reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="報表不存在")
    report.prompt = payload.prompt
    _reports[report_id] = report
    return report


@router.get("/reports/{report_id}", response_model=ReportDetail)
def get_report(report_id: str) -> ReportDetail:
    """報表詳情:基本資料 + 八區塊。本期八區塊為 mock。"""
    report = _reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="報表不存在")
    return ReportDetail(**report.model_dump(), sections=_sections())


@router.post("/reports/{report_id}/run", response_model=Report)
def run_report(report_id: str) -> Report:
    """重跑報表(本期僅更新 updated_at)。"""
    report = _reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="報表不存在")
    report.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    return report


@router.delete("/reports/{report_id}")
def delete_report(report_id: str) -> dict:
    if report_id not in _reports:
        raise HTTPException(status_code=404, detail="報表不存在")
    del _reports[report_id]
    return {"deleted": report_id}
