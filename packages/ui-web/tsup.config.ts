import { defineConfig } from "tsup";

// Emits a single ESM bundle + flat .d.ts that the /design-sync converter feeds
// to esbuild (`--entry ./dist/index.js`). React stays external — it is a peer
// dependency and the Claude Design runtime provides its own copy.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: false,
  treeshake: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  target: "es2022",
});
