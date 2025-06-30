// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc"; // Verifique se é @eslint/eslintrc ou @eslint/compat


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { // Novo objeto para suas regras personalizadas
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
      // Adicionamos também a regra para o '_req' aqui, para garantir que não haja mais erros.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Adiciona esta regra para permitir o uso de 'any' em casos específicos, se necessário.
      // Você pode definir como 'warn' ou 'off' dependendo da sua preferência.
      "@typescript-eslint/no-explicit-any": "off", // DESATIVA A VERIFICAÇÃO DE 'ANY'
    },
  },
];

export default eslintConfig;