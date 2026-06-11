"""Claude API 接口(insight 潤飾 + Prompt 互動)。

★ 第一階段(本期)為 stub。
分析中心採混合策略:規則計算的數據結果交給 Claude API 潤飾成執行摘要、優化建議、總結。
Prompt 互動頁(頁五)亦由此送出對話。

Phase 2:用 anthropic SDK,model 預設 claude-opus-4-8,並開啟 prompt caching。
"""

from __future__ import annotations


def refine_insight(section: str, computed: dict) -> str:
    """把規則計算結果交給 Claude 潤飾成自然語言段落。

    本期回傳 stub 文字,直接沿用傳入內容或標註待潤飾。
    """
    # TODO Phase 2: 呼叫 Claude API,把 computed 餵進 prompt,回傳潤飾後文字。
    return f"[{section} 待 Claude API 潤飾] {computed}"


def chat(message: str, history: list[dict]) -> str:
    """頁五 Prompt 互動:送出使用者訊息,回傳助理回覆。

    本期回固定 stub 回覆。
    """
    # TODO Phase 2: 呼叫 Claude API(含 history、系統提示、必要時掛 MCP 工具)。
    return (
        "（這是第一階段的示範回覆,Claude API 尚未接通。）\n"
        f"你說:「{message}」。Phase 2 接上後,這裡會回傳真正的分析對話結果。"
    )
