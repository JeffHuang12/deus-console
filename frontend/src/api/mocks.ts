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
  CreativeRow,
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

const delay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), 120));

// 通知中心：AI 每日自動產出的洞察（記憶體暫存，重整即還原）
let notifications: Notification[] = [
  { id: "n1", date: "2026-06-23", time: "09:00", category: "庫存預警", title: "益生菌即將缺貨，建議暫停廣告", content: "益生菌（VB-PRO）目前庫存 8、預估可售約 1 天,低於安全庫存 30。已在投放的 Google DPA 仍在消耗預算,建議暫停或補貨,避免廣告把流量帶到無法出貨的商品。", source: "商品與庫存中心", severity: "high", read: false, action_label: "前往商品與庫存中心", action_route: "/merchandising", feedback: null },
  { id: "n2", date: "2026-06-23", time: "09:00", category: "素材疲勞", title: "Meta「情境影片 A」CTR 衰退 34%", content: "過去 30 天 Meta 轉換活動的「情境影片 A」CTR 從 2.4% 降到 1.6%,衰退逾 25% 進入疲勞區。建議優先汰換,並把預算移往仍健康的成分教育素材。", source: "素材疲勞偵測", severity: "mid", read: false, action_label: "前往素材疲勞偵測", action_route: "/creative-fatigue", feedback: null },
  { id: "n3", date: "2026-06-23", time: "09:00", category: "受眾建議", title: "高 LTV 客戶可擴展類似受眾", content: "年消費前 20% 客戶名單已更新。以此為種子在 Meta 建立 1% 類似受眾,預估可觸及約 24 萬人,通常 CAC 比廣投低 30-50%,建議測試。", source: "受眾管理", severity: "mid", read: false, action_label: "前往受眾建立", action_route: "/audience/new", feedback: null },
  { id: "n4", date: "2026-06-23", time: "09:00", category: "廣告成效", title: "跨平台真實 ROAS：Google 品牌字最高", content: "本週各渠道真實 ROAS（合併訂單金額計算）:Google 品牌字 6.8、Google 再行銷 5.4、LINE 2.7、Meta 新客 1.9。Meta 新客成本偏高,建議調整出價或受眾。", source: "AI 資料查詢（跨平台）", severity: "low", read: false, action_label: "前往 AI 資料查詢", action_route: "/ai-query", feedback: null },
  { id: "n5", date: "2026-06-22", time: "09:00", category: "趨勢洞察", title: "週末工作階段走高，建議加碼投放", content: "GA4 過去 7 天工作階段呈週末走高,06-16 為高點。建議把預算往週末傾斜,並確認熱銷品庫存充足。", source: "AI 資料查詢（GA4）", severity: "low", read: true, action_label: "前往 AI 資料查詢", action_route: "/ai-query", feedback: "like" },
  { id: "n6", date: "2026-06-22", time: "09:00", category: "客服洞察", title: "物流類客訴上升，建議優先處理", content: "昨日 LINE 對話中物流類負面情緒對話增加,已自動標記並派工物流客服組。建議主管關注是否有出貨延遲。", source: "客服對話中心", severity: "high", read: false, action_label: "前往客服對話中心", action_route: "/conversations", feedback: null },
];

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

// GA4 查詢歷史(Demo 模式記憶體;真實模式由後端檔案持久化)
let ga4History: Ga4HistoryEntry[] = [];

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

  queryGa4: (text: string, _model: string): Promise<Ga4QueryResponse> => {
    const dates = Array.from({ length: 7 }, (_, i) => `2026-06-${String(i + 10).padStart(2, "0")}`);
    const sessions = [3200, 2980, 3410, 3650, 2890, 4120, 4380];
    return delay({
      narrative:
        "（Demo 模式示範資料,未實際查詢 GA4。）\n" +
        `你問:「${text}」。過去 7 天工作階段數呈週末走高的趨勢,06-16 為高點 4,380。`,
      table: {
        columns: ["date", "sessions"],
        rows: dates.map((d, i) => ({ date: d, sessions: String(sessions[i]) })),
        metric_types: { sessions: "TYPE_INTEGER" },
      },
      chart: { type: "line", x: "date", series: ["sessions"] },
      error: null,
    });
  },

  // GA4 查詢歷史(Demo 模式:記憶體陣列,重整即失,僅供操作演示)
  getGa4History: (): Promise<Ga4HistoryEntry[]> =>
    delay(ga4History.map((e) => ({ ...e }))),
  saveGa4History: (
    text: string,
    res: Ga4QueryResponse,
    model: string
  ): Promise<Ga4HistoryEntry> => {
    const entry: Ga4HistoryEntry = {
      ...res,
      text,
      model,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    };
    ga4History = [entry, ...ga4History].slice(0, 200);
    return delay({ ...entry });
  },
  deleteGa4History: (id: string): Promise<{ deleted: string }> => {
    ga4History = ga4History.filter((e) => e.id !== id);
    return delay({ deleted: id });
  },
  clearGa4History: (): Promise<{ cleared: boolean }> => {
    ga4History = [];
    return delay({ cleared: true });
  },

  // 預測模型中心（示範資料；Phase 2 由 BigQuery 取數＋離線模型）
  getPredictionModels: (): Promise<PredictionModel[]> =>
    delay([
      { id: "clv", name: "CLV 預測", target: "預測新客未來 12 個月消費金額", status: "planning", last_trained: null, samples: 0 },
      { id: "churn", name: "流失預測", target: "預測 30 天內流失機率", status: "planning", last_trained: null, samples: 0 },
      { id: "repurchase", name: "回購時間點預測", target: "預測每會員下次購買日", status: "planning", last_trained: null, samples: 0 },
      { id: "return_risk", name: "退貨/詐欺預警", target: "依下單行為標記異常訂單", status: "planning", last_trained: null, samples: 0 },
      { id: "first_clv", name: "首購 CLV 分流", target: "依首筆訂單預測 12 個月消費並分流", status: "planning", last_trained: null, samples: 0 },
    ]),
  getPredictionResult: (id: string): Promise<PredictionResult> =>
    delay({
      model_id: id,
      columns: ["會員 ID", "預測值", "信賴區間", "建議動作"],
      rows: [
        { "會員 ID": "M-10231", 預測值: "NT$ 8,400", 信賴區間: "±1,200", 建議動作: "高出價受眾" },
        { "會員 ID": "M-10588", 預測值: "NT$ 3,150", 信賴區間: "±900", 建議動作: "一般再行銷" },
        { "會員 ID": "M-10911", 預測值: "NT$ 12,700", 信賴區間: "±1,800", 建議動作: "VIP 經營" },
        { "會員 ID": "M-11042", 預測值: "NT$ 1,260", 信賴區間: "±600", 建議動作: "低優先" },
      ],
      distribution: [
        { bucket: "0-2k", count: 1820 },
        { bucket: "2k-5k", count: 2640 },
        { bucket: "5k-10k", count: 1310 },
        { bucket: "10k+", count: 430 },
      ],
      trigger_hint: "可將「高出價受眾」名單一鍵輸出至受眾管理，建立 Lookalike 種子或廣告受眾。",
    }),

  // 客服對話中心（示範資料）
  getConversations: (): Promise<Conversation[]> =>
    delay([
      { id: "cv1", channel: "line", customer: "陳小姐", last_message: "這個成份孕婦可以吃嗎？", tags: ["產品諮詢", "成份"], sentiment: "neutral", escalated: false },
      { id: "cv2", channel: "line", customer: "王先生", last_message: "等了一週還沒到貨，很失望", tags: ["物流", "客訴"], sentiment: "negative", escalated: true },
      { id: "cv3", channel: "messenger", customer: "Linda", last_message: "回購一樣有優惠嗎？太好用了", tags: ["回購", "正面"], sentiment: "positive", escalated: false },
      { id: "cv4", channel: "line", customer: "李先生", last_message: "想退貨，包裝有破損", tags: ["退貨", "客訴"], sentiment: "negative", escalated: false },
    ]),
  getConversation: (id: string): Promise<ConversationDetail> => {
    const base: Record<string, ConversationDetail> = {
      cv2: {
        id: "cv2", channel: "line", customer: "王先生",
        last_message: "等了一週還沒到貨，很失望",
        tags: ["物流", "客訴"], sentiment: "negative", escalated: true,
        messages: [
          { role: "customer", text: "我上週下的單到現在還沒收到", at: "06-20 10:12" },
          { role: "agent", text: "您好，幫您查詢物流狀態", at: "06-20 10:15" },
          { role: "customer", text: "等了一週還沒到貨，很失望", at: "06-21 09:02" },
        ],
        summary: ["客戶上週下單尚未到貨，已等候約一週。", "情緒偏負面，對到貨時效不滿。", "需查物流並主動補償，避免客訴擴大。"],
        severity: "high", route_to: "物流客服組（升級主管）",
        draft_reply: "王先生您好，非常抱歉讓您久等。已為您查詢，包裹預計明日送達，並附上下次購物折扣作為補償。造成不便我們深感抱歉。",
      },
    };
    return delay(
      base[id] ?? {
        id, channel: "line", customer: "顧客",
        last_message: "（示範對話）", tags: ["產品諮詢"], sentiment: "neutral", escalated: false,
        messages: [
          { role: "customer", text: "這個成份孕婦可以吃嗎？", at: "06-21 14:01" },
          { role: "agent", text: "您好，建議先諮詢醫師。", at: "06-21 14:05" },
        ],
        summary: ["客戶詢問成份適用性。", "屬一般產品諮詢，情緒中性。", "可提供衛教內容並標記為潛在購買意願。"],
        severity: "low", route_to: "一般客服組",
        draft_reply: "您好，關於成份適用性，建議您諮詢專業醫師。附上產品成份說明供您參考，若有其他問題歡迎再詢問。",
      }
    );
  },

  // 商品與庫存中心：庫存表（全產品，示範資料）
  getInventory: (): Promise<InventoryProduct[]> =>
    delay([
      { sku: "VB-OMG3", name: "高濃度魚油", stock: 42, safety_stock: 50, daily_avg: 9, last_month_sales: 280, last_month_yoy: 18, prev_month_sales: 240, prev_month_yoy: 12, last7_sales: 63, last7_yoy: 22 },
      { sku: "VB-LUT", name: "葉黃素", stock: 180, safety_stock: 60, daily_avg: 7, last_month_sales: 210, last_month_yoy: -8, prev_month_sales: 230, prev_month_yoy: -4, last7_sales: 49, last7_yoy: -12 },
      { sku: "VB-PRO", name: "益生菌", stock: 8, safety_stock: 30, daily_avg: 6, last_month_sales: 185, last_month_yoy: 34, prev_month_sales: 150, prev_month_yoy: 20, last7_sales: 47, last7_yoy: 41 },
      { sku: "VB-COL", name: "膠原蛋白", stock: 95, safety_stock: 40, daily_avg: 5, last_month_sales: 160, last_month_yoy: 6, prev_month_sales: 155, prev_month_yoy: 3, last7_sales: 35, last7_yoy: 9 },
      { sku: "VB-VC", name: "維他命 C", stock: 24, safety_stock: 35, daily_avg: 4, last_month_sales: 120, last_month_yoy: -15, prev_month_sales: 140, prev_month_yoy: -9, last7_sales: 26, last7_yoy: -18 },
      { sku: "VB-BG", name: "B 群", stock: 130, safety_stock: 45, daily_avg: 6, last_month_sales: 175, last_month_yoy: 11, prev_month_sales: 162, prev_month_yoy: 7, last7_sales: 42, last7_yoy: 14 },
      { sku: "VB-CAL", name: "鈣鎂錠", stock: 60, safety_stock: 30, daily_avg: 3, last_month_sales: 95, last_month_yoy: 2, prev_month_sales: 93, prev_month_yoy: 0, last7_sales: 20, last7_yoy: 3 },
      { sku: "VB-ZN", name: "鋅錠", stock: 15, safety_stock: 25, daily_avg: 3, last_month_sales: 88, last_month_yoy: 26, prev_month_sales: 70, prev_month_yoy: 15, last7_sales: 24, last7_yoy: 30 },
      { sku: "VB-IRN", name: "鐵錠", stock: 110, safety_stock: 30, daily_avg: 2, last_month_sales: 64, last_month_yoy: -22, prev_month_sales: 82, prev_month_yoy: -10, last7_sales: 12, last7_yoy: -25 },
    ]),

  // AI 商品內容生成：取得單一產品的 Google/Meta Data Feed 欄位（示範）
  getMerchantFeed: (sku: string): Promise<MerchantFeed> => {
    const map: Record<string, MerchantFeed> = {
      "VB-OMG3": { sku, id: "VB-OMG3", title: "Vitabox 挪威 85% Omega-3 高濃度魚油 60 顆", description: "挪威小型魚萃取,rTG 型式高吸收,每日一顆守護心血管與專注力。純化製程,通過重金屬與塑化劑檢驗。", link: "https://shop.vitabox.com.tw/products/omega3", image_link: "https://shop.vitabox.com.tw/images/omega3_800.jpg", availability: "有現貨", brand: "Vitabox", price: "1180 TWD" },
    };
    return delay(
      map[sku] ?? {
        sku,
        id: sku,
        title: `Vitabox ${sku} 保健食品`,
        description: "（AI 依產品主檔與到達網頁重新生成的說明,純文字、最多 5000 字、僅含產品資訊。）",
        link: `https://shop.vitabox.com.tw/products/${sku.toLowerCase()}`,
        image_link: `https://shop.vitabox.com.tw/images/${sku.toLowerCase()}_800.jpg`,
        availability: "有現貨",
        brand: "Vitabox",
        price: "990 TWD",
      }
    );
  },

  // 商品關聯分析：依觀察窗回不同 lift / 共購顧客數（示範）
  getProductAssociations: (window: AssocWindow): Promise<ProductAssociation[]> => {
    const base: ProductAssociation[] = [
      { product_a: "高濃度魚油", product_b: "葉黃素", lift: 2.4, co_customers: 312 },
      { product_a: "膠原蛋白", product_b: "維他命 C", lift: 2.1, co_customers: 268 },
      { product_a: "益生菌", product_b: "膠原蛋白", lift: 1.8, co_customers: 205 },
      { product_a: "葉黃素", product_b: "B 群", lift: 1.5, co_customers: 196 },
      { product_a: "鋅錠", product_b: "維他命 C", lift: 1.7, co_customers: 142 },
      { product_a: "鈣鎂錠", product_b: "B 群", lift: 1.3, co_customers: 118 },
      { product_a: "鐵錠", product_b: "維他命 C", lift: 1.6, co_customers: 96 },
    ];
    // 窗越長：共購人數越多、lift 略降；同一筆訂單：人數最少、lift 最高。
    const factor: Record<AssocWindow, { c: number; l: number }> = {
      same_order: { c: 0.5, l: 1.15 },
      "30d": { c: 0.8, l: 1.05 },
      "60d": { c: 1, l: 1 },
      "90d": { c: 1.3, l: 0.92 },
    };
    const f = factor[window];
    const rows = base.map((r) => ({
      ...r,
      lift: +(r.lift * f.l).toFixed(2),
      co_customers: Math.round(r.co_customers * f.c),
    }));
    return delay(rows);
  },

  // AI 資料查詢（單一頁＋來源切換，回應沿用 Ga4QueryResponse 型）
  queryMcp: (source: AiQuerySource, text: string, _model: string): Promise<Ga4QueryResponse> => {
    const dates = Array.from({ length: 7 }, (_, i) => `2026-06-${String(i + 10).padStart(2, "0")}`);
    const presets: Record<AiQuerySource, Ga4QueryResponse> = {
      ga4: {
        narrative: `（Demo 示範,未實際查詢。）你問:「${text}」。過去 7 天工作階段週末走高,06-16 為高點。`,
        table: { columns: ["date", "sessions"], rows: dates.map((d, i) => ({ date: d, sessions: String(3000 + i * 120) })), metric_types: { sessions: "TYPE_INTEGER" } },
        chart: { type: "line", x: "date", series: ["sessions"] },
        error: null,
      },
      google_ads: {
        narrative: `（Demo 示範。）你問:「${text}」。品牌字 ROAS 最高,一般字成本偏高建議調整出價。`,
        table: { columns: ["campaign", "cost", "roas"], rows: [{ campaign: "品牌字", cost: "12,400", roas: "6.8" }, { campaign: "保健品通用字", cost: "28,900", roas: "2.1" }, { campaign: "競品字", cost: "9,300", roas: "1.4" }], metric_types: { roas: "TYPE_FLOAT" } },
        chart: { type: "bar", x: "campaign", series: ["roas"] },
        error: null,
      },
      meta_ads: {
        narrative: `（Demo 示範。）你問:「${text}」。素材 A CTR 下滑,疑似疲乏,建議汰換。`,
        table: { columns: ["adset", "ctr", "spend"], rows: [{ adset: "新客-情境影片", ctr: "1.8", spend: "18,200" }, { adset: "再行銷-輪播", ctr: "3.2", spend: "9,600" }, { adset: "Lookalike-1%", ctr: "2.4", spend: "14,100" }], metric_types: { ctr: "TYPE_FLOAT" } },
        chart: { type: "bar", x: "adset", series: ["ctr"] },
        error: null,
      },
      search_console: {
        narrative: `（Demo 示範。）你問:「${text}」。「葉黃素 推薦」曝光高但點擊率偏低,建議優化標題。`,
        table: { columns: ["query", "clicks", "impressions", "ctr"], rows: [{ query: "葉黃素 推薦", clicks: "320", impressions: "12,400", ctr: "2.6" }, { query: "魚油 ptt", clicks: "210", impressions: "5,800", ctr: "3.6" }], metric_types: { ctr: "TYPE_FLOAT" } },
        chart: { type: "bar", x: "query", series: ["clicks"] },
        error: null,
      },
      cross: {
        narrative: `（Demo 示範:跨平台彙整。）你問:「${text}」。各渠道真實 ROAS:再行銷 > 品牌字 > Meta 新客。`,
        table: { columns: ["channel", "spend", "roas"], rows: [{ channel: "Google 再行銷", spend: "9,600", roas: "5.4" }, { channel: "Google 品牌字", spend: "12,400", roas: "6.8" }, { channel: "Meta 新客", spend: "18,200", roas: "1.9" }, { channel: "LINE 廣告", spend: "6,300", roas: "2.7" }], metric_types: { roas: "TYPE_FLOAT" } },
        chart: { type: "bar", x: "channel", series: ["roas"] },
        error: null,
      },
    };
    return delay(presets[source]);
  },

  // Lookalike：建立類似受眾（示範）
  buildLookalike: (payload: LookalikePayload): Promise<LookalikeResult> => {
    const baseByPlatform: Record<string, number> = { meta: 240000, google: 180000, line: 120000 };
    const ratio = payload.auto ? 8 : payload.ratio ?? 5;
    const count = Math.round((baseByPlatform[payload.platform] ?? 150000) * (ratio / 100));
    return delay({ platform: payload.platform, status: "done", count });
  },

  // 通知中心：AI 每日自動產出的洞察
  getNotifications: (): Promise<Notification[]> =>
    delay(notifications.map((n) => ({ ...n }))),
  reactNotification: (
    id: string,
    feedback: NotificationFeedback | null
  ): Promise<Notification> => {
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, feedback } : n
    );
    return delay({ ...(notifications.find((n) => n.id === id) as Notification) });
  },
  markNotificationsRead: (ids: string[]): Promise<{ updated: number }> => {
    const set = new Set(ids);
    notifications = notifications.map((n) =>
      set.has(n.id) ? { ...n, read: true } : n
    );
    return delay({ updated: ids.length });
  },

  // 素材疲勞偵測（示範）：依時間範圍與比較基準回趨勢、素材表現與 AI 統整
  getCreativeFatigue: (filters: FatigueFilters): Promise<CreativeFatigueData> => {
    // 時間軸：7天=逐日、30天=逐週、半年=逐月
    const axis =
      filters.range === "7d"
        ? Array.from({ length: 7 }, (_, i) => `06-${String(i + 16).padStart(2, "0")}`)
        : filters.range === "30d"
          ? ["第 1 週", "第 2 週", "第 3 週", "第 4 週"]
          : ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月"];
    // 本期 CTR 緩降(疲勞),比較期較平。前一年同期基準略低。
    const compareBase = filters.compare === "prev_year" ? 2.2 : 2.6;
    const series = axis.map((label, i) => ({
      label,
      current: +(2.9 - i * 0.18).toFixed(2),
      compare: +(compareBase - i * 0.03).toFixed(2),
    }));

    const all: CreativeRow[] = [
      { creative: "情境影片 A", platform: "Meta", objective: "轉換", placement: "動態消息", ctr: 1.6, ctr_delta: -34, status: "fatigued" },
      { creative: "開箱輪播", platform: "Meta", objective: "流量", placement: "限時動態", ctr: 2.1, ctr_delta: -12, status: "watch" },
      { creative: "成分教育圖文", platform: "Meta", objective: "互動", placement: "動態消息", ctr: 3.0, ctr_delta: 8, status: "healthy" },
      { creative: "搜尋文字 A", platform: "Google", objective: "轉換", placement: "搜尋", ctr: 4.2, ctr_delta: 3, status: "healthy" },
      { creative: "多媒體橫幅", platform: "Google", objective: "觸及", placement: "多媒體", ctr: 0.9, ctr_delta: -28, status: "fatigued" },
      { creative: "購物廣告", platform: "Google", objective: "轉換", placement: "購物", ctr: 2.8, ctr_delta: -6, status: "watch" },
      { creative: "LINE 主視覺", platform: "LINE", objective: "觸及", placement: "聊天列表", ctr: 1.3, ctr_delta: -18, status: "watch" },
      { creative: "LINE 優惠卡片", platform: "LINE", objective: "轉換", placement: "貼文串", ctr: 2.4, ctr_delta: 5, status: "healthy" },
    ];
    const creatives = all.filter(
      (c) =>
        (!filters.platform || c.platform === filters.platform) &&
        (!filters.objective || c.objective === filters.objective) &&
        (!filters.placement || c.placement === filters.placement)
    );

    const fatiguedCount = creatives.filter((c) => c.status === "fatigued").length;
    const summary =
      `（示範 AI 統整）本期整體 CTR 較${filters.compare === "prev_year" ? "去年同期" : "前一段時間"}下滑,` +
      `共有 ${fatiguedCount} 組素材進入疲勞區(CTR 衰退逾 25%),建議優先汰換 Meta「情境影片 A」與 Google「多媒體橫幅」,` +
      `並把預算移往仍健康的搜尋與成分教育素材。`;

    return delay({ series, creatives, summary });
  },

  // 歸因分析（示範資料）
  getAttribution: (): Promise<AttributionData> =>
    delay({
      paths: [
        { path: "廣告 → EDM → LINE → 成交", conversions: 312, contribution_pct: 34 },
        { path: "廣告 → 成交", conversions: 268, contribution_pct: 29 },
        { path: "EDM → LINE → 成交", conversions: 196, contribution_pct: 21 },
        { path: "LINE → 成交", conversions: 148, contribution_pct: 16 },
      ],
      path_narrative:
        "（示範分析）多通路路徑中，廣告開啟認知、EDM 與 LINE 推動轉換；其中「廣告→EDM→LINE→成交」貢獻最高，建議在 EDM 與 LINE 環節加強個人化內容以提升收斂率。",
      fatigue: Array.from({ length: 7 }, (_, i) => ({
        date: `2026-06-${String(i + 14).padStart(2, "0")}`,
        ctr: +(2.8 - i * 0.18).toFixed(2),
        open_rate: +(31 - i * 1.2).toFixed(1),
      })),
    }),
};
