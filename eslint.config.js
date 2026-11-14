import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'docs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  // The CloudFront Function: CloudFront calls `handler`.
  { files: ['deploy/paths.js'], rules: { '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^handler$' }] } },
  // The service worker template: the build fills in the file list.
  { files: ['build/sw-template.js'], languageOptions: { globals: { ...globals.serviceworker, __FILES__: 'readonly' } } },
);
