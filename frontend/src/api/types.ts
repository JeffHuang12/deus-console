// 與後端 schemas.py 對應的型別。

export type ConnectionStatus = "connected" | "disconnected";
export type AuthKind = "api_key" | "oauth";

export interface DataSource {
  id: string;
  name: string;
  auth_kind: AuthKind;
  status: ConnectionStatus;
  account: string | null;
}

export interface BindingActionResult {
  source_id: string;
  status: ConnectionStatus;
  message: string;
}

export interface Kpi {
  label: string;
  value: string;
  delta_pct: number | null;
}

export interface FunnelStage {
  stage: string;
  value: number;
}

export interface TimePoint {
  date: string;
  value: number;
}

export interface DayHighlight {
  date: string;
  metric: string;
  value: number;
  kind: "best" | "anomaly";
  note: string;
}

export type DatePreset =
  | "last_7d"
  | "last_14d"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";
export type CompareMode = "prev_period" | "yoy";

export interface ReportConfig {
  date_preset: DatePreset;
  start_date: string | null;
  end_date: string | null;
  sources: string[];
  model: string;
  prompt: string | null;
  compare_mode: CompareMode;
}

export type ReportFrequency = "手動" | "每日" | "每週" | "每月";

// 報表清單項目
export interface Report {
  id: string;
  name: string;
  sources: string[];
  updated_at: string;
  frequency: ReportFrequency;
  model: string;
  prompt?: string | null;
}

// 新建報表表單
export interface ReportForm {
  name: string;
  sources: string[];
  date_range: [string, string] | null;
  frequency: ReportFrequency;
  model: string;
  prompt: string | null;
}

export interface AnalysisReport {
  range_label: string;
  compare_label: string;
  executive_summary: string;
  kpis: Kpi[];
  funnel: FunnelStage[];
  funnel_observation: string;
  daily_fluctuation: TimePoint[];
  fluctuation_observation: string;
  highlights: DayHighlight[];
  trend: TimePoint[];
  trend_observation: string;
  recommendations: string[];
  conclusion: string;
}

export type Comparator = "gt" | "lt" | "change_pct";
export type NotifyChannel = "email" | "line" | "webhook";

export interface MonitorRule {
  id: number;
  metric: string;
  comparator: Comparator;
  threshold: number;
  notify: NotifyChannel;
  enabled: boolean;
  created_at: string;
}

export interface MonitorRuleCreate {
  metric: string;
  comparator: Comparator;
  threshold: number;
  notify: NotifyChannel;
  enabled: boolean;
}

export interface McpServer {
  id: number;
  name: string;
  command: string;
  enabled: boolean;
  status: "online" | "offline";
}

export interface McpServerCreate {
  name: string;
  command: string;
  enabled: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
}

// 報表詳情:清單基本資料 + 八區塊
export interface ReportDetail extends Report {
  sections: AnalysisReport;
}

// 受眾管理
export type AudienceMethod =
  | "natural_language"
  | "structured"
  | "smart_segment"
  | "rfm";

// 結構化條件的單一條件列
export interface StructuredCondition {
  include: boolean; // true=包含, false=排除
  field: string;
  operator: string;
  value: unknown; // 依欄位型別:string / number / [number,number] / 日期字串 / { period, products }
}

// 自然語言解析出的條件(顯示用)
export interface ParsedCondition {
  include: boolean;
  field: string;
  operator: string;
  value: string;
}

export interface NlParseResult {
  conditions: ParsedCondition[];
  condition_summary: string[];
  estimated_count: number;
}

export interface Audience {
  id: string;
  name: string;
  method: AudienceMethod;
  count: number;
  created_at: string;
  frequency: string;
  channels: string[];
}

export interface AudiencePreview {
  estimated_count: number;
  condition_summary: string[];
}

export interface AudienceSettings {
  frequency: string;
  channels: string[];
}

// 廣告受眾建立
export interface AdBuildRequest {
  channel: string; // meta / google / line
  frequency: string;
  match_fields: string[]; // email / phone / ltv / external_id
  name?: string; // 廣告平台受眾名稱(Meta 需手動輸入)
}

export interface AdChannelResult {
  channel: string;
  status: "building" | "done" | "failed";
  count?: number;
  message?: string;
}

// 推播
export interface PushPayload {
  mode: "once" | "recurring";
  schedule: string;
  platform: "edm" | "sms" | "line";
  content_mode: "template" | "custom";
  template?: string;
  subject?: string;
  body?: string;
}

// 查看報表
export interface ReportDailyRow {
  date: string;
  sent: number;
  open_rate: number;
  click_rate: number;
  fail_rate: number;
  unsubscribe_rate: number;
  bounce_rate: number;
  sales: number;
}

export interface AudienceReport {
  sent: number;
  open_rate: number;
  click_rate: number;
  fail_rate: number;
  unsubscribe_rate: number;
  bounce_rate: number;
  sales: number;
  daily: ReportDailyRow[];
}

// 留言管理
export interface Comment {
  id: string;
  text: string;
  post_url: string;
  platform: string;
  tags: string[];
  comment_count: number;
  interaction_count: number;
}
