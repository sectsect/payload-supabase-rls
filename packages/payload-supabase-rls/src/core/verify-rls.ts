/* eslint-disable no-console */
import pg from 'pg';

import type { RLSConfig, TableStatus, VerificationResult } from './types.js';
import { validateIdentifier, validatePatterns } from './validators.js';

/**
 * Verify RLS configuration on all tables
 *
 * @param config - RLS configuration (only connectionString is required)
 * @returns Promise resolving to verification result
 *
 * @public
 */
export async function verifyRLS(
  config: Pick<RLSConfig, 'connectionString' | 'schema' | 'excludePatterns'>,
): Promise<VerificationResult> {
  const {
    connectionString,
    schema = 'public',
    excludePatterns = ['pg_%', 'sql_%'],
  } = config;

  if (!connectionString) {
    throw new Error('Connection string is required');
  }

  // Validate inputs to prevent SQL injection
  try {
    validateIdentifier(schema, 'schema');
    validatePatterns(excludePatterns);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Verification configuration failed: ${message}`);
  }

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();

    const excludeConditions = excludePatterns
      .map(pattern => `AND t.tablename NOT LIKE '${pattern}'`)
      .join('\n        ');

    // Get RLS status for all tables
    const tablesQuery = `
      SELECT
        t.tablename,
        t.rowsecurity as rls_enabled,
        COUNT(p.policyname)::integer as policy_count
      FROM pg_tables t
      LEFT JOIN pg_policies p
        ON t.tablename = p.tablename
        AND t.schemaname = p.schemaname
      WHERE t.schemaname = '${schema}'
        ${excludeConditions}
      GROUP BY t.tablename, t.rowsecurity
      ORDER BY t.tablename;
    `;

    const result = await client.query<TableStatus>(tablesQuery);
    const tables = result.rows;

    const totalTables = tables.length;
    const protectedTables = tables.filter(t => t.rls_enabled).length;
    const unprotectedTables = totalTables - protectedTables;

    return {
      totalTables,
      protectedTables,
      unprotectedTables,
      tables,
    };
  } finally {
    await client.end();
  }
}

/**
 * Print verification report to console
 *
 * @param result - Verification result from verifyRLS()
 *
 * @public
 */
export function printReport(result: VerificationResult): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  RLS Verification Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`📊 Summary:`);
  console.log(`   Total tables:       ${result.totalTables}`);
  console.log(`   ✅ RLS enabled:      ${result.protectedTables}`);
  console.log(`   ❌ RLS disabled:     ${result.unprotectedTables}\n`);

  if (result.unprotectedTables > 0) {
    console.log('⚠️  Tables without RLS:');
    result.tables
      .filter(t => !t.rls_enabled)
      .forEach(t => {
        console.log(`   - ${t.tablename}`);
      });
    console.log('');
  }

  const tablesWithoutPolicies = result.tables.filter(
    t => t.rls_enabled && t.policy_count === 0,
  );
  if (tablesWithoutPolicies.length > 0) {
    console.log('⚠️  Tables with RLS but no policies:');
    tablesWithoutPolicies.forEach(t => {
      console.log(`   - ${t.tablename}`);
    });
    console.log('');
  }

  const tablesWithIncorrectPolicies = result.tables.filter(
    t => t.rls_enabled && t.policy_count > 0 && t.policy_count !== 4,
  );
  if (tablesWithIncorrectPolicies.length > 0) {
    console.log('⚠️  Tables with unexpected policy count (expected 4):');
    tablesWithIncorrectPolicies.forEach(t => {
      console.log(`   - ${t.tablename}: ${t.policy_count} policies`);
    });
    console.log('');
  }

  console.log('📋 Detailed Table Status:');
  console.log(
    '   ┌─────────────────────────────────────┬─────────┬──────────┐',
  );
  console.log(
    '   │ Table Name                          │ RLS     │ Policies │',
  );
  console.log(
    '   ├─────────────────────────────────────┼─────────┼──────────┤',
  );

  result.tables.forEach(t => {
    const rlsStatus = t.rls_enabled ? '✅ Yes' : '❌ No ';
    const policyStatus =
      t.policy_count === 4
        ? `✅ ${t.policy_count}    `
        : `⚠️  ${t.policy_count}    `;
    const tableName = t.tablename.padEnd(35, ' ');
    console.log(`   │ ${tableName} │ ${rlsStatus}  │ ${policyStatus} │`);
  });

  console.log(
    '   └─────────────────────────────────────┴─────────┴──────────┘\n',
  );

  if (
    result.unprotectedTables === 0 &&
    result.tables.every(t => t.policy_count === 4 || t.policy_count === 0)
  ) {
    console.log('✅ All tables have RLS enabled!');
    if (result.tables.some(t => t.policy_count === 4)) {
      console.log(
        '✅ All tables with policies have the correct deny-all configuration (4 policies each).',
      );
    }
  } else {
    console.log(
      '❌ Some tables need attention. Run `payload-supabase-rls enable` to fix.',
    );
  }

  console.log(
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
  );
}
