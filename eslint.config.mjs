/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */

import { fileURLToPath } from 'node:url';
import { dirname } from 'path';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import pluginQuery from '@tanstack/eslint-plugin-query';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import vitest from '@vitest/eslint-plugin';
import deprecation from 'eslint-plugin-deprecation';
import _import from 'eslint-plugin-import';
import jsxA11Y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import tsdoc from 'eslint-plugin-tsdoc';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/dist/**',
      '**/out/**',
      '**/build/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.storybook/**',
      '**/vendor/**',
      '**/public/**',
      'next-env.d.ts',
      '**/*.config.{js,cjs,mjs}',
      '**/app/(payload)/**/*.js',
      '**/src/payload-types.ts',
    ],
  },

  ...compat.extends('airbnb', 'airbnb-typescript'),

  {
    files: ['**/*.{ts,tsx,mjs}', '**/*.{test,spec}.{ts,tsx}'],

    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11Y,
      '@eslint-react': eslintReact,
      '@typescript-eslint': typescriptEslint,
      'unused-imports': unusedImports,
      '@tanstack/query': pluginQuery,
      deprecation,
      tsdoc,
      import: _import,
      prettier,
      'testing-library': testingLibrary,
      vitest,
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        project: true,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      'prettier/prettier': 'error',
      'react/require-default-props': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/no-danger': 'off',
      'react/function-component-definition': [
        2,
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/jsx-no-useless-fragment': 'error',
      '@eslint-react/no-leaked-conditional-rendering': 'error',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/label-has-associated-control': [2, { assert: 'either' }],
      'jsx-a11y/control-has-associated-label': 'off',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal'],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/prefer-default-export': 'off',
      'import/no-duplicates': 'error',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-optional-chain': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-underscore-dangle': 'off',
      'tsdoc/syntax': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    rules: {
      'vitest/consistent-test-it': ['error', { fn: 'test' }],
      'vitest/require-top-level-describe': [
        'error',
        { maxNumberOfTopLevelDescribes: 2 },
      ],
    },
  },

  eslintPluginPrettierRecommended,
];
