// eslint-disable-next-line import/no-anonymous-default-export
export default {
  '*': ['secretlint --maskSecrets --secretlintignore .gitignore "**/*"'],
  // Exclude auto-generated files (payload-types.ts) from linting and formatting
  '**/*.{js,jsx,ts,tsx}': (files) => {
    const filteredFiles = files.filter(
      (file) => !file.includes('payload-types.ts'),
    );
    if (filteredFiles.length === 0) return [];
    return ['pnpm lint:fix', 'pnpm lint'];
  },
  '**/*.ts?(x)': () => 'pnpm type-check',
  '**/*.md': () => 'pnpm format',
};
