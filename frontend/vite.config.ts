import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function src(path: string) {
  return fileURLToPath(new URL(`./src/${path}`, import.meta.url));
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Keep in sync with tsconfig.app.json's compilerOptions.paths — that
    // config drives type-checking/IDE resolution, this drives the actual
    // dev-server/build resolution. Neither one reads the other.
    alias: {
      "@": src(""),
      "@components": src("components"),
      "@hooks": src("hooks"),
      "@services": src("services"),
      "@context": src("context"),
      "@app-types": src("types"),
      "@utils": src("utils"),
      "@pages": src("pages"),
      "@layouts": src("layouts"),
      "@config": src("config"),
      "@features": src("features"),
      "@assets": src("assets"),
    },
  },
});
