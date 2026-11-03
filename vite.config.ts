import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// base "./" keeps every asset path relative, so the build works under
// https://<user>.github.io/otamasing-broadcast/ without knowing the repo name.
export default defineConfig({
  base: "./",
  plugins: [react()],
  // flag SVGs stay separate files (loaded only when used) instead of being inlined into the JS bundle
  build: { assetsInlineLimit: 0 },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
