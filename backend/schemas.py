"""Pydantic 資料模型。

本期(第一階段)僅定義 API 進出的資料形狀,供前端骨架對接。
實際串接(OAuth、BigQuery、Claude API)於 Phase 2 補上,模型可沿用或擴充。
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

# --- 頁一:數據綁定 ---

ConnectionStatus = Literal["connected", "disconnected"]
AuthKind = Literal["api_key", "oauth"]


class DataSource(BaseModel):
    """單一資料源的綁定狀態。"""

    id: str  # 例如 "meta_ads"、"ga4"
    name: str  # 顯示名稱,例如 "Meta 廣告"
    auth_kind: AuthKind  # api_key 走輸入框,oauth 走授權流程
    status: ConnectionStatus = "disconnected"
    account: Optional[str] = None  # 已連線時顯示的帳號/資源識別


class ShoplineKeyPayload(BaseModel):
    """頁一 Shopline API Key 輸入。"""

    access_token: str = Field(..., min_length=1, description="Shopline access token")


class BindingActionResult(BaseModel):
    """綁定/測試連線後回傳的結果。"""

    source_id: str
    status: ConnectionStatus
    message: str


class ConnectPayload(BaseModel):
    """綁定資料源時的選用內容。api_key 類型(如 Boxful)會帶 access_token。"""

    access_token: Optional[str] = None


# --- 頁二:分析中心 ---


class Kpi(BaseModel):
    label: str
    value: str
    delta_pct: Optional[float] = None  # 與前期相比的變化百分比


class FunnelStage(BaseModel):
    stage: str
    value: int


class TimePoint(BaseModel):
    date: str  # YYYY-MM-DD
    value: float


class DayHighlight(BaseModel):
    date: str
    metric: str
    value: float
    kind: Literal["best", "anomaly"]
    note: str


# 分析中心控制項
DatePreset = Literal["last_7d", "last_14d", "last_week", "this_month", "last_month", "custom"]
CompareMode = Literal["prev_period", "yoy"]  # prev_period=對比前期, yoy=對比去年同期


class ReportConfig(BaseModel):
    """產生分析報告時的控制設定(頁二上方控制列)。"""

    date_preset: DatePreset = "last_7d"
    start_date: Optional[str] = None  # custom 用,YYYY-MM-DD
    end_date: Optional[str] = None
    sources: list[str] = Field(default_factory=list)  # 選用的資料源 id
    model: str = "claude-opus-4-8"  # Phase 2 傳給 Claude API 的 model
    prompt: Optional[str] = None  # 使用者自訂 prompt
    compare_mode: CompareMode = "prev_period"  # 整體數據總覽的對比基準


class SavedReportCreate(BaseModel):
    """存為常用報表。"""

    name: str
    config: ReportConfig
    schedule_daily: bool = True  # 是否每天自動更新


class SavedReport(SavedReportCreate):
    id: int
    created_at: datetime


class AnalysisReport(BaseModel):
    """頁二八個區塊的完整 insight。

    混合策略:KPI/漏斗/趨勢等為規則計算結果(本期 mock);
    executive_summary、recommendations、conclusion 三段文字 Phase 2 交給 Claude API 潤飾。
    """

    range_label: str = ""  # 套用的日期範圍說明
    compare_label: str = ""  # 整體數據總覽的對比基準說明
    executive_summary: str  # 0 執行摘要(LLM 潤飾位)
    kpis: list[Kpi]  # 1 整體數據總覽
    funnel: list[FunnelStage]  # 2 漏斗轉換分析
    funnel_observation: str
    daily_fluctuation: list[TimePoint]  # 3 日常表現波動
    fluctuation_observation: str
    highlights: list[DayHighlight]  # 4 表現優異 VS 異常日期
    trend: list[TimePoint]  # 5 趨勢觀察
    trend_observation: str
    recommendations: list[str]  # 6 具體優化建議(LLM 潤飾位)
    conclusion: str  # 7 總結(LLM 潤飾位)


# --- 頁三:監測中心 ---

Comparator = Literal["gt", "lt", "change_pct"]
NotifyChannel = Literal["email", "line", "webhook"]


class MonitorRuleBase(BaseModel):
    metric: str  # 例如 "roas"、"conversion_rate"、"orders"
    comparator: Comparator
    threshold: float
    notify: NotifyChannel
    enabled: bool = True


class MonitorRuleCreate(MonitorRuleBase):
    pass


class MonitorRule(MonitorRuleBase):
    id: int
    created_at: datetime


# --- 頁四:MCP 設定 ---


class McpServerBase(BaseModel):
    name: str
    command: str  # 啟動指令或 URL
    enabled: bool = True


class McpServerCreate(McpServerBase):
    pass


class McpServer(McpServerBase):
    id: int
    status: Literal["online", "offline"] = "offline"


# --- 頁五:Prompt 互動 ---


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
