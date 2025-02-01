import globals from "globals"
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import type { Config } from "typescript-eslint"

export default tseslint.config(
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    ignores: ["**/dist", "**/cache"],
  },
) satisfies Config
