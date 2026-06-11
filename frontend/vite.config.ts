import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// demo 模式(GitHub Pages)部署在 /deus-console/ 子路徑;本機開發走根路徑 /。
const base = process.env.VITE_DEMO_MODE === "true" ? "/deus-console/" : "/";

// 開發時把 /api 代理到 FastAPI(localhost:8000),前端只需呼叫相對路徑 /api
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
