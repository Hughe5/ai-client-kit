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
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // 忽略下划线开头的参数
          varsIgnorePattern: '^_', // 忽略下划线开头的变量
        },
      ],
      'object-curly-spacing': ['error', 'never'],
      'prettier/prettier': 'error',
    },
  },
  {
    ignores: ['node_modules', 'dist', 'build', 'coverage'],
  },
]);
