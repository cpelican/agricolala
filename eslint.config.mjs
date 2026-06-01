import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import jestPlugin from "eslint-plugin-jest";

export default defineConfig([globalIgnores([
    "**/node_modules/",
    "**/.next/",
    "**/.husky/",
    "**/out/",
    "**/build/",
    "**/dist/",
    "**/coverage/",
]), {
    extends: [...nextCoreWebVitals, ...nextTypescript],

    rules: {
        "@typescript-eslint/consistent-type-imports": ["error", {
            prefer: "type-imports",
            fixStyle: "inline-type-imports",
        }],
    },
}, {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/*.demo.ts"],
    plugins: {
        jest: jestPlugin,
    },
    rules: {
        "jest/no-conditional-in-test": "error",
    },
}]);