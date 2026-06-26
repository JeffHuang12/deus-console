"""受眾管理 — 清單、預覽、新建、設定。

本期預覽人數與條件摘要仍為 mock。
Phase 2:自然語言/結構化條件 → integrations/llm 解析 + integrations/bigquery_client 估算人數。
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

import mock_data
from db import db
from exceptions import not_found
from schemas import (
    AdBuildRequest,
    AdChannelResult,
    Audience,
    AudienceCreate,
    AudiencePreview,
    AudiencePreviewRequest,
    AudienceReport,
    AudienceSettings,
    NlParseResult,
    PushPayload,
)

router = APIRouter(prefix="/audience", tags=["audience"])

# 首次啟動時寫入 mock 種子
_seeded = False


def _ensure_seed() -> None:
    global _seeded
    if _seeded:
        return
    _seeded = True
    if not db.list_audiences():
        for a in mock_data.MOCK_AUDIENCES:
            db.save_audience(a.model_dump())


@router.get("", response_model=list[Audience])
def list_audiences() -> list[Audience]:
    _ensure_seed()
    return [Audience(**a) for a in db.list_audiences()]


@router.post("/preview", response_model=AudiencePreview)
def preview_audience(req: AudiencePreviewRequest) -> AudiencePreview:
    return mock_data.build_audience_preview(req.segment)


@router.post("/parse", response_model=NlParseResult)
def parse_audience(_req: AudiencePreviewRequest) -> NlParseResult:
    return mock_data.build_nl_parse()


@router.post("", response_model=Audience)
def create_audience(payload: AudienceCreate) -> Audience:
    _ensure_seed()
    existing_ids = {a["id"] for a in db.list_audiences()}
    n = 3
    while f"a{n:03d}" in existing_ids:
        n += 1
    aid = f"a{n:03d}"
    preview = mock_data.build_audience_preview()
    audience = Audience(
        id=aid,
        name=payload.name,
        method=payload.method,
        count=preview.estimated_count,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
        frequency="手動",
        channels=[],
    )
    db.save_audience(audience.model_dump())
    return audience


@router.get("/{audience_id}", response_model=Audience)
def get_audience(audience_id: str) -> Audience:
    row = db.get_audience(audience_id)
    if row is None:
        not_found("受眾")
    return Audience(**row)


@router.put("/{audience_id}/settings", response_model=Audience)
def update_settings(audience_id: str, settings: AudienceSettings) -> Audience:
    row = db.get_audience(audience_id)
    if row is None:
        not_found("受眾")
    row["frequency"] = settings.frequency
    row["channels"] = settings.channels
    db.save_audience(row)
    return Audience(**row)


@router.delete("/{audience_id}")
def delete_audience(audience_id: str) -> dict:
    if not db.delete_audience(audience_id):
        not_found("受眾")
    return {"deleted": audience_id}


@router.post("/{audience_id}/ad-channel", response_model=AdChannelResult)
def build_ad_audience(audience_id: str, req: AdBuildRequest) -> AdChannelResult:
    if db.get_audience(audience_id) is None:
        not_found("受眾")
    count = mock_data.AD_CHANNEL_COUNTS.get(req.channel, 1500)
    return AdChannelResult(channel=req.channel, status="done", count=count, message="建立完成")


@router.post("/{audience_id}/push")
def send_push(audience_id: str, _payload: PushPayload) -> dict:
    if db.get_audience(audience_id) is None:
        not_found("受眾")
    return {"ok": True}


@router.get("/{audience_id}/report", response_model=AudienceReport)
def get_audience_report(audience_id: str) -> AudienceReport:
    if db.get_audience(audience_id) is None:
        not_found("受眾")
    return mock_data.build_audience_report()
