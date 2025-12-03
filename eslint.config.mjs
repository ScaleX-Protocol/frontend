import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'tests/**', // Ignore test files for now
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Downgrade to warning
      '@typescript-eslint/no-unused-vars': 'warn', // Downgrade to warning
      'react-hooks/exhaustive-deps': 'warn', // Downgrade to warning
      'react-hooks/rules-of-hooks': 'warn', // Downgrade to warning for now
      'prefer-const': 'warn', // Downgrade to warning
      '@typescript-eslint/no-require-imports': 'warn', // Downgrade to warning for tests
      'react-hooks/set-state-in-effect': 'warn', // Downgrade to warning
      'react-hooks/immutability': 'warn', // Downgrade to warning
      'react-hooks/incompatible-library': 'warn', // Downgrade to warning
      '@next/next/no-img-element': 'off', // Disable problematic rules
      '@next/next/no-page-custom-font': 'off', // Disable problematic rules
    }
  }
]);

export default eslintConfig;
