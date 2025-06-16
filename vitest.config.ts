import 'dotenv/config';
import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    testTimeout: 120 * 1000,
    printConsoleTrace: true,
    deps: {
      interopDefault: false,
    },
  },
  plugins: [
    tsConfigPaths({
      projects: ["tsconfig.json"],
    }),
  ],
});
