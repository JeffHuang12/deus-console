// 受眾管理的資料定義:Shopline Customer 欄位目錄、運算子、智慧分群、RFM 分群與參考表、NL 範例。
// 本期全為前端靜態定義(對應 Shopline schema),人數為 mock 示範值。

// --- 欄位型別與運算子 ---
export type FieldType = "bool" | "string" | "int" | "money" | "date" | "order";

export interface FieldDef {
  key: string; // Shopline 欄位名
  label: string; // 顯示名
  type: FieldType;
  options?: { label: string; value: string }[]; // string 類選項
  hint?: string; // 補充說明(如金額單位)
}

export interface FieldGroup {
  group: string;
  fields: FieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    group: "會員與等級狀態",
    fields: [
      { key: "is_member", label: "是否為會員", type: "bool" },
      {
        key: "membership_tier_name",
        label: "會員等級名稱",
        type: "string",
        options: ["一般會員", "VIP", "VVIP"].map((v) => ({ label: v, value: v })),
      },
      { key: "membership_tier_level", label: "會員等級排序", type: "int", hint: "數字越大等級越高" },
      { key: "tier_expires_at", label: "會員資格到期日", type: "date" },
    ],
  },
  {
    group: "消費價值與忠誠度",
    fields: [
      { key: "order_count", label: "歷史總訂單數", type: "int" },
      { key: "orders_total_sum_cents", label: "歷史總消費金額", type: "money", hint: "以元為單位輸入" },
      { key: "member_point_balance", label: "剩餘紅利點數", type: "int" },
      { key: "credit_balance", label: "帳戶購物金餘額", type: "money", hint: "以元為單位輸入" },
    ],
  },
  {
    group: "基本輪廓",
    fields: [
      {
        key: "gender",
        label: "性別",
        type: "string",
        options: [
          { label: "男 (M)", value: "M" },
          { label: "女 (F)", value: "F" },
        ],
      },
      { key: "birth_month", label: "生日月份", type: "int", hint: "1 ~ 12" },
      { key: "birth_year", label: "出生年份", type: "int" },
    ],
  },
  {
    group: "行銷互動與聯絡狀態",
    fields: [
      { key: "is_subscribed_marketing_email", label: "是否訂閱行銷 Email", type: "bool" },
      { key: "is_blacklisted", label: "是否為黑名單", type: "bool" },
      { key: "mobile_phone_verified", label: "手機是否驗證", type: "bool" },
      { key: "email_verified", label: "信箱是否驗證", type: "bool" },
    ],
  },
  {
    group: "訂單行為",
    fields: [{ key: "purchased_product", label: "曾於期間購買產品", type: "order" }],
  },
];

// 依型別回傳可用運算子
export const OPERATORS: Record<FieldType, { label: string; value: string }[]> = {
  bool: [{ label: "等於", value: "eq" }],
  string: [
    { label: "等於", value: "eq" },
    { label: "不等於", value: "neq" },
    { label: "包含", value: "contains" },
  ],
  int: [
    { label: "≥", value: "gte" },
    { label: "≤", value: "lte" },
    { label: "=", value: "eq" },
    { label: "介於", value: "between" },
  ],
  money: [
    { label: "≥", value: "gte" },
    { label: "≤", value: "lte" },
    { label: "介於", value: "between" },
  ],
  date: [
    { label: "早於", value: "before" },
    { label: "晚於", value: "after" },
    { label: "N 天內", value: "within_days" },
  ],
  order: [{ label: "期間內購買", value: "purchased_in" }],
};

export const BOOL_OPTIONS = [
  { label: "是", value: "true" },
  { label: "否", value: "false" },
];

export const PRODUCT_OPTIONS = ["葉黃素", "魚油", "益生菌", "維他命C", "膠原蛋白", "鈣片"].map(
  (v) => ({ label: v, value: v })
);

// --- 智慧分群(9) ---
export interface SmartSegment {
  key: string;
  name: string;
  repurchase: string; // 回購週期(定義)
  frequency: string; // 消費次數(定義)
  monetary: string; // 累積消費金額(定義)
  // 表格指標(mock)
  count: number; // 人數
  totalOrders: number; // 總消費次數
  avgOrders: number; // 平均消費次數
  totalSpend: number; // 總消費金額
  avgSpend: number; // 平均消費金額
  clv: number; // 平均顧客終身價值
  cycle: string; // 購買週期
}

export const SMART_SEGMENTS: SmartSegment[] = [
  { key: "top_core", name: "Top 核心顧客", repurchase: "近期消費 或 準備回購", frequency: "Top 消費", monetary: "累積消費 > Top 10%", count: 8420, totalOrders: 92600, avgOrders: 11.0, totalSpend: 84200000, avgSpend: 10000, clv: 26800, cycle: "38 天" },
  { key: "top_dormant", name: "Top 休眠顧客", repurchase: "久未消費(含有/無互動)", frequency: "Top 消費", monetary: "累積消費 > Top 10%", count: 3110, totalOrders: 28000, avgOrders: 9.0, totalSpend: 27990000, avgSpend: 9000, clv: 21500, cycle: "120 天" },
  { key: "active", name: "活躍顧客", repurchase: "近期消費", frequency: "重複消費", monetary: "累積消費 ≤ Top 10%", count: 21560, totalOrders: 86240, avgOrders: 4.0, totalSpend: 64680000, avgSpend: 3000, clv: 9200, cycle: "52 天" },
  { key: "ready_repurchase", name: "準備回購顧客", repurchase: "準備回購 或 久未消費但有互動", frequency: "重複消費", monetary: "累積消費 ≤ Top 10%", count: 18230, totalOrders: 63800, avgOrders: 3.5, totalSpend: 47400000, avgSpend: 2600, clv: 7800, cycle: "76 天" },
  { key: "sleeping", name: "沈睡顧客", repurchase: "久未消費且無互動", frequency: "重複消費", monetary: "累積消費 ≤ Top 10%", count: 26740, totalOrders: 80220, avgOrders: 3.0, totalSpend: 53480000, avgSpend: 2000, clv: 5400, cycle: "210 天" },
  { key: "new_buyer", name: "新消費顧客", repurchase: "近期消費", frequency: "單次消費", monetary: "累積消費 ≤ Top 10%", count: 24965, totalOrders: 24965, avgOrders: 1.0, totalSpend: 37447500, avgSpend: 1500, clv: 1500, cycle: "—" },
  { key: "potential_repurchase", name: "潛在回購顧客", repurchase: "準備回購 或 久未消費但有互動", frequency: "單次消費", monetary: "累積消費 ≤ Top 10%", count: 12480, totalOrders: 12480, avgOrders: 1.0, totalSpend: 18720000, avgSpend: 1500, clv: 1500, cycle: "—" },
  { key: "lost", name: "流失顧客", repurchase: "久未消費且無互動", frequency: "單次消費", monetary: "累積消費 ≤ Top 10%", count: 45620, totalOrders: 45620, avgOrders: 1.0, totalSpend: 54744000, avgSpend: 1200, clv: 1200, cycle: "—" },
  { key: "engaged", name: "互動顧客", repurchase: "回購週期 3 倍時間內曾互動", frequency: "無消費", monetary: "無消費", count: 9870, totalOrders: 0, avgOrders: 0, totalSpend: 0, avgSpend: 0, clv: 0, cycle: "—" },
];

// 廣告受眾建立:各通路的比對欄位、預設、是否需手動命名、清洗規則
export const AD_FREQUENCIES = ["手動", "每日", "每週", "每月"];

export interface AdChannelConfig {
  key: string;
  name: string;
  fields: { label: string; value: string }[];
  defaults: string[];
  requireName: boolean; // 建立時是否需手動輸入受眾名稱
  cleanRules: string[]; // 清洗規則說明(Phase 2 實際套用)
}

export const AD_CHANNEL_CONFIG: AdChannelConfig[] = [
  {
    key: "meta",
    name: "建立 Meta 受眾",
    fields: [
      { label: "EMAIL", value: "email" },
      { label: "PHONE", value: "phone" },
      { label: "Life Time Value", value: "ltv" },
    ],
    defaults: ["email", "phone"],
    requireName: true,
    cleanRules: [
      "Email / Phone 一律轉為全小寫",
      "去除前後及中間所有空格",
      "電話需含國碼(台灣 886),去除開頭的 0 與「-」,例:886912345678",
    ],
  },
  {
    key: "google",
    name: "建立 Google 受眾",
    fields: [
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
    ],
    defaults: ["email", "phone"],
    requireName: false,
    cleanRules: [
      "Email:去除前後空白、轉全小寫,再以 SHA-256 加密",
      "Phone:E.164 格式(含 + 國碼),去除空格與破折號,再以 SHA-256 加密",
    ],
  },
  {
    key: "line",
    name: "建立 LINE 受眾",
    fields: [
      { label: "Email", value: "email" },
      { label: "手機", value: "phone" },
      { label: "外部會員 ID", value: "external_id" },
    ],
    defaults: ["email"],
    requireName: false,
    cleanRules: [],
  },
];

// 推播:平台與範本(依平台)
export const PUSH_PLATFORMS = [
  { label: "EDM", value: "edm" },
  { label: "SMS", value: "sms" },
  { label: "LINE", value: "line" },
];

export const PUSH_TEMPLATES: Record<string, { label: string; value: string }[]> = {
  edm: [
    { label: "母親節檔期 EDM", value: "edm_mday" },
    { label: "新品上市 EDM", value: "edm_newproduct" },
    { label: "會員回饋 EDM", value: "edm_member" },
  ],
  sms: [
    { label: "回購提醒 SMS", value: "sms_repurchase" },
    { label: "購物金到期 SMS", value: "sms_credit" },
  ],
  line: [
    { label: "新品上市 LINE", value: "line_newproduct" },
    { label: "限時優惠 LINE", value: "line_flashsale" },
  ],
};

// --- RFM 智慧分群(9 RANK) ---
export interface RfmSegment {
  key: string;
  rank: number;
  name: string;
  rfm: string; // 代表性 R/F/M
  definition: string;
  action: string;
}

export const RFM_SEGMENTS: RfmSegment[] = [
  { key: "rfm_important_value", rank: 1, name: "重要價值會員", rfm: "R3 · F3 · M3~2", definition: "剛消費過且穩定回購,消費力高", action: "個性化產品推薦;特殊模板、提前了解活動" },
  { key: "rfm_high_potential", rank: 2, name: "高潛力會員", rfm: "R3 · F3~2 · M3~1", definition: "剛消費過且穩定回購,但消費力偏低", action: "推薦提升客單的產品或組合;強調產品優勢" },
  { key: "rfm_important_keep", rank: 3, name: "重要保持會員", rfm: "R3 · F2~1", definition: "剛消費過,購買頻率穩定", action: "提升客單組合;呼籲忠誠、帶入會員回饋" },
  { key: "rfm_high_attention", rank: 4, name: "高關注會員", rfm: "R2 · F3~2 · M3~2", definition: "消費力較高,可能準備回購", action: "引人注目的活動提醒;個性化產品推薦" },
  { key: "rfm_low_attention", rank: 5, name: "低關注會員", rfm: "R2 · F2~1 · M低", definition: "消費金額較低,可能準備回購", action: "僅露出統一活動資訊" },
  { key: "rfm_high_wakeup", rank: 6, name: "高喚醒會員", rfm: "R1 · F3~2 · M3~1", definition: "已久未回來,但兩倍週期內有高頻/高消費", action: "記憶喚醒、創造新記憶、活動檔期誘因" },
  { key: "rfm_low_wakeup", rank: 7, name: "低喚醒會員", rfm: "R1 · F2~1", definition: "已久未回來,兩倍週期內有消費紀錄", action: "品牌新成就切入;露出統一活動資訊" },
  { key: "rfm_high_value_new", rank: 8, name: "高價值新客", rfm: "一次消費 ≥ 3,207", definition: "單次消費超過新客平均的新客", action: "活動檔期升級會員;延伸品項推薦" },
  { key: "rfm_low_value_new", rank: 9, name: "低價值新客", rfm: "一次消費 < 3,207", definition: "單次消費低於新客平均的新客", action: "露出統一活動資訊;延伸品項推薦" },
];

// RFM 級距參考
export const RFM_TIERS = [
  { metric: "R(距上次回購天數)", avg: "188.348", t1: "n ≤ 56", t2: "57 ~ 229", t3: "230 ≤ n" },
  { metric: "F(消費頻率/次數)", avg: "6.287", t1: "13 ≤ n", t2: "3 ~ 12", t3: "n ≤ 2" },
  { metric: "M(累積總消費金額)", avg: "28,708.641", t1: "57,418 ≤ n", t2: "14,354 ~ 57,417", t3: "n ≤ 14,353" },
];

// 常態發送規則(摘要)
export const RFM_SEND_RULES = [
  { rank: "1-2", group: "重要價值 / 高潛力", rule: "不發推播;有新品時溝通;每月一次品牌大使溝通", target: "發揮轉換、帶新客最大化價值" },
  { rank: "3", group: "重要保持", rule: "每週推播 + 自動化產品推薦;每兩個月推廣會員計畫", target: "成為更穩定的客源" },
  { rank: "4", group: "高關注", rule: "不發推播;每月一次多件優惠及會員折扣", target: "讓他知道品牌在乎他" },
  { rank: "5", group: "低關注", rule: "以不流失為原則", target: "確保接收品牌更新與回購提醒" },
  { rank: "6-7", group: "高/低喚醒", rule: "不發推播;每月一次喚醒劇本(50 元購物金),多用 SMS", target: "把曾經的客人找回來" },
  { rank: "8-9", group: "高/低價值新客", rule: "每週推播 + 個性化推薦", target: "變成穩定回購客" },
];

// 發送平台對應
export const RFM_PLATFORMS = [
  { rank: "RANK 1-3", platform: "INSIDER" },
  { rank: "RANK 4-5", platform: "MAAC" },
  { rank: "RANK 6-7", platform: "PREMIUM" },
];

// --- 自然語言範例 ---
export const NL_EXAMPLES = [
  "尋找過去 1 個月有購買葉黃素的使用者",
  "90 天未回購保健品的女性,30-45 歲",
  "VIP 以上但未訂閱行銷 Email 的會員",
  "購物金餘額大於 0 且非黑名單的客人",
];

// --- Lookalike（類似受眾）平台設定 ---
// 各平台範圍語意不同：Meta/LINE 用百分比 slider,Google 用三段式。
export interface LookalikeConfig {
  key: "meta" | "google" | "line";
  name: string;
  mode: "slider" | "segments";
  min?: number;
  max?: number;
  defaultRatio?: number;
  note: string;
  segments?: { label: string; value: string; hint: string }[];
  allowAuto?: boolean;
}

export const LOOKALIKE_CONFIG: LookalikeConfig[] = [
  {
    key: "meta",
    name: "Meta 類似受眾",
    mode: "slider",
    min: 1,
    max: 10,
    defaultRatio: 1,
    note: "1% 代表目標國家內輪廓最相近的受眾(精準度最高),10% 範圍最廣。",
  },
  {
    key: "google",
    name: "Google 類似區隔",
    mode: "segments",
    segments: [
      { label: "NARROW", value: "NARROW", hint: "約涵蓋目標地區 2.5% 用戶(最精準)" },
      { label: "BALANCED", value: "BALANCED", hint: "約 5%" },
      { label: "BROAD", value: "BROAD", hint: "約 10%(最廣)" },
    ],
    note: "Google 以三段式控制相似受眾規模。",
  },
  {
    key: "line",
    name: "LINE 類似受眾",
    mode: "slider",
    min: 1,
    max: 15,
    defaultRatio: 1,
    allowAuto: true,
    note: "1%–15% 設定範圍;「自動」交由 LAP 系統動態評估最佳受眾規模。",
  },
];

// 目標市場/國家(類似受眾按國家計算)
export const LOOKALIKE_MARKETS = [
  { label: "台灣", value: "TW" },
  { label: "香港", value: "HK" },
  { label: "日本", value: "JP" },
  { label: "馬來西亞", value: "MY" },
  { label: "新加坡", value: "SG" },
];

// 種子類型(合併「高 LTV 客戶」與「預測型高 LTV 新客」)
export const LOOKALIKE_SEED_TYPES = [
  { label: "高 LTV 客戶(既有名單為種子)", value: "high_ltv" },
  { label: "預測高 LTV 新客(ML 預測機率為種子)", value: "predicted_ltv" },
];

// --- 有官方資料查詢 MCP 的資料源(綁定頁標「支援 AI 查詢」) ---
export const OFFICIAL_MCP = new Set(["ga4", "google_ads", "meta_ads", "search_console"]);
