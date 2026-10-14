import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// @ts-expect-error process is a nodejs global
const isCommunity = process.env.SKILLDOCKER_EDITION === 'community' || !fs.existsSync(path.resolve(__dirname, 'src/pro'));

const proEntryPath = isCommunity
  ? path.resolve(__dirname, 'src/pro-api/empty.ts')
  : path.resolve(__dirname, 'src/pro/entry.ts');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pro-entry': proEntryPath,
    },
  },
  define: {
    'process.env.SKILLDOCKER_EDITION': JSON.stringify(isCommunity ? 'community' : 'pro'),
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
