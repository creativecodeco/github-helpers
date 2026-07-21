import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  {
    // Global ignores replacing .eslintignore
    ignores: ['**/dist/**', '**/node_modules/**', '.agents/**', 'data/**', 'public/**', '**/.astro/**'],
  },
  {
    // TypeScript files configuration (Backend & Frontend)
    files: ['backend/src/**/*.ts', 'backend/tests/**/*.ts', 'frontend/src/**/*.ts'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        fetch: 'readonly',
        HeadersInit: 'readonly',
        RequestInit: 'readonly',
        Response: 'readonly',
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/triple-slash-reference': 'off',
      'no-console': 'off',
    },
  },
  // Spread the recommended Astro configurations directly (includes astro parser, files target, etc.)
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    // Override rules for Astro files and virtual script tags
    files: [
      'frontend/src/**/*.astro',
      'frontend/src/**/*.astro/*.js',
      'frontend/src/**/*.astro/*.ts'
    ],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/triple-slash-reference': 'off',
      'no-undef': 'off',
    },
  },
  {
    // Node.js CommonJS scripts and configuration
    files: ['eslint.config.js', 'scripts/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  eslintConfigPrettier,
];
