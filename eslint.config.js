//import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

// @ts-ignore
import nextPlugin from "@next/eslint-plugin-next"; // <-- IMPORT THE PLUGIN

// const compat = new FlatCompat({
//   baseDirectory: import.meta.dirname,
// });

export default tseslint.config(
  {
    ignores: [".next"],
  },
  // ...compat.extends("next/core-web-vitals"),
    // --- THIS IS THE NEW, CORRECT WAY ---
  // Apply the Next.js recommended and core-web-vitals configs
  {
    ...nextPlugin.configs.recommended,
    ...nextPlugin.configs["core-web-vitals"],
    // You might need to specify files if it doesn't apply globally
    files: ["**/*.ts", "**/*.tsx"],
    // You can also override rules here if needed
    // rules: {
    //   "@next/next/no-html-link-for-pages": "off",
    // },
  },
  // --- END OF NEW WAY ---
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": nextPlugin,
    },
    // extends: [
    //   ...tseslint.configs.recommended,
    //   ...tseslint.configs.recommendedTypeChecked,
    //   ...tseslint.configs.stylisticTypeChecked,
    // ],
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
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);





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



