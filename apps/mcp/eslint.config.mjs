import { defineConfig, globalIgnores } from "eslint/config";
import { config as baseConfig } from "@repo/eslint-config/base";

export default defineConfig([
  ...baseConfig,
  globalIgnores([".dist/**", ".wrangler/**", "dist/**", ".dev.vars", ".env.local"]),
]);
