import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // Resolve setup file relative to this config regardless of where Vitest is run from
    setupFiles: path.resolve(__dirname, "vitest.setup.ts"),
  },
});