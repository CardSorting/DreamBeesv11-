import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'sdk/**']),
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['functions/**'],
    extends: [
      js.configs.recommended,
      reactPlugin.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
      'no-undef': 'error',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/react-in-jsx-scope': 'off', // Not needed in modern Vite/React
      'react-hooks/exhaustive-deps': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-direct-mutation-state': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
    },
  },
  {
    files: ['src/pages/MockupStudio/**/*.jsx', 'src/components/Three/**/*.jsx'],
    rules: {
      'react/no-unknown-property': 'off', // R3F uses camelCase versions of standard Three properties
    },
  },
  {
    files: ['scripts/**/*.js', 'functions/scripts/**/*.js', 'test_*.js', '*.js', '*.cjs', 'src/**/*.test.jsx'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-undef': 'off',
      'no-console': 'off', // Scripts and tests can use console
    },
  },
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
