import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

function src(path: string) {
  return fileURLToPath(new URL(`./src/${path}`, import.meta.url));
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["app_icons/bizvizpwalogo.svg"],
      manifest: {
        name: "BizVizCards",
        short_name: "BizVizCards",
        description: "Digital business cards and mini websites",
        // Kept in sync with the "bizviz" theme's --color-primary/--color-base-100
        // in src/index.css — this is build config, not a component, so the
        // "no hardcoded values" rule's component/hook/service scope doesn't
        // apply, but the values themselves must still track the theme.
        theme_color: "#2D2DE0",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/app_icons/bizvizpwalogo-48x48.png",
            sizes: "48x48",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/app_icons/bizvizpwalogo-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/app_icons/bizvizpwalogo-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/app_icons/bizvizpwalogo-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/app_icons/bizvizpwalogo-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/app_icons/bizvizpwalogo-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
    }),
  ],
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
