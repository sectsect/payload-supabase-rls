/* eslint-disable no-console */
import pg from 'pg';

import { buildEnableRLSSQL } from './sql-builder.js';
import type { RLSConfig, RLSOperationResult } from './types.js';

/**
 * Enable RLS on all tables in the database
 *
 * This function connects to PostgreSQL, dynamically generates SQL to enable RLS,
 * and applies deny-all policies to the specified roles.
 *
 * @param config - RLS configuration options
 * @returns Promise resolving to operation result
 *
 * @example
 * ```typescript
 * const result = await enableRLS({
 *   connectionString: 'postgresql://...',
 *   schema: 'public',
 *   targetRoles: ['anon', 'authenticated'],
 *   verbose: true,
 * });
 *
 * if (result.success) {
 *   console.log(`Processed ${result.tablesProcessed} tables`);
 * }
 * ```
 *
 * @public
 */
export async function enableRLS(
  config: RLSConfig,
): Promise<RLSOperationResult> {
  const {
    connectionString,
    schema = 'public',
    targetRoles = ['anon', 'authenticated'],
    policyPrefix = 'deny_all',
    verbose = false,
    excludePatterns = ['pg_%', 'sql_%'],
    policyFunction = 'deny_all',
  } = config;

  if (!connectionString) {
    return {
      success: false,
      tablesProcessed: 0,
      policiesCreated: 0,
      errors: ['Connection string is required'],
    };
  }

  const client = new pg.Client({ connectionString });

  try {
    if (verbose) {
      console.log('🔄 Connecting to database...');
    }

    await client.connect();

    if (verbose) {
      console.log('✅ Connected to database');
      console.log('🔄 Generating RLS SQL...');
    }

    // Build SQL dynamically
    const sql = buildEnableRLSSQL({
      schema,
      targetRoles,
      policyPrefix,
      excludePatterns,
      policyFunction,
    });

    if (verbose) {
      console.log('✅ SQL generated');
      console.log('🔄 Executing RLS re-enablement...');
    }

    let tablesProcessed = 0;
    let policiesCreated = 0;

    // Listen to NOTICE messages for statistics
    client.on('notice', msg => {
      if (verbose) {
        console.log(msg.message);
      }
      // Parse statistics from NOTICE messages
      const tableMatch = msg.message?.match(/enabled on (\d+) tables/);
      const policyMatch = msg.message?.match(/with (\d+) policies/);
      if (tableMatch) tablesProcessed = parseInt(tableMatch[1], 10);
      if (policyMatch) policiesCreated = parseInt(policyMatch[1], 10);
    });

    await client.query(sql);

    if (verbose) {
      console.log('✅ RLS re-enablement complete');
    }

    return {
      success: true,
      tablesProcessed,
      policiesCreated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (verbose) {
      console.error('❌ Error enabling RLS:');
      console.error(`   ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }

    return {
      success: false,
      tablesProcessed: 0,
      policiesCreated: 0,
      errors: [errorMessage],
    };
  } finally {
    await client.end();
    if (verbose) {
      console.log('🔌 Database connection closed');
    }
  }
}
