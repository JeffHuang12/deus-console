import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhTW from "antd/locale/zh_TW";
import App from "./App";
import "antd/dist/reset.css";
import "./global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhTW}
      theme={{
        token: {
          colorPrimary: "#2563EB",
          colorBgContainer: "#ffffff",
          colorBgLayout: "#F8FAFC",
          colorBgElevated: "#ffffff",
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,
          fontFamily:
            "'PingFang TC', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 14,
          colorText: "#0F172A",
          colorTextSecondary: "#64748B",
          colorBorder: "#E2E8F0",
          colorBorderSecondary: "#F1F5F9",
          colorFill: "#F8FAFC",
          colorFillSecondary: "#F1F5F9",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          boxShadowSecondary: "0 4px 16px rgba(0,0,0,0.08)",
        },
        components: {
          Layout: {
            siderBg: "#0F172A",
            triggerBg: "#1E293B",
          },
          Menu: {
            darkItemBg: "#0F172A",
            darkItemHoverBg: "#1E293B",
            darkItemSelectedBg: "#1D4ED8",
            darkSubMenuItemBg: "#080D16",
            darkGroupTitleColor: "#475569",
            darkItemColor: "#CBD5E1",
            fontSize: 13,
            itemHeight: 36,
          },
          Card: {
            boxShadowTertiary:
              "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)",
            borderRadiusLG: 10,
          },
          Table: {
            headerBg: "#F8FAFC",
            borderColor: "#E2E8F0",
            headerSortActiveBg: "#F1F5F9",
          },
          Statistic: {
            titleFontSize: 12,
          },
        },
      }}
    >
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
