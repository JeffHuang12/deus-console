// 集中的 API 呼叫層。baseURL 走相對路徑 /api,由 Vite proxy 轉到 FastAPI。
// VITE_DEMO_MODE=true 時(GitHub Pages 靜態 demo)改用內建 mock,不打後端。
import axios from "axios";
import { message } from "antd";
import { mockApi } from "./mocks";
import type {
  AdBuildRequest,
  AdChannelResult,
  Audience,
  AudiencePreview,
  AudienceReport,
  AudienceSettings,
  BindingActionResult,
  PushPayload,
  ChatMessage,
  ChatResponse,
  Comment,
  PredictionModel,
  PredictionResult,
  Conversation,
  ConversationDetail,
  AttributionData,
  InventoryProduct,
  MerchantFeed,
  ProductAssociation,
  AssocWindow,
  AiQuerySource,
  LookalikePayload,
  LookalikeResult,
  CreativeFatigueData,
  FatigueFilters,
  Notification,
  NotificationFeedback,
  DataSource,
  Ga4HistoryEntry,
  Ga4QueryResponse,
  McpServer,
  McpServerCreate,
  MonitorRule,
  MonitorRuleCreate,
  NlParseResult,
  Report,
  ReportDetail,
  ReportForm,
} from "./types";

const http = axios.create({ baseURL: "/api", timeout: 15000 });

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err?.response?.data?.detail ?? err.message ?? "請求失敗";
    message.error(`API 錯誤:${detail}`);
    return Promise.reject(err);
  }
);

const httpApi = {
  // 頁一 數據綁定
  listSources: () => http.get<DataSource[]>("/bindings").then((r) => r.data),
  getShoplineStatus: () =>
    http.get<BindingActionResult>("/bindings/shopline").then((r) => r.data),
  bindShopline: (access_token: string) =>
    http
      .post<BindingActionResult>("/bindings/shopline", { access_token })
      .then((r) => r.data),
  connectSource: (id: string, access_token?: string) =>
    http
      .post<BindingActionResult>(`/bindings/${id}/connect`, {
        access_token: access_token ?? null,
      })
      .then((r) => r.data),
  disconnectSource: (id: string) =>
    http
      .post<BindingActionResult>(`/bindings/${id}/disconnect`)
      .then((r) => r.data),

  // 頁二 分析中心(報表清單)
  getReports: () => http.get<Report[]>("/analysis/reports").then((r) => r.data),
  getReport: (id: string) =>
    http.get<ReportDetail>(`/analysis/reports/${id}`).then((r) => r.data),
  createReport: (form: ReportForm) =>
    http.post<Report>("/analysis/reports", form).then((r) => r.data),
  updateReport: (id: string, payload: { prompt: string | null }) =>
    http.put<Report>(`/analysis/reports/${id}`, payload).then((r) => r.data),
  runReport: (id: string) =>
    http.post<Report>(`/analysis/reports/${id}/run`).then((r) => r.data),
  deleteReport: (id: string) =>
    http.delete(`/analysis/reports/${id}`).then((r) => r.data),

  // 受眾管理
  getAudiences: () => http.get<Audience[]>("/audience").then((r) => r.data),
  previewAudience: (payload: {
    method: string;
    text?: string;
    conditions?: object;
    segment?: string;
  }) =>
    http.post<AudiencePreview>("/audience/preview", payload).then((r) => r.data),
  parseAudienceText: (text: string) =>
    http
      .post<NlParseResult>("/audience/parse", { method: "natural_language", text })
      .then((r) => r.data),
  createAudience: (payload: {
    name: string;
    method: string;
    text?: string;
    conditions?: object;
    segment?: string;
  }) => http.post<Audience>("/audience", payload).then((r) => r.data),
  getAudience: (id: string) =>
    http.get<Audience>(`/audience/${id}`).then((r) => r.data),
  updateAudienceSettings: (id: string, settings: AudienceSettings) =>
    http.put<Audience>(`/audience/${id}/settings`, settings).then((r) => r.data),
  deleteAudience: (id: string) =>
    http.delete(`/audience/${id}`).then((r) => r.data),
  buildAdAudience: (id: string, payload: AdBuildRequest) =>
    http
      .post<AdChannelResult>(`/audience/${id}/ad-channel`, payload)
      .then((r) => r.data),
  sendPush: (id: string, payload: PushPayload) =>
    http.post<{ ok: boolean }>(`/audience/${id}/push`, payload).then((r) => r.data),
  getAudienceReport: (id: string) =>
    http.get<AudienceReport>(`/audience/${id}/report`).then((r) => r.data),

  // 留言管理
  getComments: () => http.get<Comment[]>("/comments").then((r) => r.data),
  replyComments: (ids: string[]) =>
    http.post<{ replied: number }>("/comments/reply", { ids }).then((r) => r.data),

  // 頁三 監測中心
  listRules: () => http.get<MonitorRule[]>("/monitoring/rules").then((r) => r.data),
  createRule: (payload: MonitorRuleCreate) =>
    http.post<MonitorRule>("/monitoring/rules", payload).then((r) => r.data),
  updateRule: (id: number, payload: MonitorRuleCreate) =>
    http.put<MonitorRule>(`/monitoring/rules/${id}`, payload).then((r) => r.data),
  deleteRule: (id: number) =>
    http.delete(`/monitoring/rules/${id}`).then((r) => r.data),

  // 頁四 MCP 設定
  listServers: () => http.get<McpServer[]>("/mcp/servers").then((r) => r.data),
  createServer: (payload: McpServerCreate) =>
    http.post<McpServer>("/mcp/servers", payload).then((r) => r.data),
  updateServer: (id: number, payload: McpServerCreate) =>
    http.put<McpServer>(`/mcp/servers/${id}`, payload).then((r) => r.data),
  deleteServer: (id: number) =>
    http.delete(`/mcp/servers/${id}`).then((r) => r.data),

  // 頁五 Prompt 互動
  chat: (msg: string, history: ChatMessage[]) =>
    http
      .post<ChatResponse>("/chat", { message: msg, history })
      .then((r) => r.data),

  // GA4 自然語言查詢(agent + MCP,回應較慢,單獨拉長 timeout)
  queryGa4: (text: string, model: string) =>
    http
      .post<Ga4QueryResponse>("/ga4/query", { text, model }, { timeout: 120000 })
      .then((r) => r.data),

  // GA4 查詢歷史(後端檔案持久化)
  getGa4History: () =>
    http.get<Ga4HistoryEntry[]>("/ga4/history").then((r) => r.data),
  saveGa4History: (text: string, res: Ga4QueryResponse, model: string) =>
    http
      .post<Ga4HistoryEntry>("/ga4/history", { text, model, ...res })
      .then((r) => r.data),
  deleteGa4History: (id: string) =>
    http.delete(`/ga4/history/${id}`).then((r) => r.data),
  clearGa4History: () => http.delete("/ga4/history").then((r) => r.data),

  // 預測模型中心
  getPredictionModels: () =>
    http.get<PredictionModel[]>("/predictions/models").then((r) => r.data),
  getPredictionResult: (id: string) =>
    http.get<PredictionResult>(`/predictions/models/${id}/result`).then((r) => r.data),

  // 客服對話中心
  getConversations: () =>
    http.get<Conversation[]>("/conversations").then((r) => r.data),
  getConversation: (id: string) =>
    http.get<ConversationDetail>(`/conversations/${id}`).then((r) => r.data),

  // 商品與庫存中心
  getInventory: () =>
    http.get<InventoryProduct[]>("/merchandising/inventory").then((r) => r.data),
  getMerchantFeed: (sku: string) =>
    http.get<MerchantFeed>(`/merchandising/feed/${sku}`).then((r) => r.data),

  // 商品關聯分析
  getProductAssociations: (window: AssocWindow) =>
    http
      .get<ProductAssociation[]>("/associations", { params: { window } })
      .then((r) => r.data),

  // 歸因分析
  getAttribution: () =>
    http.get<AttributionData>("/attribution").then((r) => r.data),

  // AI 資料查詢（單一頁＋來源切換）
  queryMcp: (source: AiQuerySource, text: string, model: string) =>
    http
      .post<Ga4QueryResponse>("/ai-query", { source, text, model }, { timeout: 120000 })
      .then((r) => r.data),

  // Lookalike：建立類似受眾
  buildLookalike: (payload: LookalikePayload) =>
    http.post<LookalikeResult>("/audience/lookalike", payload).then((r) => r.data),

  // 素材疲勞偵測
  getCreativeFatigue: (filters: FatigueFilters) =>
    http
      .get<CreativeFatigueData>("/creative-fatigue", { params: filters })
      .then((r) => r.data),

  // 通知中心
  getNotifications: () =>
    http.get<Notification[]>("/notifications").then((r) => r.data),
  reactNotification: (id: string, feedback: NotificationFeedback | null) =>
    http
      .post<Notification>(`/notifications/${id}/feedback`, { feedback })
      .then((r) => r.data),
  markNotificationsRead: (ids: string[]) =>
    http
      .post<{ updated: number }>("/notifications/read", { ids })
      .then((r) => r.data),
};

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

// demo 模式用內建 mock,否則打真實後端。兩者方法簽章一致。
export const api = DEMO_MODE ? mockApi : httpApi;
