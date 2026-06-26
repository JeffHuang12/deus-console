"""監測中心 — 監測規則 CRUD。

Phase 2 改由排程定時讀 BigQuery 比對門檻後告警。
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from db import db
from exceptions import not_found
from schemas import MonitorRule, MonitorRuleCreate

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


def _row_to_rule(row: dict) -> MonitorRule:
    row["enabled"] = bool(row["enabled"])
    return MonitorRule(**row)


@router.get("/rules", response_model=list[MonitorRule])
def list_rules() -> list[MonitorRule]:
    return [_row_to_rule(r) for r in db.list_rules()]


@router.post("/rules", response_model=MonitorRule)
def create_rule(payload: MonitorRuleCreate) -> MonitorRule:
    row = db.create_rule(payload.model_dump())
    return _row_to_rule(row)


@router.put("/rules/{rule_id}", response_model=MonitorRule)
def update_rule(rule_id: int, payload: MonitorRuleCreate) -> MonitorRule:
    row = db.update_rule(rule_id, payload.model_dump())
    if row is None:
        not_found("規則")
    return _row_to_rule(row)


@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int) -> dict:
    if not db.delete_rule(rule_id):
        not_found("規則")
    return {"deleted": rule_id}
