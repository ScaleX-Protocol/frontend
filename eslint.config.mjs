import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        React: true,
        NodeJS: true,
        RequestInit: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',

      // React rules
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General rules
      'prefer-const': 'warn',
      'no-unused-vars': 'off', // Turned off in favor of @typescript-eslint/no-unused-vars
    },
  },
  // Special config for Playwright config
  {
    files: ['playwright.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'tests/**',
      'backend/**',
      'smart-contract/**',
      'marker-maker-bot/**',
      '*.config.js',
      '*.config.mjs',
      'vite.config.ts',
      'src/components/ui/animations/particle-text-effect.tsx', // Complex animation component
      'src/utils/logger.ts', // External logger utilities
      'src/utils/prodLogger.ts', // External logger utilities
      'src/utils/logQuery.ts', // Complex query utilities
      'src/utils/logStorage.ts', // Complex storage utilities
      'src/utils/logQueryExamples.ts', // Example files
      '**/test-*.js', // Playwright test scripts (Node.js)
      '**/test-*.mjs', // Playwright test scripts (Node.js)
    ],
  },
];
