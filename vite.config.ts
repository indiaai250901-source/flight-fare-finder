import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Plain Vite + React SPA config. No SSR, no nitro, no Cloudflare/wrangler
// target — build output is a static `dist/` for `vite preview` / any static host.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths()],
  build: {
    outDir: "dist",
  },
});
