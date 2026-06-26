"""GA4 查詢歷史的檔案持久化儲存。

用單一 JSON 檔落地(backend/data/ga4_history.json),重啟 uvicorn 不會消失,
也不依賴瀏覽器 localStorage,可跨裝置(同一後端)共用。
單人本機規模,用 threading.Lock 確保並發寫入安全;規模變大再換 DB。
"""

from __future__ import annotations

import json
import threading
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_FILE = _DATA_DIR / "ga4_history.json"
_MAX = 200  # 上限,避免檔案無限膨脹
_lock = threading.Lock()


def _read() -> list[dict]:
    if not _FILE.exists():
        return []
    try:
        data = json.loads(_FILE.read_text(encoding="utf-8") or "[]")
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _write(items: list[dict]) -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    _FILE.write_text(
        json.dumps(items[:_MAX], ensure_ascii=False, indent=2), encoding="utf-8"
    )


def list_entries() -> list[dict]:
    with _lock:
        return _read()


def add_entry(entry: dict) -> dict:
    with _lock:
        items = _read()
        items.insert(0, entry)  # 最新在前
        _write(items)
    return entry


def delete_entry(entry_id: str) -> None:
    with _lock:
        items = [e for e in _read() if e.get("id") != entry_id]
        _write(items)


def clear() -> None:
    with _lock:
        _write([])
