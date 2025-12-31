/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-anonymous-default-export */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'path';

import sharedConfig from '../../eslint.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  ...sharedConfig,

  {
    files: ['**/*.{ts,mjs}'],

    languageOptions: {
      parserOptions: {
        project: resolve(__dirname, './tsconfig.json'),
      },
    },

    rules: {
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
          ts: 'never',
          tsx: 'never',
        },
      ],
    },
  },
];
