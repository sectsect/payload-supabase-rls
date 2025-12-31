import { Command } from 'commander';

import { verifyRLS, printReport } from '../../core/verify-rls.js';
import { getConnectionString } from '../utils/env.js';

export const verifyCommand = new Command('verify')
  .description('Verify RLS configuration on all tables')
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
      const result = await verifyRLS({
        connectionString,
        schema: options.schema,
      });

      printReport(result);

      // Exit with error code if there are unprotected tables
      if (result.unprotectedTables > 0) {
        process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Error verifying RLS:');
      if (error instanceof Error) {
        console.error(`   ${error.message}`);
      }
      process.exit(2);
    }
  });
