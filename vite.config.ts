import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Builds the static site in pages-dist/, published to GitHub Pages at /adverse-media-review-desk/.
export default defineConfig({
  root: "static",
  base: "/adverse-media-review-desk/",
  publicDir: "../public",
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  plugins: [react()],
  build: { outDir: "../pages-dist", emptyOutDir: true },
});
