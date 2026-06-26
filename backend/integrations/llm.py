"""Claude API 接口：insight 潤飾 + Prompt 互動對話。

使用與 ga4_agent.py 相同的 Claude Agent SDK（重用 CLI 訂閱，不需 ANTHROPIC_API_KEY）。
- refine_insight：把規則計算結果潤飾成自然語言段落（分析報告用）。
- chat：多輪對話（PromptPage 用）。
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    TextBlock,
    UserMessage,
    query,
)

# 預設模型與 ga4_agent 共用同一個環境變數
DEFAULT_MODEL = os.environ.get("LLM_DEFAULT_MODEL", "claude-haiku-4-5-20251001")

# 重用既有 Claude Code CLI 認證
_DEFAULT_CLI = "/Applications/cmux.app/Contents/Resources/bin/claude"
_CLI_PATH = os.environ.get("CLAUDE_CLI_PATH") or (
    _DEFAULT_CLI if os.path.exists(_DEFAULT_CLI) else None
)

_INSIGHT_SYSTEM = """你是電商數據分析顧問，協助潤飾已計算完成的分析結果。
規則：
1. 一律繁體中文，語氣直接、實務導向，不使用 emoji。
2. 不重複引用原始數字，只提煉觀察與建議。
3. 段落簡潔，每段不超過 3 句。
4. 回覆只有純文字段落，不加 markdown 標題或列表。"""

_CHAT_SYSTEM = """你是 DEUS 電商數據助理，熟悉 Shopline、GA4、Google Ads、Meta 廣告等平台數據。
規則：
1. 一律繁體中文，語氣直接、不使用 emoji。
2. 回答具體、可操作，優先給行動建議而非分析框架。
3. 不確定的數據不猜測，說明需要哪些資料才能回答。"""


def _make_options(system_prompt: str, model: str) -> ClaudeAgentOptions:
    return ClaudeAgentOptions(
        model=model,
        system_prompt=system_prompt,
        permission_mode="bypassPermissions",
        cli_path=_CLI_PATH,
        max_turns=3,
    )


async def _run_conversation(
    messages: list[UserMessage | AssistantMessage],
    system_prompt: str,
    model: str,
) -> str:
    """核心 async 對話迴圈，收集所有 ResultMessage TextBlock 並回傳。"""
    result_text = ""
    async for event in query(messages=messages, options=_make_options(system_prompt, model)):
        if isinstance(event, ResultMessage):
            for block in event.content:
                if isinstance(block, TextBlock):
                    result_text += block.text
    return result_text.strip()


def _run_query(prompt: str, system_prompt: str, model: str) -> str:
    """單輪查詢的同步包裝。"""
    messages: list[UserMessage | AssistantMessage] = [
        UserMessage(content=[TextBlock(type="text", text=prompt)])
    ]
    return asyncio.run(_run_conversation(messages, system_prompt, model))


def refine_insight(section: str, computed: dict, model: str = DEFAULT_MODEL) -> str:
    """把規則計算結果交給 Claude 潤飾成自然語言段落。

    section: 對應分析報告區塊名稱（executive_summary / recommendations / conclusion）。
    computed: 規則計算後的數值結果 dict。
    """
    section_prompts = {
        "executive_summary": "請根據以下電商數據摘要，寫一段執行摘要（3 句以內）：",
        "recommendations": "請根據以下數據，提出 3 條具體、可操作的優化建議，每條一句：",
        "conclusion": "請根據以下數據，寫一段整體結論（2 句以內）：",
    }
    prefix = section_prompts.get(section, f"請潤飾以下 {section} 數據為自然語言段落：")
    prompt = f"{prefix}\n\n{computed}"
    try:
        return _run_query(prompt, _INSIGHT_SYSTEM, model)
    except Exception as exc:  # noqa: BLE001
        return f"[{section} 潤飾暫時無法取得] {exc}"


def chat(message: str, history: list[dict], model: str = DEFAULT_MODEL) -> str:
    """多輪對話：送出使用者訊息，回傳助理回覆。

    history: [{"role": "user"|"assistant", "content": str}, ...]
    """
    messages: list[UserMessage | AssistantMessage] = []
    for turn in history:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if role == "user":
            messages.append(UserMessage(content=[TextBlock(type="text", text=content)]))
        else:
            messages.append(AssistantMessage(content=[TextBlock(type="text", text=content)]))
    messages.append(UserMessage(content=[TextBlock(type="text", text=message)]))

    try:
        return asyncio.run(_run_conversation(messages, _CHAT_SYSTEM, model))
    except Exception as exc:  # noqa: BLE001
        return f"（Claude 回覆暫時無法取得：{exc}）"
