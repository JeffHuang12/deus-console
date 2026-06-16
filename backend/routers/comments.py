"""留言管理 — 列表與多選自動回覆。

本期全為 mock:回覆不實際送出,Phase 2 接各平台留言 API 與 LLM 產生回覆。
"""

from __future__ import annotations

from fastapi import APIRouter

import mock_data
from schemas import Comment, CommentReplyRequest

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("", response_model=list[Comment])
def list_comments() -> list[Comment]:
    return mock_data.MOCK_COMMENTS


@router.post("/reply")
def reply_comments(req: CommentReplyRequest) -> dict:
    """對選取的留言自動回覆。本期 mock,只回成功數量。"""
    return {"replied": len(req.ids)}
