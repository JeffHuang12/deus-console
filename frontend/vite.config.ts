import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// demo 模式(GitHub Pages)部署在 /deus-console/ 子路徑;本機開發走根路徑 /。
const base = process.env.VITE_DEMO_MODE === "true" ? "/deus-console/" : "/";

// 開發時把 /api 代理到 FastAPI,前端只需呼叫相對路徑 /api。
// 用 127.0.0.1 而非 localhost:Node 會把 localhost 解析成 IPv6 ::1,
// 但 uvicorn 預設只綁 IPv4 127.0.0.1,走 localhost 會連不到後端。
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
