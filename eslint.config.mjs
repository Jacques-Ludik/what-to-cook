// eslint.config.mjs
import t from "typescript-eslint";

import nextPlugin from "@next/eslint-plugin-next";

export default t.config(
  {
    // Globally ignored files
    ignores: [".next/**", "node_modules/**"],
  },
  {
    // Base configuration for all TypeScript files
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": t.plugin,
    },
    extends: [
      ...t.configs.recommended,
      ...t.configs.recommendedTypeChecked,
      ...t.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
    languageOptions: {
      parser: t.parser,
      parserOptions: {
        project: true,
      },
    },
  },
  {
    // Configuration for Next.js
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
);





// //import { FlatCompat } from "@eslint/eslintrc";
// import tseslint from "typescript-eslint";

// // @ts-ignore
// import nextPlugin from "@next/eslint-plugin-next"; // <-- IMPORT THE PLUGIN

// // const compat = new FlatCompat({
// //   baseDirectory: import.meta.dirname,
// // });

// export default tseslint.config(
//   {
//     ignores: [".next"],
//   },
//   // ...compat.extends("next/core-web-vitals"),
//     // --- THIS IS THE NEW, CORRECT WAY ---
//   // Apply the Next.js recommended and core-web-vitals configs
//   {
//     ...nextPlugin.configs.recommended,
//     ...nextPlugin.configs["core-web-vitals"],
//     // You might need to specify files if it doesn't apply globally
//     files: ["**/*.ts", "**/*.tsx"],
//     // You can also override rules here if needed
//     // rules: {
//     //   "@next/next/no-html-link-for-pages": "off",
//     // },
//   },
//   // --- END OF NEW WAY ---
//   {
//     files: ["**/*.ts", "**/*.tsx"],
//     plugins: {
//       "@next/next": nextPlugin,
//     },
//     // extends: [
//     //   ...tseslint.configs.recommended,
//     //   ...tseslint.configs.recommendedTypeChecked,
//     //   ...tseslint.configs.stylisticTypeChecked,
//     // ],
//     rules: {
//       "@typescript-eslint/array-type": "off",
//       "@typescript-eslint/consistent-type-definitions": "off",
//       "@typescript-eslint/consistent-type-imports": [
//         "warn",
//         { prefer: "type-imports", fixStyle: "inline-type-imports" },
//       ],
//       "@typescript-eslint/no-unused-vars": [
//         "warn",
//         { argsIgnorePattern: "^_" },
//       ],
//       "@typescript-eslint/require-await": "off",
//       "@typescript-eslint/no-misused-promises": [
//         "error",
//         { checksVoidReturn: { attributes: false } },
//       ],
//     },
//   },
//   {
//     linterOptions: {
//       reportUnusedDisableDirectives: true,
//     },
//     languageOptions: {
//       parserOptions: {
//         projectService: true,
//       },
//     },
//   },
// );












//old code for next-auth v5
// import { FlatCompat } from "@eslint/eslintrc";
// import tseslint from "typescript-eslint";

// const compat = new FlatCompat({
//   baseDirectory: import.meta.dirname,
// });

// export default tseslint.config(
//   {
//     ignores: [".next"],
//   },
//   tseslint.config(...compat.extends("next/core-web-vitals")),
//   //...compat.extends("next/core-web-vitals"),
//   {
//     files: ["**/*.ts", "**/*.tsx"],
//     extends: [
//       ...tseslint.configs.recommended,
//       ...tseslint.configs.recommendedTypeChecked,
//       ...tseslint.configs.stylisticTypeChecked,
//     ],
//     rules: {
//       "@typescript-eslint/array-type": "off",
//       "@typescript-eslint/consistent-type-definitions": "off",
//       "@typescript-eslint/consistent-type-imports": [
//         "warn",
//         { prefer: "type-imports", fixStyle: "inline-type-imports" },
//       ],
//       "@typescript-eslint/no-unused-vars": [
//         "warn",
//         { argsIgnorePattern: "^_" },
//       ],
//       "@typescript-eslint/require-await": "off",
//       "@typescript-eslint/no-misused-promises": [
//         "error",
//         { checksVoidReturn: { attributes: false } },
//       ],
//     },
//   },
//   {
//     linterOptions: {
//       reportUnusedDisableDirectives: true,
//     },
//     languageOptions: {
//       parserOptions: {
//         projectService: true,
//       },
//     },
//   },
// );



