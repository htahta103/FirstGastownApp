import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In Docker Compose, set API_PROXY_TARGET=http://api:8080 so the Vite server proxies to the API container.
const apiProxyTarget =
  process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
