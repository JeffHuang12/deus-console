// 功能總覽的單一事實來源（Single Source of Truth）。
// 功能總覽頁、選單狀態標籤、各頁狀態皆讀此檔。
// 對應 PHASE2_PLAN_AND_FEATURE_INVENTORY.md；如需更新，先改這裡。
//
// status：live=已上線（UI 完成，多為 mock）/ partial=部分對應 / planned=規劃中
// placement：此功能落在哪個頁面（總覽頁據此提供跳轉）
// threshold：PDF 對 AI 進階功能標的導入門檻 low/mid/high

export type FeatureGroup =
  | "A" | "B" | "C" | "D"
  | "AxC" | "AxB" | "AxD" | "BxC" | "BxD" | "CxD";

export type FeatureStatus = "live" | "partial" | "planned";
export type FeatureThreshold = "low" | "mid" | "high";

export type FeaturePlacement =
  | "catalog" | "predictions" | "conversations" | "merchandising" | "attribution"
  | "associations" | "ai-query" | "fatigue"
  | "binding" | "analysis" | "audience" | "comments" | "monitoring" | "prompt" | "ga4";

// 預期效益類型（行銷視角：這功能動到哪條營收槓桿）
export type ValueTag = "roas" | "save_budget" | "repurchase" | "save_time";

export interface FeatureItem {
  id: string;
  group: FeatureGroup;
  name: string;
  descEng: string; // 工程視角描述：資料來源 -> 處理方式 -> 輸出/接點
  acceptance: string; // 驗收標準
  threshold?: FeatureThreshold;
  status: FeatureStatus;
  placement: FeaturePlacement;
  valueTag?: ValueTag; // 預期效益類型
  effect?: string; // 一句話預期效益（取自 PDF 數字）
}

export const VALUE_TAG_LABELS: Record<ValueTag, string> = {
  roas: "提升 ROAS",
  save_budget: "省預算",
  repurchase: "提高回購",
  save_time: "省工時",
};

export const VALUE_TAG_COLORS: Record<ValueTag, string> = {
  roas: "magenta",
  save_budget: "green",
  repurchase: "geekblue",
  save_time: "cyan",
};

export const GROUP_LABELS: Record<FeatureGroup, string> = {
  A: "A 單系統｜EC 訂單資料",
  B: "B 單系統｜ERP/CRM 會員及商品",
  C: "C 單系統｜廣告系統",
  D: "D 單系統｜溝通系統",
  AxC: "A×C｜EC 訂單 × 廣告",
  AxB: "A×B｜EC 訂單 × ERP/CRM",
  AxD: "A×D｜EC 訂單 × 溝通",
  BxC: "B×C｜ERP/CRM × 廣告",
  BxD: "B×D｜ERP/CRM × 溝通",
  CxD: "C×D｜廣告 × 溝通",
};

export const STATUS_LABELS: Record<FeatureStatus, string> = {
  live: "已上線",
  partial: "部分對應",
  planned: "規劃中",
};

export const STATUS_COLORS: Record<FeatureStatus, string> = {
  live: "green",
  partial: "gold",
  planned: "default",
};

export const THRESHOLD_LABELS: Record<FeatureThreshold, string> = {
  low: "門檻低",
  mid: "門檻中",
  high: "門檻高",
};

// 各 placement 對應的路由（總覽頁跳轉用）。catalog 代表「僅總覽呈現、無獨立頁」。
export const PLACEMENT_ROUTE: Record<FeaturePlacement, string | null> = {
  catalog: null,
  predictions: "/predictions",
  conversations: "/conversations",
  merchandising: "/merchandising",
  attribution: "/attribution",
  associations: "/product-associations",
  "ai-query": "/ai-query",
  fatigue: "/creative-fatigue",
  binding: "/binding",
  analysis: "/analysis",
  audience: "/audience",
  comments: "/comments",
  monitoring: "/monitoring",
  prompt: "/prompt",
  ga4: "/ga4-query",
};

export const PLACEMENT_LABELS: Record<FeaturePlacement, string> = {
  catalog: "僅總覽呈現",
  predictions: "預測模型中心",
  conversations: "客服對話中心",
  merchandising: "商品與庫存中心",
  attribution: "歸因分析",
  associations: "商品關聯分析",
  "ai-query": "AI 資料查詢",
  fatigue: "素材疲勞偵測",
  binding: "數據綁定",
  analysis: "分析中心",
  audience: "受眾管理",
  comments: "留言管理",
  monitoring: "監測中心",
  prompt: "Prompt 互動",
  ga4: "GA4 查詢",
};

export const FEATURE_CATALOG: FeatureItem[] = [
  // A：EC 訂單資料
  { id: "a1", group: "A", name: "CLV 預測模型", descEng: "BQ 訂單表特徵工程 -> 迴歸/GBDT 離線訓練 -> batch 推論 12 個月 LTV，寫回預測表供出價模組讀", acceptance: "輸入會員/訂單特徵，輸出預測金額與信賴區間，可匯出供出價使用", threshold: "high", status: "planned", placement: "predictions" },
  { id: "a2", group: "A", name: "流失預測", descEng: "BQ 訂單/互動表建標籤 -> 分類模型 batch 推論 -> 流失機率寫回 BQ，觸發推播", acceptance: "輸出流失機率名單，可串接挽回流程", status: "planned", placement: "predictions" },
  { id: "a3", group: "A", name: "回購時間點預測", descEng: "個別會員訂單時序 -> 存活/迴歸模型 -> 下次購買日寫回 BQ 供觸發排程", acceptance: "每會員輸出預測購買日，誤差可回測", threshold: "mid", status: "planned", placement: "predictions" },
  { id: "a4", group: "A", name: "退貨/詐欺訂單預警", descEng: "下單特徵（地址/付款/商品組合）訓分類器 -> 訂單寫入即時評分輸出風險標記", acceptance: "標記高風險訂單並輸出原因欄位", status: "planned", placement: "predictions" },
  { id: "a5", group: "A", name: "訂單摘要生成（LLM）", descEng: "BQ 聚合單一會員訂單統計 -> llm.py 生成中文摘要字串，供客服/AM 讀", acceptance: "輸入會員 ID，輸出消費次數/偏好/客單的中文摘要", status: "planned", placement: "conversations" },

  // B：ERP/CRM
  { id: "b1", group: "B", name: "LINE 對話自動標籤", descEng: "拉 LINE 對話文本 -> llm.py 分類 -> 標籤 JSON 回寫 CRM/BQ；需 LINE OAuth", acceptance: "每段對話輸出標籤並寫回，可人工修正", status: "partial", placement: "conversations" },
  { id: "b2", group: "B", name: "客服對話摘要", descEng: "對話結束 -> llm.py 生 3 行摘要 -> 存對話紀錄表", acceptance: "對話結束自動產生 3 行摘要", status: "planned", placement: "conversations" },
  { id: "b3", group: "B", name: "產品描述自動生成", descEng: "商品主檔規格 + 品牌語調 prompt -> llm.py 生多版文案 -> 回寫商品表", acceptance: "輸入規格，輸出可編輯文案多版本", status: "planned", placement: "merchandising" },
  { id: "b4", group: "B", name: "產品圖片標籤化", descEng: "商品圖 -> 視覺模型抽顏色/款式/場景標籤 -> 補商品 metadata", acceptance: "上傳圖片輸出結構化標籤", status: "planned", placement: "merchandising" },
  { id: "b5", group: "B", name: "會員偏好自然語言查詢", descEng: "自然語言 -> llm.py 生受控 SQL（schema 白名單）-> bigquery_client 執行回名單；建議掛 MCP", acceptance: "輸入自然語言，回符合條件名單與所用 SQL", threshold: "high", status: "partial", placement: "prompt" },
  { id: "b6", group: "B", name: "客訴自動分類與升級", descEng: "客訴文本 -> llm.py 判嚴重度＋產路由建議 -> 寫派工紀錄", acceptance: "客訴輸入後輸出分類、派工對象、升級建議", status: "partial", placement: "conversations" },

  // C：廣告系統
  { id: "c1", group: "C", name: "受眾文字描述 → 受眾名單", descEng: "自然語言 -> llm.py（/audience/parse）轉結構化條件 -> bigquery_client 取符合會員", acceptance: "輸入描述，解析成結構化條件並可套用", status: "live", placement: "audience" },
  { id: "c2", group: "C", name: "跨平台預算自動分配建議", descEng: "各平台 API 取即時 ROAS 彙整 BQ -> 規則/最佳化算建議分配（不自動執行）", acceptance: "輸出各平台建議預算與依據", status: "planned", placement: "predictions" },
  { id: "c3", group: "C", name: "廣告報表自然語言摘要", descEng: "數據區塊 bigquery_client SQL 規則計算 -> llm.py refine_insight 潤飾成摘要/建議段落", acceptance: "報表詳情含執行摘要/優化建議文字段落", status: "live", placement: "analysis", valueTag: "save_time", effect: "週報自動產出，省人工彙整時間" },
  { id: "c4", group: "C", name: "競品廣告偵測與分析", descEng: "Ad Library/Transparency API 或 Firecrawl 抓素材 -> llm.py 析訴求方向", acceptance: "輸入競品，輸出素材訴求分析", status: "planned", placement: "merchandising" },
  { id: "c5", group: "C", name: "GA4 異常偵測", descEng: "GA4 取時序指標 -> 統計（z-score/變化率）判異常 -> llm.py 推測原因，接 monitoring 排程", acceptance: "異常觸發告警，附推測原因", status: "partial", placement: "monitoring" },
  { id: "c6", group: "C", name: "LLM 自動回覆臉書廣告留言", descEng: "留言文本 -> llm.py 依情緒生草稿 -> Meta 粉專 OAuth 回送", acceptance: "多選留言產生草稿，可編輯後送出", status: "live", placement: "comments" },

  // D：溝通系統
  { id: "d1", group: "D", name: "EDM 主旨優化", descEng: "llm.py 產多版主旨 -> 結合 BQ 歷史開信率排序預測最佳版本", acceptance: "輸出多版本主旨與預測開信率排序", status: "planned", placement: "audience" },
  { id: "d2", group: "D", name: "個人化內容動態生成", descEng: "會員 CRM 標籤 -> llm.py 即時組裝 EDM 區塊內容 -> 發送 API", acceptance: "同檔期不同會員輸出不同賣點內容", threshold: "high", status: "partial", placement: "predictions" },
  { id: "d3", group: "D", name: "發送時間個人化預測", descEng: "個別會員開信/點擊時序建模 -> 輸出最佳發送時段供排程", acceptance: "每會員輸出建議發送時段", threshold: "high", status: "partial", placement: "predictions" },
  { id: "d4", group: "D", name: "負面情緒偵測", descEng: "對話文本 -> llm.py 情緒分類 -> 偵測不滿即標記並通知真人客服", acceptance: "偵測到負面語氣即標記並通知", status: "planned", placement: "conversations" },

  // A×C
  { id: "axc1", group: "AxC", name: "高 LTV 客戶 Lookalike", descEng: "BQ 取年消費前 20% 為種子 -> 各平台 Lookalike/Custom Audience API（oauth adapter）建相似受眾", acceptance: "選種子分群→建立 Lookalike→輸出狀態", status: "partial", placement: "audience", valueTag: "roas", effect: "Lookalike CAC 通常比廣投低 30-50%" },
  { id: "axc2", group: "AxC", name: "排除已購客戶", descEng: "受眾條件加 NOT EXISTS 訂單子查詢 -> 建立平台排除受眾", acceptance: "受眾建立可設排除條件並生效", status: "partial", placement: "audience", valueTag: "save_budget", effect: "省 10-20% 無效曝光預算" },
  { id: "axc3", group: "AxC", name: "真實 ROAS 計算", descEng: "BQ JOIN 訂單金額表與廣告花費表 -> 依 campaign/素材/SKU 聚合算 ROAS", acceptance: "報表呈現真實 ROAS（非平台自報）", status: "partial", placement: "analysis", valueTag: "roas", effect: "用真實 ROAS 取代平台自報，避免高估" },
  { id: "axc4", group: "AxC", name: "依品項分眾再行銷", descEng: "依購買品項 BQ 分群 -> 建品項對應再行銷受眾上傳平台", acceptance: "依購買品項輸出再行銷分眾", status: "partial", placement: "audience" },
  { id: "axc5", group: "AxC", name: "歸因路徑語意分析", descEng: "取事件路徑序列 -> llm.py 析中斷點輸出可讀優化建議", acceptance: "輸入路徑資料，輸出可讀建議", threshold: "low", status: "planned", placement: "attribution" },
  { id: "axc6", group: "AxC", name: "預測型 LTV Lookalike", descEng: "ML 預測新客 30 天高 LTV 機率 -> 取高機率名單作種子上傳平台", acceptance: "輸出高機率新客名單作種子", threshold: "mid", status: "partial", placement: "audience", valueTag: "roas", effect: "用預測高 LTV 新客作種子，提升相似受眾品質" },
  { id: "axc7", group: "AxC", name: "Campaign Summary（素材疲勞）", descEng: "監測素材時序指標 -> 規則偵測背離（CTR↑訂單金額↓）-> llm.py 解讀提示", acceptance: "偵測「CTR 升但金額降」並提示", threshold: "mid", status: "partial", placement: "analysis" },
  { id: "axc8", group: "AxC", name: "動態出價建議", descEng: "結合每對象預測 LTV -> 輸出建議出價上限（餵平台或人工）", acceptance: "每對象輸出建議出價", threshold: "mid", status: "planned", placement: "predictions" },
  { id: "axc9", group: "AxC", name: "流失預測 → 廣告挽回", descEng: "流失名單自動寫入再行銷受眾 + llm.py 生挽回文案", acceptance: "流失名單自動入受眾並附文案", threshold: "mid", status: "planned", placement: "predictions" },
  { id: "axc10", group: "AxC", name: "依貼標自動建廣告受眾", descEng: "CRM 標籤變動 -> oauth adapter 呼平台 API 建受眾", acceptance: "標籤→平台受眾自動建立", threshold: "mid", status: "partial", placement: "audience" },
  { id: "axc11", group: "AxC", name: "AI 素材生成＋訂單回饋閉環", descEng: "訂單特徵餵 llm.py 生素材 -> 依回收 ROAS 回訓素材偏好（feedback loop）", acceptance: "生成素材並依成效回饋迭代", threshold: "high", status: "planned", placement: "catalog" },

  // A×B
  { id: "axb1", group: "AxB", name: "RFM 分群即時更新", descEng: "訂單寫入事件（或排程）-> BQ RFM 重算 -> 回寫 CRM 標籤", acceptance: "訂單寫入觸發 RFM 重算並回寫", status: "partial", placement: "audience" },
  { id: "axb2", group: "AxB", name: "回購週期計算", descEng: "BQ 依品類 group by 算個別會員平均購買間隔 -> 存回 BQ 供觸發", acceptance: "輸出每會員回購週期供觸發", status: "partial", placement: "audience" },
  { id: "axb3", group: "AxB", name: "商品關聯分析", descEng: "BQ 算共現/關聯規則（market basket）-> 找買 A 後買 B 回寫推薦表", acceptance: "輸出關聯組合作推薦依據", status: "partial", placement: "associations", valueTag: "repurchase", effect: "找出可組合促銷的商品對，提升客單" },
  { id: "axb4", group: "AxB", name: "商品關聯因果推論", descEng: "在共現基礎上加因果推論 -> 區分升級購買 vs 湊單", acceptance: "輸出因果區分結果", threshold: "low", status: "planned", placement: "merchandising" },
  { id: "axb5", group: "AxB", name: "個別會員回購預測", descEng: "個別會員回購時序模型 -> 每會員輸出下次購買日，誤差 ±5-7 天", acceptance: "輸出預測購買日與誤差回測", threshold: "mid", status: "planned", placement: "predictions" },
  { id: "axb6", group: "AxB", name: "AI 自動標籤生成", descEng: "llm.py 綜合 BQ 訂單 + 客服對話 + 瀏覽行為 -> 生語意標籤回寫 CRM", acceptance: "輸出語意標籤回寫 CRM", threshold: "mid", status: "planned", placement: "predictions" },
  { id: "axb7", group: "AxB", name: "訂單異常偵測", descEng: "BQ 算退貨率/客單時序 -> 統計判異常區段 -> 接 monitoring 告警", acceptance: "偵測異常區段並告警", threshold: "mid", status: "partial", placement: "monitoring" },
  { id: "axb8", group: "AxB", name: "CLV 預測模型（首購分流）", descEng: "依首筆訂單行為預測 12 個月消費 -> 供首購後分流", acceptance: "首購後輸出 CLV 預測與分流", threshold: "mid", status: "planned", placement: "predictions" },
  { id: "axb9", group: "AxB", name: "會員自然語言查詢", descEng: "自然語言 -> llm.py 轉受控 SQL -> bigquery_client 執行回名單", acceptance: "輸入自然語言回名單與 SQL", threshold: "high", status: "partial", placement: "prompt" },

  // A×D
  { id: "axd1", group: "AxD", name: "訂單狀態通知", descEng: "監聽 Shopline 訂單事件（成立/付款/出貨/到貨）-> 依會員偏好通路經推送 API 發送", acceptance: "各節點觸發對應通路發送", status: "partial", placement: "audience" },
  { id: "axd2", group: "AxD", name: "棄單挽回", descEng: "偵測未完成結帳事件 -> 排程 1 小時 LINE、24 小時 EDM 推播", acceptance: "棄單觸發排程推播", status: "partial", placement: "audience", valueTag: "repurchase", effect: "通常可挽回 5-15% 棄單" },
  { id: "axd3", group: "AxD", name: "回購提醒", descEng: "排程讀回購週期表 -> 品項到期前 7 天觸發 LINE 推播", acceptance: "到期前自動提醒", status: "partial", placement: "audience" },
  { id: "axd4", group: "AxD", name: "首購後序列", descEng: "首購事件起多步排程（journey）-> 第 3/7/14/30 天各推不同模板", acceptance: "首購觸發多步序列", status: "partial", placement: "audience" },
  { id: "axd5", group: "AxD", name: "流失客喚回", descEng: "條件查詢（超回購週期 1.5 倍未購）-> 觸發發券 API", acceptance: "條件達成自動發券", status: "partial", placement: "audience" },
  { id: "axd6", group: "AxD", name: "VIP 專屬通知", descEng: "依會員等級條件 -> 觸發 LINE 一對一通知", acceptance: "依等級觸發專屬通知", status: "partial", placement: "audience" },
  { id: "axd7", group: "AxD", name: "負評客戶服務介入", descEng: "低評分訂單事件 -> 觸發派工客服，附訂單與會員脈絡", acceptance: "低評分觸發派工", status: "partial", placement: "conversations" },
  { id: "axd8", group: "AxD", name: "棄單原因推測＋話術", descEng: "llm.py 依棄單時商品/時段/行為 -> 推測原因標籤並生對應話術", acceptance: "輸出原因與話術", threshold: "mid", status: "planned", placement: "audience" },
  { id: "axd9", group: "AxD", name: "流失客喚回劇本生成", descEng: "llm.py 依客戶互動史 -> 生 3-5 步漸進喚回劇本", acceptance: "輸出多步劇本", threshold: "mid", status: "planned", placement: "audience" },
  { id: "axd10", group: "AxD", name: "訊息內容個人化生成", descEng: "依會員標籤 llm.py 即時組裝 EDM 賣點 -> 發送 API", acceptance: "依購買史輸出個人化內容", threshold: "high", status: "planned", placement: "predictions" },
  { id: "axd11", group: "AxD", name: "發送時間個人化", descEng: "開信/點擊時序建模 -> 預測每會員最佳開信時段供排程", acceptance: "每會員輸出時段", threshold: "high", status: "planned", placement: "predictions" },
  { id: "axd12", group: "AxD", name: "回購提醒文案動態生成", descEng: "依客戶語氣偏好 llm.py 生風格化文案", acceptance: "輸出風格化文案", threshold: "high", status: "planned", placement: "audience" },
  { id: "axd13", group: "AxD", name: "負評語意偵測＋應對建議", descEng: "評價/客服訊息 -> llm.py 情緒分析 -> 生客服回覆草稿附升級建議", acceptance: "輸出草稿與升級建議", threshold: "high", status: "planned", placement: "conversations" },

  // B×C
  { id: "bxc1", group: "BxC", name: "缺貨商品自動暫停廣告", descEng: "監測庫存表閾值 -> oauth adapter 呼平台 API 暫停對應廣告組", acceptance: "庫存觸發暫停並回報", status: "partial", placement: "merchandising", valueTag: "save_budget", effect: "避免燒預算到無法出貨的 SKU" },
  { id: "bxc2", group: "BxC", name: "商品目錄即時同步", descEng: "商品/庫存表變動 -> 同步至 Meta Catalog / Google Merchant API，跑 DPA", acceptance: "變動即同步並跑 DPA", status: "planned", placement: "merchandising" },
  { id: "bxc3", group: "BxC", name: "會員分群上傳廣告平台", descEng: "CRM 分群清洗（SHA-256/E.164）-> 上傳各平台 Custom Audience API", acceptance: "分群一鍵同步為平台受眾", status: "live", placement: "audience" },
  { id: "bxc4", group: "BxC", name: "黑名單同步", descEng: "客訴/高退貨條件查詢 -> 上傳平台排除名單 API", acceptance: "黑名單自動排除", status: "partial", placement: "audience" },
  { id: "bxc5", group: "BxC", name: "庫存壓力大商品加碼投放", descEng: "滯銷/即期條件 -> 觸發加碼預算建議 + 折扣訊息", acceptance: "條件觸發加碼建議", status: "planned", placement: "merchandising" },
  { id: "bxc6", group: "BxC", name: "新品上市分眾投放", descEng: "依 CRM 偏好標籤查種子受眾 -> 優先觸及（非廣投）", acceptance: "依標籤輸出投放分眾", status: "partial", placement: "merchandising" },
  { id: "bxc7", group: "BxC", name: "庫存預測 → 廣告預算建議", descEng: "銷售速度/季節/廣告效益迴歸 -> 預測投 X 元在缺貨前出清建議預算", acceptance: "輸出精準預算建議", threshold: "low", status: "planned", placement: "merchandising" },
  { id: "bxc8", group: "BxC", name: "競品比較預警", descEng: "llm.py 析會員對話競品提及 -> 回寫比價中標籤觸發加碼投放", acceptance: "偵測競品提及並貼標", threshold: "low", status: "planned", placement: "merchandising" },
  { id: "bxc9", group: "BxC", name: "滯銷品文案＋受眾匹配", descEng: "llm.py 生多版賣點文案 -> 規則配最可能購買分群", acceptance: "輸出文案與匹配分群", threshold: "mid", status: "planned", placement: "merchandising" },
  { id: "bxc10", group: "BxC", name: "新品上市受眾推薦", descEng: "llm.py 析商品描述屬性 -> 比對 CRM 標籤找最可能購買分群作種子", acceptance: "輸出推薦種子分群", threshold: "mid", status: "planned", placement: "merchandising" },
  { id: "bxc11", group: "BxC", name: "黑名單動態擴充", descEng: "llm.py 從對話語意判斷不宜廣告觸及客戶 -> 動態擴黑名單", acceptance: "語意判斷輸出擴充黑名單", threshold: "mid", status: "planned", placement: "audience" },
  { id: "bxc12", group: "BxC", name: "商品目錄智能優化", descEng: "llm.py/vision 為每 SKU 生多版標題/描述/主視覺裁切 -> 入 Catalog/Merchant", acceptance: "輸出多版素材入 Catalog", threshold: "high", status: "planned", placement: "catalog" },

  // B×D
  { id: "bxd1", group: "BxD", name: "缺貨候補通知", descEng: "候補表 + 到貨事件 -> 觸發 LINE 推播", acceptance: "到貨觸發候補通知", status: "partial", placement: "audience" },
  { id: "bxd2", group: "BxD", name: "到貨提醒", descEng: "訂閱型商品到期前 -> 排程提醒附一鍵下單連結", acceptance: "到期前自動提醒", status: "partial", placement: "audience" },
  { id: "bxd3", group: "BxD", name: "生日、紀念日訊息", descEng: "CRM 日期欄位 -> 排程觸發，可帶優惠券", acceptance: "日期觸發訊息", status: "partial", placement: "audience" },
  { id: "bxd4", group: "BxD", name: "會員升等通知", descEng: "等級變動事件 -> 觸發通知新權益", acceptance: "等級變動觸發通知", status: "partial", placement: "audience" },
  { id: "bxd5", group: "BxD", name: "個人化商品推薦", descEng: "依 CRM 偏好標籤 -> 規則組裝 EDM 商品內容", acceptance: "每會員不同推薦內容", status: "partial", placement: "audience" },
  { id: "bxd6", group: "BxD", name: "客服紀錄整合", descEng: "LINE 對話寫回 CRM 對話表 -> 供下次客服查詢", acceptance: "對話回寫並可查", status: "planned", placement: "conversations" },
  { id: "bxd7", group: "BxD", name: "訂閱與退訂管理", descEng: "通路/主題偏好表 + 發送前訂閱/黑名單檢查", acceptance: "可設定通路/主題偏好", status: "partial", placement: "audience" },
  { id: "bxd8", group: "BxD", name: "退訂原因預測＋挽留", descEng: "ML 預測 30 天內退訂風險 -> 觸發降頻/內容調整", acceptance: "輸出退訂風險名單與動作", threshold: "mid", status: "planned", placement: "predictions" },
  { id: "bxd9", group: "BxD", name: "AI 客服 Bot（RAG）", descEng: "向量檢索 CRM＋訂單＋FAQ＋手冊 -> llm.py 生答；需向量庫 + MCP 工具層", acceptance: "LINE/Messenger 自動回答常見問題", threshold: "high", status: "planned", placement: "conversations", valueTag: "save_time", effect: "自動回答 70-80% 常見問題" },
  { id: "bxd10", group: "BxD", name: "LINE 對話自動標籤（即時）", descEng: "每段對話 llm.py 即時貼標 -> 回寫 CRM", acceptance: "即時貼標回寫 CRM", threshold: "high", status: "partial", placement: "conversations" },
  { id: "bxd11", group: "BxD", name: "客服對話摘要＋升級判斷", descEng: "對話結束 llm.py 摘要回寫 -> 判斷是否需主管介入", acceptance: "輸出摘要與升級判斷", threshold: "high", status: "planned", placement: "conversations" },
  { id: "bxd12", group: "BxD", name: "個人化 EDM 動態組裝", descEng: "依 CRM 標籤動態組裝 EDM 區塊比例（推薦/教育/促銷）", acceptance: "每會員不同版面", threshold: "high", status: "partial", placement: "audience" },
  { id: "bxd13", group: "BxD", name: "生日/紀念日訊息個人化", descEng: "llm.py 依客戶互動風格 -> 生個別祝福文案", acceptance: "輸出風格化祝福", threshold: "high", status: "planned", placement: "audience" },
  { id: "bxd14", group: "BxD", name: "多語自動翻譯＋在地化", descEng: "llm.py 一鍵生多語版本並文化在地化（非直譯）", acceptance: "輸出在地化多語版本", threshold: "high", status: "planned", placement: "conversations" },
  { id: "bxd15", group: "BxD", name: "客服語音/影音轉文字＋摘要", descEng: "ASR 轉文字 + llm.py 摘要 -> 寫回會員紀錄", acceptance: "輸出轉錄摘要回寫", threshold: "high", status: "planned", placement: "conversations" },
  { id: "bxd16", group: "BxD", name: "負面情緒即時偵測", descEng: "對話 llm.py 情緒分類 -> 偵測不滿自動標記通知主管", acceptance: "偵測即標記通知", threshold: "high", status: "planned", placement: "conversations" },

  // C×D
  { id: "cxd1", group: "CxD", name: "溝通互動回拋廣告平台", descEng: "EDM 點擊、LINE 已讀未回等互動事件寫 BQ -> 作受眾條件回拋平台再觸及", acceptance: "互動行為回拋為受眾", status: "partial", placement: "audience" },
  { id: "cxd2", group: "CxD", name: "多通路歸因合併", descEng: "BQ JOIN 廣告曝光 + EDM 開信 + LINE 點擊 + 成交事件 -> 依歸因模型算各通路貢獻", acceptance: "輸出各通路真實貢獻", status: "planned", placement: "attribution" },
  { id: "cxd3", group: "CxD", name: "歸因路徑語意分析", descEng: "llm.py 解讀路徑成敗原因 -> 產出可讀優化建議", acceptance: "輸出可讀優化建議", threshold: "low", status: "planned", placement: "attribution" },
  { id: "cxd4", group: "CxD", name: "退訂者廣告再觸及策略", descEng: "llm.py 依退訂客互動史 -> 推薦改用廣告觸及的素材與時機", acceptance: "輸出再觸及策略", threshold: "mid", status: "planned", placement: "attribution" },
  { id: "cxd5", group: "CxD", name: "跨通路 A/B 測試自動化", descEng: "跨廣告/EDM/LINE 同步跑文案 A/B -> 統計自動收斂最佳版本並同步", acceptance: "自動收斂最佳版本同步", threshold: "mid", status: "planned", placement: "attribution" },
  { id: "cxd6", group: "CxD", name: "GA4 行為 → 溝通內容生成", descEng: "GA4 行為事件（瀏覽 X 商品 3 次）-> 觸發 llm.py 即時生 LINE/EDM 推播內容", acceptance: "行為觸發生成推播", threshold: "high", status: "partial", placement: "attribution" },
  { id: "cxd7", group: "CxD", name: "疲勞素材自動汰換", descEng: "監測廣告 CTR 與 EDM 開信率衰退 -> 觸發 llm.py 建議或生成新版本", acceptance: "衰退觸發建議或生成新版", threshold: "high", status: "partial", placement: "fatigue", valueTag: "roas", effect: "及時汰換疲乏素材，維持 CTR 與 ROAS" },
];

// 各狀態計數（總覽頁 KPI 用）。
export function countByStatus(): Record<FeatureStatus, number> {
  return FEATURE_CATALOG.reduce(
    (acc, f) => {
      acc[f.status] += 1;
      return acc;
    },
    { live: 0, partial: 0, planned: 0 } as Record<FeatureStatus, number>
  );
}
