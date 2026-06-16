// Demo 模式用的內建 mock。移植自後端 stub(backend/mock_data.py 與各 router),
// 讓 GitHub Pages 靜態網站在沒有後端的情況下也能完整操作。
// 僅當 VITE_DEMO_MODE=true 時啟用(見 client.ts)。
import type {
  AdBuildRequest,
  AdChannelResult,
  AnalysisReport,
  Audience,
  AudiencePreview,
  AudienceReport,
  AudienceSettings,
  BindingActionResult,
  Comment,
  PushPayload,
  ChatMessage,
  ChatResponse,
  DataSource,
  McpServer,
  McpServerCreate,
  MonitorRule,
  MonitorRuleCreate,
  NlParseResult,
  Report,
  ReportDetail,
  ReportForm,
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

// --- 頁二:分析報告(報表詳情八區塊,本期固定 mock) ---
function buildReport(): AnalysisReport {
  const dates = Array.from({ length: 14 }, (_, i) => `2026-05-${String(i + 1).padStart(2, "0")}`);
  const daily = [3200, 2980, 3410, 3650, 2890, 2750, 4120, 4380, 3990, 3550, 3210, 2980, 4510, 4720];
  const trendVals = [2.1, 2.3, 2.0, 2.6, 2.4, 2.2, 2.9, 3.1, 2.8, 2.7, 2.5, 2.4, 3.3, 3.5];
  return {
    range_label: "過去 7 天",
    compare_label: "對比前期",
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

// --- 頁二:報表清單 ---
let reports: Report[] = [
  { id: "r001", name: "VITABOX 廣告週報", sources: ["Meta", "Google"], updated_at: "2026-06-10 09:00", frequency: "每週", model: "claude-opus-4-8", prompt: "比較 Meta 與 Google 的 ROAS,標記變動超過 20% 的指標,並針對浪費花費提出排除關鍵字建議。" },
  { id: "r002", name: "GA4 流量月報", sources: ["GA4"], updated_at: "2026-06-01 08:00", frequency: "每月", model: "claude-sonnet-4-6", prompt: null },
  { id: "r003", name: "全通路綜合分析", sources: ["Meta", "Google", "GA4"], updated_at: "2026-06-12 10:30", frequency: "手動", model: "claude-opus-4-8", prompt: "彙整三平台成效,找出漏斗最大流失點,並給出 3 個可執行的優化建議。" },
];
let reportSeq = 4;

function nowStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// --- 受眾管理 ---
const AUDIENCE_SUMMARY = [
  "購買時間:過去 90 天內有訂單",
  "品項類別:保健品",
  "回購狀態:90 天內無第二筆訂單",
  "性別:女性",
  "年齡:30-45 歲",
];
let audiences: Audience[] = [
  { id: "a001", name: "90天未回購保健品女性 30-45", method: "natural_language", count: 2847, created_at: "2026-06-10 14:00", frequency: "每週", channels: [] },
  { id: "a002", name: "高 RFM 分群 VIP 客", method: "structured", count: 512, created_at: "2026-06-08 10:00", frequency: "每月", channels: [] },
];
let audienceSeq = 3;

// 分群人數對照(與後端 mock_data.SEGMENT_COUNTS 對齊)
const SEGMENT_COUNTS: Record<string, number> = {
  top_core: 8420, top_dormant: 3110, active: 21560, ready_repurchase: 18230,
  sleeping: 26740, new_buyer: 24965, potential_repurchase: 12480, lost: 45620, engaged: 9870,
  rfm_important_value: 6820, rfm_high_potential: 9430, rfm_important_keep: 31200,
  rfm_high_attention: 15006, rfm_low_attention: 54531, rfm_high_wakeup: 24095,
  rfm_low_wakeup: 76102, rfm_high_value_new: 24965, rfm_low_value_new: 45620,
};

// 留言管理(對齊後端 mock_data.MOCK_COMMENTS)
const POST_A = "https://www.facebook.com/vitabox/posts/1001";
const POST_B = "https://www.instagram.com/p/CB202";
const POST_C = "https://www.threads.net/@vitabox/post/303";
const POST_D = "https://line.me/vitabox/404";
const comments: Comment[] = [
  { id: "c01", text: "東西超好用,會回購!", post_url: POST_A, platform: "Meta 粉專", tags: ["正面", "產品"], comment_count: 3, interaction_count: 28 },
  { id: "c02", text: "出貨也太慢了吧,等快兩週", post_url: POST_B, platform: "Instagram", tags: ["負面", "物流"], comment_count: 5, interaction_count: 12 },
  { id: "c03", text: "請問這款有現貨嗎?", post_url: POST_A, platform: "Meta 粉專", tags: ["客服", "產品"], comment_count: 1, interaction_count: 4 },
  { id: "c04", text: "客服回覆好快,讚", post_url: POST_C, platform: "Threads", tags: ["正面", "客服"], comment_count: 0, interaction_count: 9 },
  { id: "c05", text: "包裝破損,裡面壓到了", post_url: POST_B, platform: "Instagram", tags: ["負面", "物流", "客服"], comment_count: 2, interaction_count: 7 },
  { id: "c06", text: "成分標示可以再清楚一點", post_url: POST_D, platform: "LINE 社群", tags: ["產品"], comment_count: 4, interaction_count: 3 },
  { id: "c07", text: "已經第三次回購了 推", post_url: POST_A, platform: "Meta 粉專", tags: ["正面", "產品"], comment_count: 1, interaction_count: 33 },
  { id: "c08", text: "退貨流程好複雜", post_url: POST_C, platform: "Threads", tags: ["負面", "客服"], comment_count: 6, interaction_count: 15 },
  { id: "c09", text: "什麼時候會補貨?敲碗", post_url: POST_B, platform: "Instagram", tags: ["客服", "產品"], comment_count: 8, interaction_count: 21 },
];

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

  // 頁二 報表清單
  getReports: () => delay(reports.map((r) => ({ ...r }))),
  getReport: (id: string): Promise<ReportDetail> => {
    const r = reports.find((x) => x.id === id) ?? reports[0];
    return delay({ ...r, sections: buildReport() });
  },
  createReport: (form: ReportForm): Promise<Report> => {
    const r: Report = {
      id: `r${String(reportSeq++).padStart(3, "0")}`,
      name: form.name,
      sources: form.sources,
      updated_at: nowStr(),
      frequency: form.frequency,
      model: form.model,
      prompt: form.prompt ?? null,
    };
    reports.push(r);
    return delay({ ...r });
  },
  updateReport: (id: string, payload: { prompt: string | null }): Promise<Report> => {
    const r = reports.find((x) => x.id === id) ?? reports[0];
    r.prompt = payload.prompt;
    return delay({ ...r });
  },
  runReport: (id: string): Promise<Report> => {
    const r = reports.find((x) => x.id === id) ?? reports[0];
    r.updated_at = nowStr();
    return delay({ ...r });
  },
  deleteReport: (id: string) => {
    reports = reports.filter((r) => r.id !== id);
    return delay({ deleted: id });
  },

  // 受眾管理
  getAudiences: () => delay(audiences.map((a) => ({ ...a }))),
  previewAudience: (payload: {
    method: string;
    text?: string;
    conditions?: object;
    segment?: string;
  }): Promise<AudiencePreview> => {
    if (payload.segment && SEGMENT_COUNTS[payload.segment] != null) {
      return delay({
        estimated_count: SEGMENT_COUNTS[payload.segment],
        condition_summary: [`預設分群:${payload.segment}`, "本期人數為示範值"],
      });
    }
    return delay({ estimated_count: 2847, condition_summary: [...AUDIENCE_SUMMARY] });
  },
  parseAudienceText: (_text: string): Promise<NlParseResult> =>
    delay({
      conditions: [
        { include: true, field: "曾購買產品", operator: "期間內購買", value: "葉黃素 · 過去 30 天" },
      ],
      condition_summary: ["訂單行為:過去 30 天內購買「葉黃素」"],
      estimated_count: 1860,
    }),
  createAudience: (payload: {
    name: string;
    method: string;
    text?: string;
    conditions?: object;
    segment?: string;
  }): Promise<Audience> => {
    const validMethods = ["natural_language", "structured", "smart_segment", "rfm"];
    const method = (validMethods.includes(payload.method)
      ? payload.method
      : "natural_language") as Audience["method"];
    const a: Audience = {
      id: `a${String(audienceSeq++).padStart(3, "0")}`,
      name: payload.name,
      method,
      count: payload.segment ? SEGMENT_COUNTS[payload.segment] ?? 2847 : 2847,
      created_at: nowStr(),
      frequency: "手動",
      channels: [],
    };
    audiences.push(a);
    return delay({ ...a });
  },
  getAudience: (id: string): Promise<Audience> => {
    const a = audiences.find((x) => x.id === id) ?? audiences[0];
    return delay({ ...a });
  },
  updateAudienceSettings: (id: string, settings: AudienceSettings): Promise<Audience> => {
    const a = audiences.find((x) => x.id === id) ?? audiences[0];
    a.frequency = settings.frequency;
    a.channels = settings.channels;
    return delay({ ...a });
  },
  deleteAudience: (id: string) => {
    audiences = audiences.filter((a) => a.id !== id);
    return delay({ deleted: id });
  },
  buildAdAudience: (_id: string, payload: AdBuildRequest): Promise<AdChannelResult> => {
    const counts: Record<string, number> = { meta: 2410, google: 1980, line: 3120 };
    return delay({
      channel: payload.channel,
      status: "done",
      count: counts[payload.channel] ?? 1500,
      message: "建立完成",
    });
  },
  sendPush: (_id: string, _payload: PushPayload): Promise<{ ok: boolean }> =>
    delay({ ok: true }),
  getComments: () => delay(comments.map((c) => ({ ...c }))),
  replyComments: (ids: string[]): Promise<{ replied: number }> =>
    delay({ replied: ids.length }),

  getAudienceReport: (_id: string): Promise<AudienceReport> => {
    const dates = Array.from({ length: 7 }, (_, i) => `2026-06-${String(i + 1).padStart(2, "0")}`);
    const sentDaily = [1200, 1340, 1180, 1520, 1610, 980, 1450];
    const daily = dates.map((d, i) => ({
      date: d,
      sent: sentDaily[i],
      open_rate: +(28 + i * 0.6).toFixed(1),
      click_rate: +(4.2 + i * 0.15).toFixed(1),
      fail_rate: +(1.8 - i * 0.05).toFixed(1),
      unsubscribe_rate: +(0.6 - i * 0.02).toFixed(2),
      bounce_rate: +(1.2 - i * 0.03).toFixed(2),
      sales: sentDaily[i] * 38,
    }));
    return delay({
      sent: sentDaily.reduce((a, b) => a + b, 0),
      open_rate: 30.4,
      click_rate: 4.9,
      fail_rate: 1.6,
      unsubscribe_rate: 0.52,
      bounce_rate: 1.05,
      sales: daily.reduce((a, b) => a + b.sales, 0),
      daily,
    });
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
