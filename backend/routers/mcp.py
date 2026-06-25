"""MCP 設定 — MCP server 清單 CRUD。

Phase 2 可實際探測連線狀態並寫入 .claude/settings.json。
"""

from __future__ import annotations

from fastapi import APIRouter

from db import db
from exceptions import not_found
from schemas import McpServer, McpServerCreate

router = APIRouter(prefix="/mcp", tags=["mcp"])


def _row_to_server(row: dict) -> McpServer:
    row["enabled"] = bool(row["enabled"])
    return McpServer(**row)


@router.get("/servers", response_model=list[McpServer])
def list_servers() -> list[McpServer]:
    return [_row_to_server(r) for r in db.list_servers()]


@router.post("/servers", response_model=McpServer)
def create_server(payload: McpServerCreate) -> McpServer:
    row = db.create_server(payload.model_dump())
    return _row_to_server(row)


@router.put("/servers/{server_id}", response_model=McpServer)
def update_server(server_id: int, payload: McpServerCreate) -> McpServer:
    row = db.update_server(server_id, payload.model_dump())
    if row is None:
        not_found("MCP server")
    return _row_to_server(row)


@router.delete("/servers/{server_id}")
def delete_server(server_id: int) -> dict:
    if not db.delete_server(server_id):
        not_found("MCP server")
    return {"deleted": server_id}
