"""集中所有 mock 範例資料。

本期前端骨架展示用。Phase 2 由 integrations/ 的真實查詢取代。
"""

from schemas import (
    AnalysisReport,
    DataSource,
    DayHighlight,
    FunnelStage,
    Kpi,
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
