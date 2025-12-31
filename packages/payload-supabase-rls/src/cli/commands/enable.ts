/* eslint-disable no-console */
import { Command } from 'commander';

import { enableRLS } from '../../core/enable-rls.js';
import { getConnectionString } from '../utils/env.js';

export const enableCommand = new Command('enable')
  .description('Enable RLS on all tables')
  .option('-c, --connection <string>', 'Database connection string')
  .option('-v, --verbose', 'Verbose output', false)
  .option('-s, --schema <string>', 'Schema name', 'public')
  .option(
    '-r, --roles <roles>',
    'Target roles (comma-separated)',
    'anon,authenticated',
  )
  .option('-p, --policy-prefix <string>', 'Policy name prefix', 'deny_all')
  .option('-f, --policy-function <string>', 'Policy function name', 'deny_all')
  .action(async options => {
    const connectionString = options.connection || getConnectionString();

    if (!connectionString) {
      console.error('❌ Error: Database connection string required');
      console.error('   Set DATABASE_URI or use --connection flag');
      process.exit(1);
    }

    const result = await enableRLS({
      connectionString,
      verbose: options.verbose,
      schema: options.schema,
      targetRoles: options.roles.split(',').map((r: string) => r.trim()),
      policyPrefix: options.policyPrefix,
      policyFunction: options.policyFunction,
    });

    if (!result.success) {
      console.error('❌ Failed to enable RLS');
      result.errors?.forEach(err => console.error(`   ${err}`));
      process.exit(1);
    }

    if (!options.verbose) {
      console.log(
        `✅ RLS enabled on ${result.tablesProcessed} tables with ${result.policiesCreated} policies`,
      );
    }

    process.exit(0);
  });
