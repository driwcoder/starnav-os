import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default async function eslintConfig() {
  const tsPlugin = await import("@typescript-eslint/eslint-plugin");

  return [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
      languageOptions: {
        parser: await import("@typescript-eslint/parser"),
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          project: "./tsconfig.json",
        },
      },
      plugins: {
        "@typescript-eslint": tsPlugin,
      },
      rules: {
        "react/no-unescaped-entities": "off",
        "@next/next/no-page-custom-font": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
      },
    },
  ];
}
