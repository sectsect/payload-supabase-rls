#!/usr/bin/env node

// ESM loader for CLI
import('../dist/esm/cli/index.js').catch(error => {
  console.error('Failed to load CLI:', error);
  process.exit(1);
});
