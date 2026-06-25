"""頁二:分析中心 — 八區塊 insight + 常用報表。

混合策略:
  - 規則計算區塊(KPI、漏斗、波動、趨勢、優異/異常日期)→ 本期由 mock_data 提供,
    Phase 2 改由 integrations/bigquery_client.query() 取數後在此計算。
  - LLM 潤飾區塊(執行摘要、優化建議、總結)→ integrations/llm.refine_insight()。
"""

from __future__ import annotations

from datetime import datetime
from itertools import count

from fastapi import APIRouter

import mock_data
from db import db
from exceptions import not_found
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

# 種子報表：首次啟動時若 DB 無任何報表，寫入 mock 種子。
_seeded = False


def _ensure_seed() -> None:
    global _seeded
    if _seeded:
        return
    _seeded = True
    if not db.list_reports():
        for r in mock_data.MOCK_REPORTS:
            db.save_report(r.model_dump())


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
    #   report.executive_summary = llm.refine_insight("executive_summary", computed, model=config.model)
    #   report.recommendations = llm.refine_insight("recommendations", computed, model=config.model)
    #   report.conclusion = llm.refine_insight("conclusion", computed, model=config.model)
    return mock_data.build_analysis_report(
        range_label=_range_label(config),
        compare_label=_COMPARE_LABEL.get(config.compare_mode, "對比前期"),
    )


def _sections() -> AnalysisReport:
    return _build(ReportConfig())


@router.get("/reports", response_model=list[Report])
def list_reports() -> list[Report]:
    _ensure_seed()
    return [Report(**r) for r in db.list_reports()]


@router.post("/reports", response_model=Report)
def create_report(payload: ReportCreate) -> Report:
    _ensure_seed()
    existing_ids = {r["id"] for r in db.list_reports()}
    n = 4
    while f"r{n:03d}" in existing_ids:
        n += 1
    rid = f"r{n:03d}"
    report = Report(
        id=rid,
        name=payload.name,
        sources=payload.sources,
        updated_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
        frequency=payload.frequency,
        model=payload.model,
        prompt=payload.prompt,
    )
    db.save_report(report.model_dump())
    return report


@router.put("/reports/{report_id}", response_model=Report)
def update_report(report_id: str, payload: ReportUpdate) -> Report:
    row = db.get_report(report_id)
    if row is None:
        not_found("報表")
    row["prompt"] = payload.prompt
    db.save_report(row)
    return Report(**row)


@router.get("/reports/{report_id}", response_model=ReportDetail)
def get_report(report_id: str) -> ReportDetail:
    row = db.get_report(report_id)
    if row is None:
        not_found("報表")
    return ReportDetail(**row, sections=_sections())


@router.post("/reports/{report_id}/run", response_model=Report)
def run_report(report_id: str) -> Report:
    row = db.get_report(report_id)
    if row is None:
        not_found("報表")
    row["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    db.save_report(row)
    return Report(**row)


@router.delete("/reports/{report_id}")
def delete_report(report_id: str) -> dict:
    if not db.delete_report(report_id):
        not_found("報表")
    return {"deleted": report_id}
