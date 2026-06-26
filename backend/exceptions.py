"""集中異常處理工具，避免各 router 重複 HTTPException 樣板。"""

from typing import NoReturn

from fastapi import HTTPException


def not_found(resource: str) -> NoReturn:
    raise HTTPException(status_code=404, detail=f"{resource}不存在")
