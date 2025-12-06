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
    'backend/**', // Ignore backend files
    'smart-contract/**', // Ignore smart contract files
    'marker-maker-bot/**', // Ignore bot files
    'node_modules/**',
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Downgrade to warning
      '@typescript-eslint/no-unused-vars': 'warn', // Downgrade to warning
      'prefer-const': 'warn', // Downgrade to warning
      '@typescript-eslint/no-require-imports': 'warn', // Downgrade to warning for tests
      '@next/next/no-img-element': 'off', // Disable problematic rules
      '@next/next/no-page-custom-font': 'off', // Disable problematic rules
      'react-hooks/set-state-in-effect': 'off', // Allow setState in useEffect for legitimate cases
    }
  }
]);

export default eslintConfig;
