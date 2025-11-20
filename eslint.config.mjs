import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import obsidianmd from 'eslint-plugin-obsidianmd';

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
    ignores: ['src/__tests__/**/*', 'src/__mocks__/**/*'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
        jsxFactory: 'h',
        jsxFragmentFactory: 'Fragment',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      obsidianmd: obsidianmd,
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

      // Obsidian plugin recommended rules
      ...obsidianmd.configs.recommended,

      // Obsidian-specific rule customizations
      'obsidianmd/ui/sentence-case': ['warn', {
        brands: ['GitHub'],
        acronyms: ['API', 'URL', 'PR', 'ID', 'UI'],
        allowAutoFix: true,
      }],
    },
  },
  {
    // More relaxed rules for test and mock files
    files: ['src/__tests__/**/*', 'src/__mocks__/**/*'],
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
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
