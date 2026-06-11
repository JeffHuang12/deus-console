"""集中的 BigQuery 查詢層。

★ 第一階段(本期)為 stub。分析中心與監測中心最終的資料皆從 BigQuery 讀取。
Phase 2:用 google-cloud-bigquery,專案/dataset 從 Projects/.env 讀
(GOOGLE_CLOUD_PROJECT、BIGQUERY_DATASET、GOOGLE_APPLICATION_CREDENTIALS)。
"""

from __future__ import annotations

from typing import Any


def query(sql: str) -> list[dict[str, Any]]:
    """執行 BigQuery SQL 並回傳 row dict 清單。

    本期未接,呼叫即拋錯以避免誤用;分析/監測 router 現階段改讀 mock_data。
    """
    # TODO Phase 2: 初始化 bigquery.Client() 並回傳 [dict(row) for row in client.query(sql)]。
    raise NotImplementedError("BigQuery 查詢層尚未接通(Phase 2)。")
