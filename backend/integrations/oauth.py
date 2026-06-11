"""各資料源 OAuth / API Key 綁定流程。

★ 第一階段(本期)為 stub。實際串接於 Phase 2 補上。
每個資料源的授權方式不同,屆時在此分派:
  - GA4:沿用 Projects/ga4 的 OAuth 使用者授權流程
  - Google Ads / Search Console:Google OAuth(可共用 client secret)
  - Meta 廣告 / 粉專 / Instagram / Threads:Meta OAuth(Graph API)
  - LINE LAP:LINE 廣告 API
  - Bing Ads:Microsoft Advertising OAuth
  - Shopline:非 OAuth,直接驗證 access token(見 routers/bindings.py)
"""

from __future__ import annotations


def start_flow(source_id: str) -> dict:
    """啟動某資料源的 OAuth 授權流程,回傳授權 URL。

    Phase 2:依 source_id 產生對應平台的 OAuth authorize URL 並回傳給前端導向。
    本期回傳 stub,前端據此顯示「OAuth 流程待接」。
    """
    # TODO Phase 2: 依 source_id 產生真實 authorize_url 並處理 callback。
    return {
        "source_id": source_id,
        "authorize_url": None,
        "stub": True,
        "message": f"{source_id} 的 OAuth 授權流程尚未接通(Phase 2)。",
    }


def verify_shopline_token(access_token: str) -> bool:
    """驗證 Shopline access token 是否有效。

    Phase 2:呼叫 Shopline Open API(如 GET token info)實際驗證。
    可沿用 Projects/shopline_getorders/shopline_common.py 的呼叫方式。
    本期不驗證,一律回 True。
    """
    # TODO Phase 2: 串接 Shopline token 驗證端點。
    return True
