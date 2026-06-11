"""頁一:數據綁定 — 資料源綁定狀態與連線 stub。"""

from __future__ import annotations

from copy import deepcopy

from fastapi import APIRouter, Body

import mock_data
from integrations import oauth
from schemas import (
    BindingActionResult,
    ConnectPayload,
    DataSource,
    ShoplineKeyPayload,
)

router = APIRouter(prefix="/bindings", tags=["bindings"])

# 本期用記憶體保存綁定狀態(重啟即還原)。Phase 2 改持久化。
_sources: list[DataSource] = deepcopy(mock_data.DATA_SOURCES)
_shopline_status: BindingActionResult = BindingActionResult(
    source_id="shopline", status="disconnected", message="尚未綁定"
)


def _find(source_id: str) -> DataSource | None:
    return next((s for s in _sources if s.id == source_id), None)


@router.get("", response_model=list[DataSource])
def list_sources() -> list[DataSource]:
    """回傳 9 個資料源的綁定狀態。"""
    return _sources


@router.get("/shopline", response_model=BindingActionResult)
def get_shopline_status() -> BindingActionResult:
    return _shopline_status


@router.post("/shopline", response_model=BindingActionResult)
def bind_shopline(payload: ShoplineKeyPayload) -> BindingActionResult:
    """接收 Shopline access token。本期不真的驗證,標記為已連線。"""
    global _shopline_status
    ok = oauth.verify_shopline_token(payload.access_token)  # 本期一律 True(stub)
    _shopline_status = BindingActionResult(
        source_id="shopline",
        status="connected" if ok else "disconnected",
        message="已儲存並綁定(本期未實際驗證 token)" if ok else "token 無效",
    )
    return _shopline_status


@router.post("/{source_id}/connect", response_model=BindingActionResult)
def connect_source(
    source_id: str,
    payload: ConnectPayload = Body(default=ConnectPayload()),
) -> BindingActionResult:
    """綁定某資料源。oauth 類型走授權流程(stub);api_key 類型(如 Boxful)需帶 access_token。"""
    source = _find(source_id)
    if source is None:
        return BindingActionResult(
            source_id=source_id, status="disconnected", message="未知的資料源"
        )

    if source.auth_kind == "api_key":
        if not payload.access_token or not payload.access_token.strip():
            return BindingActionResult(
                source_id=source_id, status="disconnected", message="請提供 API Key"
            )
        source.status = "connected"
        source.account = "api-key-****"  # 本期不存實際 key
        return BindingActionResult(
            source_id=source_id,
            status="connected",
            message="已儲存 API Key 並綁定(本期未實際驗證)",
        )

    flow = oauth.start_flow(source_id)  # stub:authorize_url 為 None
    source.status = "connected"
    source.account = "demo-account"
    return BindingActionResult(
        source_id=source_id, status="connected", message=flow["message"]
    )


@router.post("/{source_id}/disconnect", response_model=BindingActionResult)
def disconnect_source(source_id: str) -> BindingActionResult:
    source = _find(source_id)
    if source is None:
        return BindingActionResult(
            source_id=source_id, status="disconnected", message="未知的資料源"
        )
    source.status = "disconnected"
    source.account = None
    return BindingActionResult(
        source_id=source_id, status="disconnected", message="已解除綁定"
    )
