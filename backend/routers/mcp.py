"""頁四:MCP 設定 — MCP server 清單 CRUD。

本期用記憶體暫存。Phase 2 寫入設定檔(如 .claude/settings.json 或專屬設定),並可實際探測連線狀態。
"""

from __future__ import annotations

from itertools import count

from fastapi import APIRouter, HTTPException

from schemas import McpServer, McpServerCreate

router = APIRouter(prefix="/mcp", tags=["mcp"])

_servers: dict[int, McpServer] = {}
_id_seq = count(1)


def _seed() -> None:
    for name, command in [
        ("filesystem", "npx -y @modelcontextprotocol/server-filesystem"),
        ("firecrawl", "npx -y firecrawl-mcp"),
    ]:
        sid = next(_id_seq)
        _servers[sid] = McpServer(id=sid, name=name, command=command, enabled=True, status="offline")


_seed()


@router.get("/servers", response_model=list[McpServer])
def list_servers() -> list[McpServer]:
    return list(_servers.values())


@router.post("/servers", response_model=McpServer)
def create_server(payload: McpServerCreate) -> McpServer:
    sid = next(_id_seq)
    server = McpServer(id=sid, status="offline", **payload.model_dump())
    _servers[sid] = server
    return server


@router.put("/servers/{server_id}", response_model=McpServer)
def update_server(server_id: int, payload: McpServerCreate) -> McpServer:
    if server_id not in _servers:
        raise HTTPException(status_code=404, detail="MCP server 不存在")
    existing = _servers[server_id]
    updated = McpServer(id=server_id, status=existing.status, **payload.model_dump())
    _servers[server_id] = updated
    return updated


@router.delete("/servers/{server_id}")
def delete_server(server_id: int) -> dict:
    if server_id not in _servers:
        raise HTTPException(status_code=404, detail="MCP server 不存在")
    del _servers[server_id]
    return {"deleted": server_id}
