"""SQLite 輕量持久化層。

取代各 router 的記憶體全域字典，重啟後資料仍存在。
Phase 2 遷 BigQuery 後，此檔可整個移除或留作快取層。

使用方式：
    from db import db
    db.save_report(report)
    db.get_report("r001")
    db.list_reports()
    db.delete_report("r001")
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).parent / "data" / "deus.db"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS reports (
            id      TEXT PRIMARY KEY,
            name    TEXT NOT NULL,
            sources TEXT NOT NULL DEFAULT '[]',
            updated_at TEXT NOT NULL,
            frequency  TEXT NOT NULL DEFAULT '手動',
            model      TEXT NOT NULL DEFAULT 'claude-opus-4-8',
            prompt     TEXT
        );

        CREATE TABLE IF NOT EXISTS audiences (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            method     TEXT NOT NULL,
            count      INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            frequency  TEXT NOT NULL DEFAULT '手動',
            channels   TEXT NOT NULL DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS monitor_rules (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            metric      TEXT NOT NULL,
            comparator  TEXT NOT NULL,
            threshold   REAL NOT NULL,
            notify      TEXT NOT NULL,
            enabled     INTEGER NOT NULL DEFAULT 1,
            created_at  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS mcp_servers (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT NOT NULL,
            command TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            status  TEXT NOT NULL DEFAULT 'offline'
        );
    """)
    conn.commit()


def _deserialize_row(row: sqlite3.Row, *json_fields: str) -> dict:
    """將 sqlite3.Row 轉為 dict，並把指定欄位從 JSON 字串反序列化。"""
    d = dict(row)
    for field in json_fields:
        if field in d:
            d[field] = json.loads(d[field])
    return d


class _DB:
    def __init__(self) -> None:
        self._conn = _connect()
        _init_schema(self._conn)

    def _exec(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        return self._conn.execute(sql, params)

    def _commit(self) -> None:
        self._conn.commit()

    # ── Reports ──────────────────────────────────────────────────────────────

    def list_reports(self) -> list[dict]:
        rows = self._exec("SELECT * FROM reports ORDER BY updated_at DESC").fetchall()
        return [self._report_row(r) for r in rows]

    def get_report(self, report_id: str) -> dict | None:
        row = self._exec("SELECT * FROM reports WHERE id=?", (report_id,)).fetchone()
        return self._report_row(row) if row else None

    def save_report(self, report: dict) -> None:
        self._exec(
            """INSERT OR REPLACE INTO reports
               (id, name, sources, updated_at, frequency, model, prompt)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                report["id"],
                report["name"],
                json.dumps(report.get("sources", []), ensure_ascii=False),
                report.get("updated_at", datetime.now().strftime("%Y-%m-%d %H:%M")),
                report.get("frequency", "手動"),
                report.get("model", "claude-opus-4-8"),
                report.get("prompt"),
            ),
        )
        self._commit()

    def delete_report(self, report_id: str) -> bool:
        cur = self._exec("DELETE FROM reports WHERE id=?", (report_id,))
        self._commit()
        return cur.rowcount > 0

    def _report_row(self, row: sqlite3.Row) -> dict:
        return _deserialize_row(row, "sources")

    # ── Audiences ─────────────────────────────────────────────────────────────

    def list_audiences(self) -> list[dict]:
        rows = self._exec("SELECT * FROM audiences ORDER BY created_at DESC").fetchall()
        return [self._audience_row(r) for r in rows]

    def get_audience(self, audience_id: str) -> dict | None:
        row = self._exec("SELECT * FROM audiences WHERE id=?", (audience_id,)).fetchone()
        return self._audience_row(row) if row else None

    def save_audience(self, audience: dict) -> None:
        self._exec(
            """INSERT OR REPLACE INTO audiences
               (id, name, method, count, created_at, frequency, channels)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                audience["id"],
                audience["name"],
                audience["method"],
                audience.get("count", 0),
                audience.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M")),
                audience.get("frequency", "手動"),
                json.dumps(audience.get("channels", []), ensure_ascii=False),
            ),
        )
        self._commit()

    def delete_audience(self, audience_id: str) -> bool:
        cur = self._exec("DELETE FROM audiences WHERE id=?", (audience_id,))
        self._commit()
        return cur.rowcount > 0

    def _audience_row(self, row: sqlite3.Row) -> dict:
        return _deserialize_row(row, "channels")

    # ── Monitor Rules ─────────────────────────────────────────────────────────

    def list_rules(self) -> list[dict]:
        rows = self._exec("SELECT * FROM monitor_rules ORDER BY id").fetchall()
        return [dict(r) for r in rows]

    def get_rule(self, rule_id: int) -> dict | None:
        row = self._exec("SELECT * FROM monitor_rules WHERE id=?", (rule_id,)).fetchone()
        return dict(row) if row else None

    def create_rule(self, rule: dict) -> dict:
        cur = self._exec(
            """INSERT INTO monitor_rules
               (metric, comparator, threshold, notify, enabled, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                rule["metric"],
                rule["comparator"],
                rule["threshold"],
                rule["notify"],
                int(rule.get("enabled", True)),
                datetime.now().isoformat(),
            ),
        )
        self._commit()
        return self.get_rule(cur.lastrowid)  # type: ignore[arg-type]

    def update_rule(self, rule_id: int, rule: dict) -> dict | None:
        self._exec(
            """UPDATE monitor_rules
               SET metric=?, comparator=?, threshold=?, notify=?, enabled=?
               WHERE id=?""",
            (
                rule["metric"],
                rule["comparator"],
                rule["threshold"],
                rule["notify"],
                int(rule.get("enabled", True)),
                rule_id,
            ),
        )
        self._commit()
        return self.get_rule(rule_id)

    def delete_rule(self, rule_id: int) -> bool:
        cur = self._exec("DELETE FROM monitor_rules WHERE id=?", (rule_id,))
        self._commit()
        return cur.rowcount > 0

    # ── MCP Servers ───────────────────────────────────────────────────────────

    def list_servers(self) -> list[dict]:
        rows = self._exec("SELECT * FROM mcp_servers ORDER BY id").fetchall()
        return [dict(r) for r in rows]

    def get_server(self, server_id: int) -> dict | None:
        row = self._exec("SELECT * FROM mcp_servers WHERE id=?", (server_id,)).fetchone()
        return dict(row) if row else None

    def create_server(self, server: dict) -> dict:
        cur = self._exec(
            """INSERT INTO mcp_servers (name, command, enabled, status)
               VALUES (?, ?, ?, 'offline')""",
            (server["name"], server["command"], int(server.get("enabled", True))),
        )
        self._commit()
        return self.get_server(cur.lastrowid)  # type: ignore[arg-type]

    def update_server(self, server_id: int, server: dict) -> dict | None:
        self._exec(
            "UPDATE mcp_servers SET name=?, command=?, enabled=? WHERE id=?",
            (server["name"], server["command"], int(server.get("enabled", True)), server_id),
        )
        self._commit()
        return self.get_server(server_id)

    def delete_server(self, server_id: int) -> bool:
        cur = self._exec("DELETE FROM mcp_servers WHERE id=?", (server_id,))
        self._commit()
        return cur.rowcount > 0

    def seed_defaults(self) -> None:
        """首次啟動時寫入預設種子資料（已有資料則跳過）。"""
        if not self._exec("SELECT 1 FROM mcp_servers LIMIT 1").fetchone():
            for name, command in [
                ("filesystem", "npx -y @modelcontextprotocol/server-filesystem"),
                ("firecrawl", "npx -y firecrawl-mcp"),
            ]:
                self.create_server({"name": name, "command": command, "enabled": True})

        if not self._exec("SELECT 1 FROM monitor_rules LIMIT 1").fetchone():
            self.create_rule({
                "metric": "roas",
                "comparator": "lt",
                "threshold": 2.0,
                "notify": "email",
                "enabled": True,
            })


# 單例，整個後端共用同一個連線
db = _DB()
db.seed_defaults()
