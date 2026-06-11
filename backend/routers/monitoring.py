"""頁三:監測中心 — 監測規則 CRUD。

本期用記憶體暫存(重啟即還原)。Phase 2 改持久化,並由排程定時讀 BigQuery 比對門檻後告警。
"""

from __future__ import annotations

from datetime import datetime
from itertools import count

from fastapi import APIRouter, HTTPException

from schemas import MonitorRule, MonitorRuleCreate

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

_rules: dict[int, MonitorRule] = {}
_id_seq = count(1)


def _seed() -> None:
    """放一筆範例規則,方便前端一進頁面就看到列表。"""
    rid = next(_id_seq)
    _rules[rid] = MonitorRule(
        id=rid,
        metric="roas",
        comparator="lt",
        threshold=2.0,
        notify="email",
        enabled=True,
        created_at=datetime.now(),
    )


_seed()


@router.get("/rules", response_model=list[MonitorRule])
def list_rules() -> list[MonitorRule]:
    return list(_rules.values())


@router.post("/rules", response_model=MonitorRule)
def create_rule(payload: MonitorRuleCreate) -> MonitorRule:
    rid = next(_id_seq)
    rule = MonitorRule(id=rid, created_at=datetime.now(), **payload.model_dump())
    _rules[rid] = rule
    return rule


@router.put("/rules/{rule_id}", response_model=MonitorRule)
def update_rule(rule_id: int, payload: MonitorRuleCreate) -> MonitorRule:
    if rule_id not in _rules:
        raise HTTPException(status_code=404, detail="規則不存在")
    existing = _rules[rule_id]
    updated = MonitorRule(
        id=rule_id, created_at=existing.created_at, **payload.model_dump()
    )
    _rules[rule_id] = updated
    return updated


@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int) -> dict:
    if rule_id not in _rules:
        raise HTTPException(status_code=404, detail="規則不存在")
    del _rules[rule_id]
    return {"deleted": rule_id}
