import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      'node_modules/**',
      'main.js',
      '*.js.map',
      'dist/**',
      'coverage/**',
      'esbuild.config.mjs',
      'jest.config.js',
    ],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        jsxFactory: 'h',
        jsxFragmentFactory: 'Fragment',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript specific rules - relaxed for existing codebase
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^h$|^Fragment$', // Allow unused 'h' and 'Fragment' (Preact JSX)
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off', // Disabled for existing codebase
      '@typescript-eslint/no-non-null-assertion': 'off', // Disabled for existing codebase

      // General rules
      'no-console': 'off', // Allow console in plugin development
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    // More relaxed rules for test and mock files
    files: ['src/__tests__/**/*', 'src/__mocks__/**/*'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
