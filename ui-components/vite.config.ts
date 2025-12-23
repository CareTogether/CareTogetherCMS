import { defineConfig } from "npm:vite@^5.3.0";
import react from "npm:@vitejs/plugin-react-swc@^3.7.0";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname || ".", "src/mod.ts"),
        theme: resolve(import.meta.dirname || ".", "src/theme/theme.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => 
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@mui/material",
        "@mui/icons-material",
        "@emotion/react",
        "@emotion/styled",
      ],
    },
  },
});
