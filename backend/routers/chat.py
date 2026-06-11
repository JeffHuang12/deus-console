"""頁五:Prompt 互動 — 聊天 stub。

本期回固定示範回覆。Phase 2 交給 integrations/llm.chat()(Claude API,可掛 MCP 工具)。
"""

from __future__ import annotations

from fastapi import APIRouter

from integrations import llm
from schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    history = [m.model_dump() for m in req.history]
    reply = llm.chat(req.message, history)  # 本期為 stub 回覆
    return ChatResponse(reply=reply)
