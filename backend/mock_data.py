"""集中所有 mock 範例資料。

本期前端骨架展示用。Phase 2 由 integrations/ 的真實查詢取代。
"""

from schemas import (
    AnalysisReport,
    Audience,
    AudiencePreview,
    Comment,
    DataSource,
    DayHighlight,
    FunnelStage,
    Kpi,
    Report,
    TimePoint,
)

# 頁一:9 個資料源 + Shopline(Shopline 走 api_key,單獨在 router 處理輸入)
DATA_SOURCES: list[DataSource] = [
    DataSource(id="meta_ads", name="Meta 廣告", auth_kind="oauth"),
    DataSource(id="meta_page", name="Meta 粉專", auth_kind="oauth"),
    DataSource(id="instagram", name="Instagram 社群", auth_kind="oauth"),
    DataSource(id="threads", name="Threads 社群", auth_kind="oauth"),
    DataSource(id="line_lap", name="LINE LAP", auth_kind="oauth"),
    DataSource(id="google_ads", name="Google Ads", auth_kind="oauth"),
    DataSource(id="bing_ads", name="Bing Ads", auth_kind="oauth"),
    DataSource(id="ga4", name="GA4", auth_kind="oauth"),
    DataSource(id="search_console", name="Search Console", auth_kind="oauth"),
    DataSource(id="boxful", name="Boxful", auth_kind="api_key"),
]


# 頁二:分析中心報表清單(記憶體種子)
MOCK_REPORTS: list[Report] = [
    Report(
        id="r001",
        name="VITABOX 廣告週報",
        sources=["Meta", "Google"],
        updated_at="2026-06-10 09:00",
        frequency="每週",
        model="claude-opus-4-8",
        prompt="比較 Meta 與 Google 的 ROAS,標記變動超過 20% 的指標,並針對浪費花費提出排除關鍵字建議。",
    ),
    Report(
        id="r002",
        name="GA4 流量月報",
        sources=["GA4"],
        updated_at="2026-06-01 08:00",
        frequency="每月",
        model="claude-sonnet-4-6",
        prompt=None,
    ),
    Report(
        id="r003",
        name="全通路綜合分析",
        sources=["Meta", "Google", "GA4"],
        updated_at="2026-06-12 10:30",
        frequency="手動",
        model="claude-opus-4-8",
        prompt="彙整三平台成效,找出漏斗最大流失點,並給出 3 個可執行的優化建議。",
    ),
]


# 受眾管理清單(記憶體種子)
MOCK_AUDIENCES: list[Audience] = [
    Audience(
        id="a001",
        name="90天未回購保健品女性 30-45",
        method="natural_language",
        count=2847,
        created_at="2026-06-10 14:00",
        frequency="每週",
        channels=[],
    ),
    Audience(
        id="a002",
        name="高 RFM 分群 VIP 客",
        method="structured",
        count=512,
        created_at="2026-06-08 10:00",
        frequency="每月",
        channels=[],
    ),
]


# 分群人數對照(智慧分群 + RFM),本期 mock。規格已給者用之,未給者用示範值。
SEGMENT_COUNTS: dict[str, int] = {
    # 智慧分群
    "top_core": 8420,
    "top_dormant": 3110,
    "active": 21560,
    "ready_repurchase": 18230,
    "sleeping": 26740,
    "new_buyer": 24965,
    "potential_repurchase": 12480,
    "lost": 45620,
    "engaged": 9870,
    # RFM 9 RANK
    "rfm_important_value": 6820,
    "rfm_high_potential": 9430,
    "rfm_important_keep": 31200,
    "rfm_high_attention": 15006,
    "rfm_low_attention": 54531,
    "rfm_high_wakeup": 24095,
    "rfm_low_wakeup": 76102,
    "rfm_high_value_new": 24965,
    "rfm_low_value_new": 45620,
}


def build_audience_preview(segment: str | None = None) -> AudiencePreview:
    """受眾預覽(本期固定 mock)。Phase 2 由 BigQuery/LLM 解析條件估算。

    若帶 segment(智慧分群 / RFM),回該分群的 mock 人數。
    """
    if segment and segment in SEGMENT_COUNTS:
        return AudiencePreview(
            estimated_count=SEGMENT_COUNTS[segment],
            condition_summary=[f"預設分群:{segment}", "本期人數為示範值"],
        )
    return AudiencePreview(
        estimated_count=2847,
        condition_summary=[
            "購買時間:過去 90 天內有訂單",
            "品項類別:保健品",
            "回購狀態:90 天內無第二筆訂單",
            "性別:女性",
            "年齡:30-45 歲",
        ],
    )


# 廣告受眾建立的 mock 人數(依通路)
AD_CHANNEL_COUNTS: dict[str, int] = {"meta": 2410, "google": 1980, "line": 3120}


# 留言管理 mock
_POST_A = "https://www.facebook.com/vitabox/posts/1001"  # Meta 粉專
_POST_B = "https://www.instagram.com/p/CB202"  # Instagram
_POST_C = "https://www.threads.net/@vitabox/post/303"  # Threads
_POST_D = "https://line.me/vitabox/404"  # LINE 社群

MOCK_COMMENTS: list[Comment] = [
    Comment(id="c01", text="東西超好用,會回購!", post_url=_POST_A, platform="Meta 粉專", tags=["正面", "產品"], comment_count=3, interaction_count=28),
    Comment(id="c02", text="出貨也太慢了吧,等快兩週", post_url=_POST_B, platform="Instagram", tags=["負面", "物流"], comment_count=5, interaction_count=12),
    Comment(id="c03", text="請問這款有現貨嗎?", post_url=_POST_A, platform="Meta 粉專", tags=["客服", "產品"], comment_count=1, interaction_count=4),
    Comment(id="c04", text="客服回覆好快,讚", post_url=_POST_C, platform="Threads", tags=["正面", "客服"], comment_count=0, interaction_count=9),
    Comment(id="c05", text="包裝破損,裡面壓到了", post_url=_POST_B, platform="Instagram", tags=["負面", "物流", "客服"], comment_count=2, interaction_count=7),
    Comment(id="c06", text="成分標示可以再清楚一點", post_url=_POST_D, platform="LINE 社群", tags=["產品"], comment_count=4, interaction_count=3),
    Comment(id="c07", text="已經第三次回購了 推", post_url=_POST_A, platform="Meta 粉專", tags=["正面", "產品"], comment_count=1, interaction_count=33),
    Comment(id="c08", text="退貨流程好複雜", post_url=_POST_C, platform="Threads", tags=["負面", "客服"], comment_count=6, interaction_count=15),
    Comment(id="c09", text="什麼時候會補貨?敲碗", post_url=_POST_B, platform="Instagram", tags=["客服", "產品"], comment_count=8, interaction_count=21),
]


def build_audience_report() -> "AudienceReport":
    """受眾報表 mock(七項指標 + 每日明細)。Phase 2 由真實發送數據彙整。"""
    from schemas import AudienceReport, ReportDailyRow

    dates = [f"2026-06-{d:02d}" for d in range(1, 8)]
    sent_daily = [1200, 1340, 1180, 1520, 1610, 980, 1450]
    daily = [
        ReportDailyRow(
            date=d,
            sent=s,
            open_rate=round(28 + i * 0.6, 1),
            click_rate=round(4.2 + i * 0.15, 1),
            fail_rate=round(1.8 - i * 0.05, 1),
            unsubscribe_rate=round(0.6 - i * 0.02, 2),
            bounce_rate=round(1.2 - i * 0.03, 2),
            sales=s * 38,
        )
        for i, (d, s) in enumerate(zip(dates, sent_daily))
    ]
    return AudienceReport(
        sent=sum(sent_daily),
        open_rate=30.4,
        click_rate=4.9,
        fail_rate=1.6,
        unsubscribe_rate=0.52,
        bounce_rate=1.05,
        sales=sum(r.sales for r in daily),
        daily=daily,
    )


def build_nl_parse() -> "NlParseResult":
    """自然語言解析 mock(固定回葉黃素例)。Phase 2 改由 LLM 解析。"""
    from schemas import NlParseResult, ParsedCondition

    return NlParseResult(
        conditions=[
            ParsedCondition(include=True, field="曾購買產品", operator="期間內購買", value="葉黃素 · 過去 30 天"),
        ],
        condition_summary=[
            "訂單行為:過去 30 天內購買「葉黃素」",
        ],
        estimated_count=1860,
    )


def build_analysis_report(
    range_label: str = "過去 7 天",
    compare_label: str = "對比前期",
) -> AnalysisReport:
    """產出一份完整的 mock 分析報告(八區塊)。

    range_label / compare_label 由 router 依使用者控制列設定帶入,本期僅影響顯示文字。
    """

    dates = [f"2026-05-{d:02d}" for d in range(1, 15)]
    daily_values = [3200, 2980, 3410, 3650, 2890, 2750, 4120, 4380, 3990, 3550, 3210, 2980, 4510, 4720]
    trend_values = [2.1, 2.3, 2.0, 2.6, 2.4, 2.2, 2.9, 3.1, 2.8, 2.7, 2.5, 2.4, 3.3, 3.5]  # ROAS 趨勢

    return AnalysisReport(
        range_label=range_label,
        compare_label=compare_label,
        executive_summary=(
            "本期(2026-05-01 至 05-14)整體營收較前期成長 12.4%,主要由 Meta 廣告與 GA4 自然流量帶動。"
            "漏斗在「加入購物車 → 結帳」環節流失最大,為下一階段優化重點。整體 ROAS 由 2.1 升至 3.5,"
            "顯示廣告效率改善。[本段 Phase 2 改由 Claude API 依規則計算結果潤飾]"
        ),
        kpis=[
            Kpi(label="總營收", value="NT$ 1,248,300", delta_pct=12.4),
            Kpi(label="訂單數", value="3,421", delta_pct=8.7),
            Kpi(label="轉換率", value="2.84%", delta_pct=3.1),
            Kpi(label="平均客單價", value="NT$ 365", delta_pct=-1.2),
            Kpi(label="ROAS", value="3.5", delta_pct=66.7),
            Kpi(label="廣告花費", value="NT$ 356,700", delta_pct=5.3),
        ],
        funnel=[
            FunnelStage(stage="曝光", value=482000),
            FunnelStage(stage="點擊", value=96400),
            FunnelStage(stage="商品瀏覽", value=48200),
            FunnelStage(stage="加入購物車", value=12300),
            FunnelStage(stage="結帳", value=4100),
            FunnelStage(stage="完成付款", value=3421),
        ],
        funnel_observation=(
            "加入購物車到結帳的轉換率僅 33.3%,低於同業參考值 45%。建議檢視結帳流程步驟數與運費揭露時機。"
        ),
        daily_fluctuation=[TimePoint(date=d, value=v) for d, v in zip(dates, daily_values)],
        fluctuation_observation="週末(05-07、05-08、05-13、05-14)營收明顯高於平日,假日檔期投放可加碼。",
        highlights=[
            DayHighlight(date="2026-05-14", metric="營收", value=4720, kind="best", note="母親節檔期高峰"),
            DayHighlight(date="2026-05-13", metric="營收", value=4510, kind="best", note="檔期前一日預熱"),
            DayHighlight(date="2026-05-06", metric="營收", value=2750, kind="anomaly", note="廣告預算誤設過低"),
            DayHighlight(date="2026-05-05", metric="營收", value=2890, kind="anomaly", note="官網結帳一度異常"),
        ],
        trend=[TimePoint(date=d, value=v) for d, v in zip(dates, trend_values)],
        trend_observation="ROAS 呈穩定上升趨勢,兩週內由 2.1 升至 3.5,廣告素材汰換策略見效。",
        recommendations=[
            "優化結帳流程:減少表單欄位、提前揭露運費,目標把購物車→結帳轉換從 33% 提升至 45%。",
            "加碼週末與檔期投放預算,平日維持穩定曝光即可。",
            "複製 05-14 高轉換素材的訴求方向,擴大相似受眾測試。",
            "建立預算護欄,避免再次出現 05-06 預算誤設導致的營收下滑。",
            "[本清單 Phase 2 由 Claude API 依數據生成更具體的優化建議]",
        ],
        conclusion=(
            "本期表現優於前期,廣告效率與營收同步成長。最大機會點在結帳轉換率,若能補上將進一步放大 ROAS。"
            "[本段 Phase 2 由 Claude API 潤飾]"
        ),
    )
