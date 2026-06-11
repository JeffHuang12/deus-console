// Demo 模式用的內建 mock。移植自後端 stub(backend/mock_data.py 與各 router),
// 讓 GitHub Pages 靜態網站在沒有後端的情況下也能完整操作。
// 僅當 VITE_DEMO_MODE=true 時啟用(見 client.ts)。
import type {
  AnalysisReport,
  BindingActionResult,
  ChatMessage,
  ChatResponse,
  CompareMode,
  DataSource,
  DatePreset,
  McpServer,
  McpServerCreate,
  MonitorRule,
  MonitorRuleCreate,
  ReportConfig,
  SavedReport,
} from "./types";

const delay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), 120));

// --- 頁一:資料源(含 Boxful) ---
const sources: DataSource[] = [
  { id: "meta_ads", name: "Meta 廣告", auth_kind: "oauth", status: "disconnected", account: null },
  { id: "meta_page", name: "Meta 粉專", auth_kind: "oauth", status: "disconnected", account: null },
  { id: "instagram", name: "Instagram 社群", auth_kind: "oauth", status: "disconnected", account: null },
  { id: "threads", name: "Threads 社群", auth_kind: "oauth", status: "disconnected", account: null },
  { id: "line_lap", name: "LINE LAP", auth_kind: "oauth", status: "disconnected", account: null },
  { id: "google_ads", name: "Google Ads", auth_kind: "oauth", status: "disconnected", account: null },
  { id: "bing_ads", name: "Bing Ads", auth_kind: "oauth", status: "disconnected", account: null },
  { id: "ga4", name: "GA4", auth_kind: "oauth", status: "disconnected", account: null },
  { id: "search_console", name: "Search Console", auth_kind: "oauth", status: "disconnected", account: null },
  { id: "boxful", name: "Boxful", auth_kind: "api_key", status: "disconnected", account: null },
];
let shopline: BindingActionResult = {
  source_id: "shopline",
  status: "disconnected",
  message: "尚未綁定",
};

// --- 頁二:分析報告 ---
const PRESET_LABEL: Record<DatePreset, string> = {
  last_7d: "過去 7 天",
  last_14d: "過去 14 天",
  last_week: "上週(一至日)",
  this_month: "本月",
  last_month: "上個月",
  custom: "自訂區間",
};
const COMPARE_LABEL: Record<CompareMode, string> = {
  prev_period: "對比前期",
  yoy: "對比去年同期",
};

function buildReport(config: ReportConfig): AnalysisReport {
  const dates = Array.from({ length: 14 }, (_, i) => `2026-05-${String(i + 1).padStart(2, "0")}`);
  const daily = [3200, 2980, 3410, 3650, 2890, 2750, 4120, 4380, 3990, 3550, 3210, 2980, 4510, 4720];
  const trendVals = [2.1, 2.3, 2.0, 2.6, 2.4, 2.2, 2.9, 3.1, 2.8, 2.7, 2.5, 2.4, 3.3, 3.5];
  const rangeLabel =
    config.date_preset === "custom" && config.start_date && config.end_date
      ? `${config.start_date} ~ ${config.end_date}`
      : PRESET_LABEL[config.date_preset] ?? "過去 7 天";
  return {
    range_label: rangeLabel,
    compare_label: COMPARE_LABEL[config.compare_mode] ?? "對比前期",
    executive_summary:
      "本期(2026-05-01 至 05-14)整體營收較前期成長 12.4%,主要由 Meta 廣告與 GA4 自然流量帶動。" +
      "漏斗在「加入購物車 → 結帳」環節流失最大,為下一階段優化重點。整體 ROAS 由 2.1 升至 3.5,顯示廣告效率改善。" +
      "[本段 Phase 2 改由 Claude API 依規則計算結果潤飾]",
    kpis: [
      { label: "總營收", value: "NT$ 1,248,300", delta_pct: 12.4 },
      { label: "訂單數", value: "3,421", delta_pct: 8.7 },
      { label: "轉換率", value: "2.84%", delta_pct: 3.1 },
      { label: "平均客單價", value: "NT$ 365", delta_pct: -1.2 },
      { label: "ROAS", value: "3.5", delta_pct: 66.7 },
      { label: "廣告花費", value: "NT$ 356,700", delta_pct: 5.3 },
    ],
    funnel: [
      { stage: "曝光", value: 482000 },
      { stage: "點擊", value: 96400 },
      { stage: "商品瀏覽", value: 48200 },
      { stage: "加入購物車", value: 12300 },
      { stage: "結帳", value: 4100 },
      { stage: "完成付款", value: 3421 },
    ],
    funnel_observation:
      "加入購物車到結帳的轉換率僅 33.3%,低於同業參考值 45%。建議檢視結帳流程步驟數與運費揭露時機。",
    daily_fluctuation: dates.map((d, i) => ({ date: d, value: daily[i] })),
    fluctuation_observation:
      "週末(05-07、05-08、05-13、05-14)營收明顯高於平日,假日檔期投放可加碼。",
    highlights: [
      { date: "2026-05-14", metric: "營收", value: 4720, kind: "best", note: "母親節檔期高峰" },
      { date: "2026-05-13", metric: "營收", value: 4510, kind: "best", note: "檔期前一日預熱" },
      { date: "2026-05-06", metric: "營收", value: 2750, kind: "anomaly", note: "廣告預算誤設過低" },
      { date: "2026-05-05", metric: "營收", value: 2890, kind: "anomaly", note: "官網結帳一度異常" },
    ],
    trend: dates.map((d, i) => ({ date: d, value: trendVals[i] })),
    trend_observation:
      "ROAS 呈穩定上升趨勢,兩週內由 2.1 升至 3.5,廣告素材汰換策略見效。",
    recommendations: [
      "優化結帳流程:減少表單欄位、提前揭露運費,目標把購物車→結帳轉換從 33% 提升至 45%。",
      "加碼週末與檔期投放預算,平日維持穩定曝光即可。",
      "複製 05-14 高轉換素材的訴求方向,擴大相似受眾測試。",
      "建立預算護欄,避免再次出現 05-06 預算誤設導致的營收下滑。",
      "[本清單 Phase 2 由 Claude API 依數據生成更具體的優化建議]",
    ],
    conclusion:
      "本期表現優於前期,廣告效率與營收同步成長。最大機會點在結帳轉換率,若能補上將進一步放大 ROAS。" +
      "[本段 Phase 2 由 Claude API 潤飾]",
  };
}

// --- 頁三:監測規則 ---
let rules: MonitorRule[] = [
  {
    id: 1,
    metric: "roas",
    comparator: "lt",
    threshold: 2.0,
    notify: "email",
    enabled: true,
    created_at: new Date().toISOString(),
  },
];
let ruleSeq = 2;

// --- 頁四:MCP server ---
let servers: McpServer[] = [
  { id: 1, name: "filesystem", command: "npx -y @modelcontextprotocol/server-filesystem", enabled: true, status: "offline" },
  { id: 2, name: "firecrawl", command: "npx -y firecrawl-mcp", enabled: true, status: "offline" },
];
let serverSeq = 3;

// --- 常用報表 ---
let saved: SavedReport[] = [];
let savedSeq = 1;

export const mockApi = {
  listSources: () => delay(sources.map((s) => ({ ...s }))),
  getShoplineStatus: () => delay({ ...shopline }),
  bindShopline: (access_token: string) => {
    shopline = {
      source_id: "shopline",
      status: access_token ? "connected" : "disconnected",
      message: access_token ? "已儲存並綁定(Demo 未實際驗證 token)" : "token 無效",
    };
    return delay({ ...shopline });
  },
  connectSource: (id: string, access_token?: string): Promise<BindingActionResult> => {
    const s = sources.find((x) => x.id === id);
    if (!s) return delay({ source_id: id, status: "disconnected", message: "未知的資料源" });
    if (s.auth_kind === "api_key" && !access_token) {
      return delay({ source_id: id, status: "disconnected", message: "請提供 API Key" });
    }
    s.status = "connected";
    s.account = s.auth_kind === "api_key" ? "api-key-****" : "demo-account";
    return delay({
      source_id: id,
      status: "connected",
      message: s.auth_kind === "api_key" ? "已儲存 API Key 並綁定(Demo)" : `${id} 已綁定(Demo)`,
    });
  },
  disconnectSource: (id: string): Promise<BindingActionResult> => {
    const s = sources.find((x) => x.id === id);
    if (s) {
      s.status = "disconnected";
      s.account = null;
    }
    return delay({ source_id: id, status: "disconnected", message: "已解除綁定" });
  },

  getAnalysis: () =>
    delay(
      buildReport({
        date_preset: "last_7d",
        start_date: null,
        end_date: null,
        sources: [],
        model: "claude-opus-4-8",
        prompt: null,
        compare_mode: "prev_period",
      })
    ),
  runAnalysis: (config: ReportConfig) => delay(buildReport(config)),
  listSavedReports: () => delay(saved.map((s) => ({ ...s }))),
  saveReport: (name: string, config: ReportConfig, schedule_daily: boolean) => {
    const r: SavedReport = {
      id: savedSeq++,
      name,
      config,
      schedule_daily,
      created_at: new Date().toISOString(),
    };
    saved.push(r);
    return delay({ ...r });
  },
  deleteSavedReport: (id: number) => {
    saved = saved.filter((s) => s.id !== id);
    return delay({ deleted: id });
  },

  listRules: () => delay(rules.map((r) => ({ ...r }))),
  createRule: (payload: MonitorRuleCreate) => {
    const r: MonitorRule = { id: ruleSeq++, created_at: new Date().toISOString(), ...payload };
    rules.push(r);
    return delay({ ...r });
  },
  updateRule: (id: number, payload: MonitorRuleCreate) => {
    rules = rules.map((r) => (r.id === id ? { ...r, ...payload } : r));
    return delay({ ...(rules.find((r) => r.id === id) as MonitorRule) });
  },
  deleteRule: (id: number) => {
    rules = rules.filter((r) => r.id !== id);
    return delay({ deleted: id });
  },

  listServers: () => delay(servers.map((s) => ({ ...s }))),
  createServer: (payload: McpServerCreate) => {
    const s: McpServer = { id: serverSeq++, status: "offline", ...payload };
    servers.push(s);
    return delay({ ...s });
  },
  updateServer: (id: number, payload: McpServerCreate) => {
    servers = servers.map((s) => (s.id === id ? { ...s, ...payload } : s));
    return delay({ ...(servers.find((s) => s.id === id) as McpServer) });
  },
  deleteServer: (id: number) => {
    servers = servers.filter((s) => s.id !== id);
    return delay({ deleted: id });
  },

  chat: (msg: string, _history: ChatMessage[]): Promise<ChatResponse> =>
    delay({
      reply:
        "（這是 Demo 模式的示範回覆,Claude API 尚未接通。）\n" +
        `你說:「${msg}」。實際接上後,這裡會回傳真正的分析對話結果。`,
    }),
};
