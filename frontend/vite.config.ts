import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.svg",
          "favicon.ico",
          "robots.txt",
          "apple-touch-icon.png",
          "icons/icon-192x192.png",
          "icons/icon-512x512.png"
        ],
        manifest: {
          name: "Dumbo Translator",
          short_name: "Dumbo",
          description: "Offline translator progressive web app",
          theme_color: "#0f172a",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        }
      })
    ],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
    server: {
      port: 5173,
      watch: {
        ignored: ["**/tsconfig.json"],
      },
    }
  };
});