"""集中異常處理工具，避免各 router 重複 HTTPException 樣板。"""

from fastapi import HTTPException


def not_found(resource: str) -> None:
    raise HTTPException(status_code=404, detail=f"{resource}不存在")
