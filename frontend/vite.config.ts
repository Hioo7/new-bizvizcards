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
  server: {
    proxy: {
      // Forwards API calls to the backend so the browser sees them as
      // same-origin — required for the Better Auth session cookie to
      // set/send correctly without CORS/trustedOrigins changes on the
      // backend. Mirrors the nginx reverse-proxy setup used in production.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        // Better Auth checks the request's Origin header against its own
        // baseURL/trustedOrigins for CSRF protection. The browser sends the
        // Vite dev server's origin (localhost:5173), which doesn't match the
        // backend's origin, so it gets rejected (403) unless we rewrite it
        // here to look like a same-origin request to the backend.
        headers: { origin: "http://localhost:3000" },
      },
      // Uploaded images: the backend returns public URLs as "/media/<bucket>/<key>",
      // meant to be served directly by MinIO behind a reverse proxy (mirrors the
      // nginx setup used in production) rather than routed through the backend.
      // Strip the "/media" prefix so the request lands on MinIO's own path-style
      // object URL ("/<bucket>/<key>").
      "/media": {
        target: "http://localhost:9000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/media/, ""),
      },
    },
  },
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
