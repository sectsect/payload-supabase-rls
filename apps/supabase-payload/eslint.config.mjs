/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-anonymous-default-export */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'path';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';

import sharedConfig from '../../eslint.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...sharedConfig,

  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    files: ['**/*.{ts,tsx,mjs}'],

    plugins: {
      '@next/next': nextPlugin,
    },

    languageOptions: {
      parserOptions: {
        project: resolve(__dirname, './tsconfig.json'),
      },
    },

    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../*', './*'],
        },
      ],
    },
  },

  {
    files: ['src/app/(payload)/**/*.{ts,tsx}', 'src/payload.config.ts'],
    rules: {
      'no-restricted-imports': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'react/no-children-prop': 'off',
    },
  },
];
