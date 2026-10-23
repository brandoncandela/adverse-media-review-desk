import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Static GitHub Pages build (npm run build:pages). Runs with --mode pages, which
// switches app/page.tsx to examples.json and browser-side news search.
// The Cloudflare build in vite.config.ts is unchanged.
export default defineConfig({
  root: "static",
  base: "/adverse-media-review-desk/",
  publicDir: "../public",
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  plugins: [react()],
  build: { outDir: "../pages-dist", emptyOutDir: true },
});
