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

// GA4 自然語言查詢
export interface Ga4Table {
  columns: string[];
  rows: Record<string, string>[];
  metric_types: Record<string, string>;
}

export interface Ga4Chart {
  type: "line" | "bar";
  x: string;
  series: string[];
}

export interface Ga4QueryResponse {
  narrative: string;
  table: Ga4Table | null;
  chart: Ga4Chart | null;
  error: string | null;
}

// 一筆已儲存的查詢(問題 + 當時結果),供同頁回看。由後端檔案持久化。
export interface Ga4HistoryEntry extends Ga4QueryResponse {
  id: string;
  text: string; // 使用者當時輸入的問題
  model?: string | null; // 當時用的模型
  created_at: string; // ISO 時間
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

// --- 預測模型中心 ---
// 模型訓練狀態（與 featureCatalog 的功能狀態不同）。
export type ModelStatus = "planning" | "training" | "ready";

export interface PredictionModel {
  id: string;
  name: string;
  target: string; // 預測目標說明
  status: ModelStatus;
  last_trained: string | null;
  samples: number;
}

export interface PredictionDistBucket {
  bucket: string;
  count: number;
}

export interface PredictionResult {
  model_id: string;
  columns: string[];
  rows: Record<string, string | number>[];
  distribution: PredictionDistBucket[];
  trigger_hint: string; // 觸發設定提示（輸出到哪個受眾/推播）
}

// --- 客服對話中心 ---
export type Sentiment = "positive" | "neutral" | "negative";

export interface Conversation {
  id: string;
  channel: "line" | "messenger";
  customer: string;
  last_message: string;
  tags: string[];
  sentiment: Sentiment;
  escalated: boolean;
}

export interface ConversationMessage {
  role: "customer" | "agent";
  text: string;
  at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ConversationMessage[];
  summary: string[]; // AI 三行摘要
  severity: "low" | "mid" | "high";
  route_to: string; // 派工對象建議
  draft_reply: string; // AI 回覆草稿
}

// --- 商品與庫存中心 ---
export interface MerchOosRule {
  sku: string;
  name: string;
  stock: number;
  threshold: number;
  ad_action: string; // 對應廣告動作
}

export interface MerchAssocRow {
  product_a: string;
  product_b: string;
  lift: number;
  window_days: number;
}

export interface MerchContentRow {
  sku: string;
  name: string;
  generated_desc: string;
  image_tags: string[];
}

export interface MerchandisingData {
  oos_rules: MerchOosRule[];
  assoc: MerchAssocRow[];
  content: MerchContentRow[];
}

// --- 歸因分析 ---
export interface AttributionPath {
  path: string; // 例：廣告 → EDM → LINE → 成交
  conversions: number;
  contribution_pct: number;
}

export interface FatiguePoint {
  date: string;
  ctr: number; // 廣告點擊率（%）
  open_rate: number; // EDM 開信率（%）
}

export interface AttributionData {
  paths: AttributionPath[];
  path_narrative: string; // 路徑語意分析（LLM 建議，示範文字）
  fatigue: FatiguePoint[];
}

// --- 商品與庫存中心（重構）---
export interface InventoryProduct {
  sku: string;
  name: string;
  stock: number;
  safety_stock: number; // 安全庫存（可設定）
  daily_avg: number; // 近 7 天日均銷量（算可售天數）
  last_month_sales: number;
  last_month_yoy: number; // YoY %
  prev_month_sales: number;
  prev_month_yoy: number;
  last7_sales: number;
  last7_yoy: number;
}

// AI 商品內容生成：Google/Meta Data Feed 欄位
export interface MerchantFeed {
  sku: string;
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  availability: string;
  brand: string;
  price: string;
}

// --- 商品關聯分析 ---
export type AssocWindow = "same_order" | "30d" | "60d" | "90d";

export interface ProductAssociation {
  product_a: string;
  product_b: string;
  lift: number;
  co_customers: number; // 兩品都買的顧客數
}

// --- AI 資料查詢（單一頁＋來源切換，回應沿用 Ga4QueryResponse 型）---
export type AiQuerySource = "ga4" | "google_ads" | "meta_ads" | "search_console" | "cross";

// --- 通知中心（AI 每日自動產出的洞察）---
export type NotificationFeedback = "like" | "dislike";

export interface Notification {
  id: string;
  date: string; // YYYY-MM-DD（AI 產出日期）
  time: string; // HH:mm
  category: string; // 類別：庫存預警／廣告成效／素材疲勞／受眾建議／趨勢洞察…
  title: string;
  content: string; // AI 產出的內容
  source: string; // 對應的查詢/頁面
  feedback: NotificationFeedback | null;
}

// --- 素材疲勞偵測 ---
export type FatigueRange = "7d" | "30d" | "6m";
export type FatigueCompare = "prev_period" | "prev_year";

export interface CreativePoint {
  label: string; // 時間點（日期或月份）
  current: number; // 本期 CTR (%)
  compare: number; // 比較期 CTR (%)
}

export interface CreativeRow {
  creative: string;
  platform: string; // Meta / Google / LINE
  objective: string; // 廣告活動目標
  placement: string; // 廣告版位
  ctr: number; // 本期 CTR (%)
  ctr_delta: number; // 與比較期相比的變化 %
  status: "healthy" | "watch" | "fatigued";
}

export interface CreativeFatigueData {
  series: CreativePoint[];
  creatives: CreativeRow[];
  summary: string; // AI 統整
}

export interface FatigueFilters {
  range: FatigueRange;
  compare: FatigueCompare;
  objective?: string;
  placement?: string;
  platform?: string;
}

// --- Lookalike（併入受眾建立）---
export type LookalikePlatform = "meta" | "google" | "line";

export interface LookalikePayload {
  platform: LookalikePlatform;
  market: string;
  seed_type: "high_ltv" | "predicted_ltv";
  ratio?: number; // Meta/LINE 用 %
  segment?: string; // Google 用 NARROW/BALANCED/BROAD
  auto?: boolean; // LINE 自動
}

export interface LookalikeResult {
  platform: string;
  status: "building" | "done" | "failed";
  count?: number;
}
