/* eslint-disable no-console */
import pg from 'pg';

import type { RLSConfig } from './types.js';
import { validateIdentifier, validatePatterns } from './validators.js';

/**
 * Table RLS status result
 */
export interface TableRLSStatus {
  tablename: string;
  rowsecurity: boolean;
}

/**
 * RLS status result
 */
export interface RLSStatusResult {
  tables: TableRLSStatus[];
  totalTables: number;
  enabledTables: number;
  disabledTables: number;
}

/**
 * Get RLS status for all tables
 *
 * @param config - RLS configuration (only connectionString is required)
 * @returns Promise resolving to status result
 *
 * @public
 */
export async function getRLSStatus(
  config: Pick<RLSConfig, 'connectionString' | 'schema' | 'excludePatterns'>,
): Promise<RLSStatusResult> {
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
    throw new Error(`Status check configuration failed: ${message}`);
  }

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();

    const excludeConditions = excludePatterns
      .map(pattern => `AND tablename NOT LIKE '${pattern}'`)
      .join('\n        ');

    const query = `
      SELECT
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = '${schema}'
        ${excludeConditions}
      ORDER BY tablename;
    `;

    const result = await client.query<TableRLSStatus>(query);
    const tables = result.rows;

    const totalTables = tables.length;
    const enabledTables = tables.filter(r => r.rowsecurity).length;
    const disabledTables = totalTables - enabledTables;

    return {
      tables,
      totalTables,
      enabledTables,
      disabledTables,
    };
  } finally {
    await client.end();
  }
}

/**
 * Print RLS status to console
 *
 * @param result - Status result from getRLSStatus()
 *
 * @public
 */
export function printStatus(result: RLSStatusResult): void {
  console.log('\n🔒 RLS Status\n');
  console.table(
    result.tables.map(row => ({
      'Table Name': row.tablename,
      'RLS Enabled': row.rowsecurity ? '✅ Yes' : '❌ No',
    })),
  );

  console.log(
    `\n📊 Summary: ${result.enabledTables}/${result.totalTables} tables have RLS enabled\n`,
  );
}
