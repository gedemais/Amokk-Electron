import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    target: "node18",
    outDir: "dist-electron/electron",
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "electron/preload.ts"),
      formats: ["cjs"],
      fileName: () => "preload.js",
    },
    rollupOptions: {
      external: ["electron"],
    },
  },
});