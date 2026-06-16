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


ReportFrequency = Literal["手動", "每日", "每週", "每月"]


class ReportCreate(BaseModel):
    """新建報表表單。"""

    name: str
    sources: list[str] = Field(default_factory=list)  # Meta / Google / GA4
    date_range: Optional[list[str]] = None  # [start, end] YYYY-MM-DD
    frequency: ReportFrequency = "手動"
    model: str = "claude-opus-4-8"
    prompt: Optional[str] = None


class Report(BaseModel):
    """報表清單項目。"""

    id: str
    name: str
    sources: list[str]
    updated_at: str
    frequency: ReportFrequency
    model: str
    prompt: Optional[str] = None  # 建立時下的自訂 prompt(可於詳情頁編輯)


class ReportUpdate(BaseModel):
    """更新報表(目前支援編輯 prompt)。"""

    prompt: Optional[str] = None


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


class ReportDetail(Report):
    """報表詳情:清單基本資料 + 八區塊 insight。"""

    sections: AnalysisReport


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


# --- 受眾管理 ---

AudienceMethod = Literal["natural_language", "structured", "smart_segment", "rfm"]


class AudiencePreviewRequest(BaseModel):
    """送出受眾條件以取得預估人數。"""

    method: AudienceMethod
    text: Optional[str] = None  # natural_language 用
    conditions: dict = Field(default_factory=dict)  # structured 用
    segment: Optional[str] = None  # smart_segment / rfm 用,分群 key


class AudiencePreview(BaseModel):
    estimated_count: int
    condition_summary: list[str]


class ParsedCondition(BaseModel):
    """自然語言解析出的單一結構化條件。"""

    include: bool = True
    field: str  # 顯示用欄位名
    operator: str  # 顯示用運算子
    value: str  # 顯示用值


class NlParseResult(BaseModel):
    """自然語言解析結果:結構化條件 + 摘要 + 預估人數。"""

    conditions: list[ParsedCondition]
    condition_summary: list[str]
    estimated_count: int


class AudienceCreate(BaseModel):
    name: str
    method: AudienceMethod
    text: Optional[str] = None
    conditions: dict = Field(default_factory=dict)
    segment: Optional[str] = None


class AudienceSettings(BaseModel):
    frequency: str  # 手動 / 每日 / 每週 / 每月
    channels: list[str] = Field(default_factory=list)  # edm / meta / google / line


class Audience(BaseModel):
    id: str
    name: str
    method: AudienceMethod
    count: int
    created_at: str
    frequency: str
    channels: list[str]


# 廣告受眾建立(Meta / Google / LINE)
class AdBuildRequest(BaseModel):
    channel: str  # meta / google / line
    frequency: str  # 手動 / 每日 / 每週 / 每月
    match_fields: list[str] = Field(default_factory=list)  # email / phone / ltv / external_id
    name: Optional[str] = None  # 廣告平台上的受眾名稱(Meta 需手動輸入)


class AdChannelResult(BaseModel):
    channel: str
    status: Literal["building", "done", "failed"]
    count: Optional[int] = None
    message: Optional[str] = None


# 推播
class PushPayload(BaseModel):
    mode: Literal["once", "recurring"]
    schedule: str  # 單次:日期時間;定期:頻率+時間 的描述字串
    platform: Literal["edm", "sms", "line"]
    content_mode: Literal["template", "custom"]
    template: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None


# 查看報表
class ReportDailyRow(BaseModel):
    date: str
    sent: int
    open_rate: float
    click_rate: float
    fail_rate: float
    unsubscribe_rate: float
    bounce_rate: float
    sales: int


class AudienceReport(BaseModel):
    sent: int  # 發信數量
    open_rate: float  # 開信率
    click_rate: float  # 點擊率
    fail_rate: float  # 發送失敗率
    unsubscribe_rate: float  # 退訂率
    bounce_rate: float  # 退信率
    sales: int  # 銷售額
    daily: list[ReportDailyRow]


# --- 留言管理 ---
class Comment(BaseModel):
    id: str
    text: str  # 留言內容
    post_url: str  # 貼文網址
    platform: str  # 貼文平台
    tags: list[str]  # 正面/負面、產品、客服、物流
    comment_count: int  # 留言數量
    interaction_count: int  # 互動次數


class CommentReplyRequest(BaseModel):
    ids: list[str]
