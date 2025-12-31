import { Command } from 'commander';

import { getRLSStatus, printStatus } from '../../core/status-rls.js';
import { getConnectionString } from '../utils/env.js';

export const statusCommand = new Command('status')
  .description('Quick RLS status check for all tables')
  .option('-c, --connection <string>', 'Database connection string')
  .option('-s, --schema <string>', 'Schema name', 'public')
  .action(async options => {
    const connectionString = options.connection || getConnectionString();

    if (!connectionString) {
      console.error('❌ Error: Database connection string required');
      console.error('   Set DATABASE_URI or use --connection flag');
      process.exit(1);
    }

    try {
      const result = await getRLSStatus({
        connectionString,
        schema: options.schema,
      });

      printStatus(result);

      // Exit with error if any tables don't have RLS
      if (result.disabledTables > 0) {
        process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Error checking RLS status:');
      if (error instanceof Error) {
        console.error(`   ${error.message}`);
      }
      process.exit(2);
    }
  });
