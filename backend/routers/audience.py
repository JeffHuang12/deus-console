"""受眾管理 — 清單、預覽、新建、設定。

本期全為 mock:
  - 預覽人數與條件摘要固定回傳(`mock_data.build_audience_preview`)。
  - Phase 2:自然語言/結構化條件 → integrations/llm 解析 + integrations/bigquery_client 估算人數;
    通路推送(EDM/Meta/Google/LINE)於 integrations 對應實作。
"""

from __future__ import annotations

from datetime import datetime
from itertools import count

from fastapi import APIRouter, HTTPException

import mock_data
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

# 受眾清單暫存(記憶體),以 MOCK_AUDIENCES 為種子。
_audiences: dict[str, Audience] = {a.id: a for a in mock_data.MOCK_AUDIENCES}
_id_seq = count(3)  # 種子已用 a001-a002


@router.get("", response_model=list[Audience])
def list_audiences() -> list[Audience]:
    return list(_audiences.values())


@router.post("/preview", response_model=AudiencePreview)
def preview_audience(req: AudiencePreviewRequest) -> AudiencePreview:
    """依條件回傳預估人數與條件摘要。本期 mock(分群類依 segment 回對應人數)。"""
    return mock_data.build_audience_preview(req.segment)


@router.post("/parse", response_model=NlParseResult)
def parse_audience(_req: AudiencePreviewRequest) -> NlParseResult:
    """把自然語言描述解析成結構化條件。本期固定 mock。"""
    return mock_data.build_nl_parse()


@router.post("", response_model=Audience)
def create_audience(payload: AudienceCreate) -> Audience:
    """儲存受眾。本期回新受眾(人數沿用 mock 預覽)。"""
    aid = f"a{next(_id_seq):03d}"
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
    _audiences[aid] = audience
    return audience


@router.get("/{audience_id}", response_model=Audience)
def get_audience(audience_id: str) -> Audience:
    audience = _audiences.get(audience_id)
    if audience is None:
        raise HTTPException(status_code=404, detail="受眾不存在")
    return audience


@router.put("/{audience_id}/settings", response_model=Audience)
def update_settings(audience_id: str, settings: AudienceSettings) -> Audience:
    """更新更新頻率與連接通路。本期僅存設定。"""
    audience = _audiences.get(audience_id)
    if audience is None:
        raise HTTPException(status_code=404, detail="受眾不存在")
    audience.frequency = settings.frequency
    audience.channels = settings.channels
    return audience


@router.delete("/{audience_id}")
def delete_audience(audience_id: str) -> dict:
    if audience_id not in _audiences:
        raise HTTPException(status_code=404, detail="受眾不存在")
    del _audiences[audience_id]
    return {"deleted": audience_id}


@router.post("/{audience_id}/ad-channel", response_model=AdChannelResult)
def build_ad_audience(audience_id: str, req: AdBuildRequest) -> AdChannelResult:
    """建立廣告平台受眾(Meta/Google/LINE)。本期 mock,直接回完成 + 人數。"""
    if audience_id not in _audiences:
        raise HTTPException(status_code=404, detail="受眾不存在")
    count = mock_data.AD_CHANNEL_COUNTS.get(req.channel, 1500)
    return AdChannelResult(channel=req.channel, status="done", count=count, message="建立完成")


@router.post("/{audience_id}/push")
def send_push(audience_id: str, _payload: PushPayload) -> dict:
    """推播(EDM/SMS/LINE)。本期 mock,不實際發送。"""
    if audience_id not in _audiences:
        raise HTTPException(status_code=404, detail="受眾不存在")
    return {"ok": True}


@router.get("/{audience_id}/report", response_model=AudienceReport)
def get_audience_report(audience_id: str) -> AudienceReport:
    """受眾推播報表。本期 mock。"""
    if audience_id not in _audiences:
        raise HTTPException(status_code=404, detail="受眾不存在")
    return mock_data.build_audience_report()
