import js from '@eslint/js';
import globals from 'globals';
import {defineConfig} from 'eslint/config';
import prettierPlugin from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig([
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      'object-curly-spacing': ['error', 'never'],
      'prettier/prettier': 'error',
    },
  },
  {
    ignores: ['node_modules', 'dist', 'build'],
  },
]);
