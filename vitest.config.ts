import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
    },
  },
  test: {
    coverage: {
      reporter: ["text", "html"],
    },
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
  },
});
