// 集中的 API 呼叫層。baseURL 走相對路徑 /api,由 Vite proxy 轉到 FastAPI。
// VITE_DEMO_MODE=true 時(GitHub Pages 靜態 demo)改用內建 mock,不打後端。
import axios from "axios";
import { message } from "antd";
import { mockApi } from "./mocks";
import type {
  AnalysisReport,
  BindingActionResult,
  ChatMessage,
  ChatResponse,
  DataSource,
  McpServer,
  McpServerCreate,
  MonitorRule,
  MonitorRuleCreate,
  ReportConfig,
  SavedReport,
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

  // 頁二 分析中心
  getAnalysis: () => http.get<AnalysisReport>("/analysis").then((r) => r.data),
  runAnalysis: (config: ReportConfig) =>
    http.post<AnalysisReport>("/analysis/run", config).then((r) => r.data),
  listSavedReports: () =>
    http.get<SavedReport[]>("/analysis/saved").then((r) => r.data),
  saveReport: (name: string, config: ReportConfig, schedule_daily: boolean) =>
    http
      .post<SavedReport>("/analysis/saved", { name, config, schedule_daily })
      .then((r) => r.data),
  deleteSavedReport: (id: number) =>
    http.delete(`/analysis/saved/${id}`).then((r) => r.data),

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
};

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

// demo 模式用內建 mock,否則打真實後端。兩者方法簽章一致。
export const api = DEMO_MODE ? mockApi : httpApi;
