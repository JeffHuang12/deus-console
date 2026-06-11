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

export interface SavedReport {
  id: number;
  name: string;
  config: ReportConfig;
  schedule_daily: boolean;
  created_at: string;
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
