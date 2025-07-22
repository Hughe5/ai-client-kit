import js from '@eslint/js';
import globals from 'globals';
import {defineConfig} from 'eslint/config';
import prettierPlugin from 'eslint-plugin-prettier';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      js,
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
