"""GA4 自然語言查詢 — 多模型(Claude / Gemini)+ analytics-mcp 整合。

流程:收到使用者一句自然語言 -> 依 model 分流給 Claude(claude-agent-sdk)或
Gemini(google-genai)-> 模型掛同一個官方 GA4 MCP server(analytics-mcp)、
自行決定呼叫 run_report 等工具 -> 取回資料。對外只暴露 async run_ga4_query(text, model)。

設計重點(對齊計畫):
  - 數字由「程式」掌握:攔截 run_report 的工具結果(GA4 proto_to_dict,snake_case),
    由程式組表格與圖表數值,不要求模型重打數字(避免幻覺/截斷)。
  - 敘述與圖表意圖由「模型」掌握:模型在回覆結尾輸出一小段 JSON
    {narrative, chart:{type,x,series}}。
  - 認證:GA4 走 ADC(GOOGLE_APPLICATION_CREDENTIALS 指向 authorized_user JSON);
    Claude 走既有 Claude Code CLI(cli_path 釘住,重用訂閱)。

對外只暴露 async run_ga4_query(text) -> dict。
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

from dotenv import find_dotenv, load_dotenv

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    TextBlock,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
    query,
)

# 載入中央 .env(Projects 根目錄)。GA4_DOTENV_PATH 可覆寫。
load_dotenv(os.environ.get("GA4_DOTENV_PATH") or find_dotenv(usecwd=True))

PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "378552427")
GOOGLE_APPLICATION_CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
GOOGLE_PROJECT_ID = os.environ.get(
    "GOOGLE_PROJECT_ID", os.environ.get("GOOGLE_CLOUD_PROJECT", "")
)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# 預設模型:Haiku(降 token 成本)。前端可切 Claude 各型號或 Gemini。可用 LLM_DEFAULT_MODEL 覆寫。
DEFAULT_MODEL = os.environ.get("LLM_DEFAULT_MODEL", "claude-haiku-4-5-20251001")

# analytics-mcp console script 與後端 venv 同目錄,用絕對路徑避免 PATH 依賴。
_MCP_COMMAND = str(Path(sys.executable).parent / "analytics-mcp")
# Claude 與 Gemini 兩條路徑共用同一個 MCP server 與 GA4 認證環境變數。
_MCP_ENV = {
    "GOOGLE_APPLICATION_CREDENTIALS": GOOGLE_APPLICATION_CREDENTIALS,
    "GOOGLE_PROJECT_ID": GOOGLE_PROJECT_ID,
}

# 重用既有 Claude Code CLI 認證(訂閱)。可用 CLAUDE_CLI_PATH 覆寫;找不到則讓 SDK 自行尋找。
_DEFAULT_CLI = "/Applications/cmux.app/Contents/Resources/bin/claude"
_CLI_PATH = os.environ.get("CLAUDE_CLI_PATH") or (
    _DEFAULT_CLI if os.path.exists(_DEFAULT_CLI) else None
)

# 精簡工具清單以減少每輪送出的工具 schema(降 token);留查詢與解析自訂維度指標所需。
_GA4_TOOLS = [
    "run_report",
    "run_realtime_report",
    "get_custom_dimensions_and_metrics",
    "get_property_details",
]
ALLOWED_TOOLS = [f"mcp__ga4__{t}" for t in _GA4_TOOLS]

SYSTEM_PROMPT = f"""你是 GA4 數據分析助理,透過 GA4 MCP 工具查詢 Google Analytics 4 資料並回答問題。

規則:
1. 一律針對 GA4 property {PROPERTY_ID} 查詢,除非使用者明確指定其他 property。
2. 依使用者問題自行選擇合適的維度(dimensions)、指標(metrics)與日期範圍,呼叫
   run_report(即時數據用 run_realtime_report)。日期可用相對值如 7daysAgo、yesterday、today。
3. 一律以繁體中文回答,語氣直接、實務導向,不使用 emoji。
4. 取得資料後,先用一段文字說明重點觀察。
5. 回覆的「最後」務必附上一個 JSON 區塊(用 ```json 包起來),格式如下:
   {{"narrative": "你的中文文字說明", "chart": {{"type": "line", "x": "date", "series": ["sessions"]}}}}
   - narrative:你的文字說明(會顯示給使用者)。
   - chart:建議的圖表;type 為 "line" 或 "bar";x 是要當水平軸的維度名稱;
     series 是要畫的指標名稱陣列。x 與 series 的名稱必須與你查詢時用的維度/指標名稱一致。
   - 若不適合畫圖(例如單一數值或非時間序列),chart 設為 null。
   - JSON 內不要重複貼上整張數據表的數字,表格由系統自動從查詢結果產生。
"""


def _options(model: str) -> ClaudeAgentOptions:
    return ClaudeAgentOptions(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        mcp_servers={
            "ga4": {
                "type": "stdio",
                "command": _MCP_COMMAND,
                "args": [],
                "env": _MCP_ENV,
            }
        },
        allowed_tools=ALLOWED_TOOLS,
        permission_mode="bypassPermissions",
        cli_path=_CLI_PATH,
        max_turns=6,
    )


def _result_to_dict(content: Any) -> dict | None:
    """把 ToolResultBlock.content 還原成 dict。content 可能是 str 或 [{type,text}]。"""
    raw = None
    if isinstance(content, str):
        raw = content
    elif isinstance(content, list):
        for blk in content:
            if isinstance(blk, dict) and blk.get("type") == "text":
                raw = blk.get("text")
                break
            if isinstance(blk, str):
                raw = blk
                break
    elif isinstance(content, dict):
        return content
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None
    if not isinstance(parsed, dict):
        return None
    # analytics-mcp 把回傳包在 {"result": {...}} 一層,拆開取內層。
    inner = parsed.get("result")
    return inner if isinstance(inner, dict) else parsed


def _build_table(report: dict) -> dict | None:
    """把 GA4 run_report 結果(snake_case proto_to_dict)攤平成表格。"""
    if not report or "rows" not in report:
        return None
    dim_headers = [h.get("name") for h in report.get("dimension_headers", [])]
    metric_headers = [h.get("name") for h in report.get("metric_headers", [])]
    # proto_to_dict 把保留字 type 輸出成 type_;兩者都接。
    metric_types = {
        h.get("name"): h.get("type_") or h.get("type")
        for h in report.get("metric_headers", [])
    }
    columns = dim_headers + metric_headers
    rows: list[dict] = []
    for r in report.get("rows", []):
        dim_vals = [d.get("value") for d in r.get("dimension_values", [])]
        met_vals = [m.get("value") for m in r.get("metric_values", [])]
        rows.append(dict(zip(columns, dim_vals + met_vals)))
    return {"columns": columns, "rows": rows, "metric_types": metric_types}


def _extract_json_block(text: str) -> dict | None:
    """從模型最終文字中抓出 ```json ... ``` 區塊。"""
    if not text:
        return None
    matches = re.findall(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    if not matches:
        matches = re.findall(r"(\{[^{}]*\"narrative\"[^{}]*\})", text, re.DOTALL)
    for m in reversed(matches):
        try:
            return json.loads(m)
        except json.JSONDecodeError:
            continue
    return None


def _strip_json_block(text: str) -> str:
    return re.sub(r"```json\s*\{.*?\}\s*```", "", text, flags=re.DOTALL).strip()


async def run_ga4_query(text: str, model: str | None = None) -> dict:
    """執行一次自然語言 GA4 查詢,依 model 分流到 Claude 或 Gemini。

    回傳 {narrative, table, chart, error}。未知或空 model 退回預設 Haiku。
    """
    model = (model or DEFAULT_MODEL).strip()
    if model.startswith("gemini"):
        return await _run_gemini(text, model)
    if not model.startswith("claude"):
        model = DEFAULT_MODEL
    return await _run_claude(text, model)


async def _run_claude(text: str, model: str) -> dict:
    """Claude 路徑:claude-agent-sdk 驅動,攔截 tool_result 組表格。"""
    assistant_text: list[str] = []
    last_report: dict | None = None
    tool_errors: list[str] = []

    try:
        async for msg in query(prompt=text, options=_options(model)):
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        assistant_text.append(block.text)
                    elif isinstance(block, ToolUseBlock):
                        pass  # 工具輸入暫不需要;表格由結果還原
            elif isinstance(msg, UserMessage):
                content = msg.content
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, ToolResultBlock):
                            parsed = _result_to_dict(block.content)
                            if block.is_error:
                                tool_errors.append(str(block.content)[:500])
                            elif parsed and "rows" in parsed:
                                last_report = parsed
            elif isinstance(msg, ResultMessage):
                if msg.is_error and not assistant_text:
                    tool_errors.append(str(msg.result or "agent error")[:500])
    except Exception as exc:  # noqa: BLE001 — 對外回可讀錯誤,不讓伺服器掛掉
        return _error_response(f"查詢執行失敗:{exc}")

    full_text = "\n".join(assistant_text).strip()
    return _assemble(full_text, last_report, _summarize_errors(tool_errors))


async def _run_gemini(text: str, model: str) -> dict:
    """Gemini 路徑:google-genai + 同一個 analytics-mcp,手動函式呼叫迴圈。

    不把 live MCP session 當 tool 傳入(genai 會深拷貝 config 而 session 含 asyncio
    Future 無法拷貝)。改用 genai 的 mcp_to_gemini_tool 把工具轉成可拷貝的宣告,
    自己跑迴圈:Gemini 出 function_call -> 用 session 執行 -> 把結果回灌 -> 直到出最終文字。
    """
    if not GEMINI_API_KEY:
        return _error_response(
            "尚未設定 GEMINI_API_KEY,無法使用 Gemini。請在 .env 填入後重啟後端。"
        )
    from google import genai
    from google.genai import types as gtypes
    from google.genai._mcp_utils import mcp_to_gemini_tool
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    params = StdioServerParameters(
        command=_MCP_COMMAND, args=[], env={**os.environ, **_MCP_ENV}
    )
    client = genai.Client(api_key=GEMINI_API_KEY)

    try:
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                listed = await session.list_tools()
                wanted = set(_GA4_TOOLS)
                gemini_tools = [
                    mcp_to_gemini_tool(t) for t in listed.tools if t.name in wanted
                ]
                config = gtypes.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    tools=gemini_tools,
                    temperature=0,
                    automatic_function_calling=gtypes.AutomaticFunctionCallingConfig(
                        disable=True
                    ),
                )
                contents: list = [
                    gtypes.Content(role="user", parts=[gtypes.Part(text=text)])
                ]
                full_text = ""
                report: dict | None = None
                for _ in range(6):
                    resp = await client.aio.models.generate_content(
                        model=model, contents=contents, config=config
                    )
                    cand = (resp.candidates or [None])[0]
                    parts = (cand.content.parts if cand and cand.content else None) or []
                    calls = [p.function_call for p in parts if getattr(p, "function_call", None)]
                    if not calls:
                        full_text = (getattr(resp, "text", None) or "").strip()
                        break
                    contents.append(cand.content)  # 模型這輪(含 function_call)
                    tool_parts = []
                    for fc in calls:
                        try:
                            result = await session.call_tool(fc.name, dict(fc.args or {}))
                            payload = _mcp_call_result_to_dict(result)
                        except Exception as exc:  # noqa: BLE001
                            payload = {"error": str(exc)}
                        found = _find_report_dict(payload)
                        if found:
                            report = found
                        tool_parts.append(
                            gtypes.Part.from_function_response(
                                name=fc.name, response=payload
                            )
                        )
                    contents.append(gtypes.Content(role="user", parts=tool_parts))
    except Exception as exc:  # noqa: BLE001
        return _error_response(_gemini_error_message(exc))

    return _assemble(full_text, report, None)


def _gemini_error_message(exc: BaseException) -> str:
    """把(可能巢狀的)ExceptionGroup 攤平成可讀訊息,並對常見錯誤給說明。"""
    leaves: list[BaseException] = []

    def collect(x: BaseException) -> None:
        subs = getattr(x, "exceptions", None)
        if subs:
            for s in subs:
                collect(s)
        else:
            leaves.append(x)

    collect(exc)
    msg = "; ".join(str(x) for x in leaves) if leaves else str(exc)
    low = msg.lower()
    if "429" in msg or "resource_exhausted" in low or "quota" in low:
        return (
            "Gemini 配額不足(429):此金鑰免費額度已用盡,或該模型(如 Pro)免費層不支援。"
            "請到 Google AI Studio 啟用帳單,或改用 Gemini 2.5 Flash。"
        )
    if "404" in msg or "not found" in low:
        return "Gemini 找不到此模型:請確認 model id 正確且你的金鑰有權限使用。"
    if "401" in msg or "403" in msg or "api key" in low or "permission" in low:
        return "Gemini 金鑰無效或無權限:請檢查 .env 的 GEMINI_API_KEY。"
    return f"Gemini 查詢失敗:{msg[:300]}"


def _mcp_call_result_to_dict(result: Any) -> dict:
    """把 mcp CallToolResult 取成 dict:優先 structuredContent,否則解析文字內容。"""
    sc = getattr(result, "structuredContent", None)
    if isinstance(sc, dict):
        return sc
    for c in getattr(result, "content", None) or []:
        txt = getattr(c, "text", None)
        if txt:
            try:
                parsed = json.loads(txt)
                return parsed if isinstance(parsed, dict) else {"result": parsed}
            except (json.JSONDecodeError, ValueError):
                return {"text": txt}
    return {}


def _assemble(full_text: str, report: dict | None, error_hint: str | None) -> dict:
    """兩條路徑共用:由文字解析敘述/圖表規格,由 report 組表格。"""
    spec = _extract_json_block(full_text) or {}
    narrative = spec.get("narrative") or _strip_json_block(full_text) or "（無回覆內容）"
    table = _build_table(report) if report else None
    chart = _validate_chart(spec.get("chart"), table)

    error = None
    if table is None and not full_text:
        error = error_hint or "查無資料或工具未回傳結果。"
    return {"narrative": narrative, "table": table, "chart": chart, "error": error}


def _find_report_dict(obj: Any) -> dict | None:
    """在任意巢狀結構中找出第一個 GA4 報表 dict(含 rows + headers)。也拆 JSON 字串。"""
    if isinstance(obj, dict):
        if "rows" in obj and ("dimension_headers" in obj or "metric_headers" in obj):
            return obj
        for v in obj.values():
            found = _find_report_dict(v)
            if found:
                return found
    elif isinstance(obj, list):
        for v in obj:
            found = _find_report_dict(v)
            if found:
                return found
    elif isinstance(obj, str):
        try:
            return _find_report_dict(json.loads(obj))
        except (json.JSONDecodeError, ValueError):
            return None
    return None




def _validate_chart(chart: Any, table: dict | None) -> dict | None:
    """確保 chart 規格的 x/series 都存在於表格欄位,否則不畫。"""
    if not isinstance(chart, dict) or table is None:
        return None
    x = chart.get("x")
    series = chart.get("series")
    ctype = chart.get("type", "line")
    if ctype not in ("line", "bar"):
        ctype = "line"
    cols = set(table["columns"])
    if x not in cols or not isinstance(series, list):
        return None
    series = [s for s in series if s in cols]
    if not series:
        return None
    return {"type": ctype, "x": x, "series": series}


def _summarize_errors(tool_errors: list[str]) -> str | None:
    if not tool_errors:
        return None
    joined = " ".join(tool_errors)
    if "PERMISSION_DENIED" in joined or "403" in joined:
        return "GA4 拒絕存取:目前身分未被授權存取該 property,請確認憑證帳號已被加入 property 存取權。"
    if "invalid_grant" in joined or "expired" in joined.lower():
        return "GA4 憑證已失效,請重新授權(執行 ga4/reauth_adc.py)。"
    return f"GA4 工具回報錯誤:{joined[:300]}"


def _error_response(message: str) -> dict:
    return {"narrative": message, "table": None, "chart": None, "error": message}
