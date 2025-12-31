import type { SQLBuilderConfig } from './types.js';
import {
  validateIdentifier,
  validatePatterns,
  validateRoles,
} from './validators.js';

/**
 * Build dynamic RLS enablement SQL
 *
 * This function generates idempotent SQL that:
 * 1. Creates a helper function for deny-all policies
 * 2. Enables RLS on all tables dynamically
 * 3. Creates deny-all policies for specified roles
 * 4. Verifies the result
 *
 * @param config - SQL builder configuration
 * @returns Complete SQL script ready to execute
 */
export function buildEnableRLSSQL(config: SQLBuilderConfig): string {
  const { schema, targetRoles, policyPrefix, excludePatterns, policyFunction } =
    config;

  // Validate all inputs before SQL generation to prevent SQL injection
  try {
    validateIdentifier(schema, 'schema');
    validateIdentifier(policyPrefix, 'policy prefix');
    validateIdentifier(policyFunction, 'policy function');
    validateRoles(targetRoles);
    validatePatterns(excludePatterns);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`SQL Builder validation failed: ${message}`);
  }

  const rolesList = targetRoles.join(', ');
  const excludeConditions = excludePatterns
    .map(pattern => `    AND tablename NOT LIKE '${pattern}'`)
    .join('\n');

  return `
-- ============================================================================
-- Script: Re-enable Row-Level Security
-- Purpose: Restore RLS settings (auto-generated)
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: Helper Function for Deny-All Policy
-- ============================================================================

CREATE OR REPLACE FUNCTION ${schema}.${policyFunction}()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- ============================================================================
-- SECTION 2: Enable RLS and Create Policies on All Tables
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
  policy_count INTEGER := 0;
  table_count INTEGER := 0;
BEGIN
  -- Loop through all tables in ${schema} schema
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = '${schema}'
${excludeConditions}
  LOOP
    -- Enable RLS on this table
    EXECUTE format('ALTER TABLE ${schema}.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
    table_count := table_count + 1;

    -- Drop existing deny policies if they exist (for idempotency)
    EXECUTE format('DROP POLICY IF EXISTS "${policyPrefix}_select" ON ${schema}.%I', table_record.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "${policyPrefix}_insert" ON ${schema}.%I', table_record.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "${policyPrefix}_update" ON ${schema}.%I', table_record.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "${policyPrefix}_delete" ON ${schema}.%I', table_record.tablename);

    -- Create deny_all_select policy
    EXECUTE format(
      'CREATE POLICY "${policyPrefix}_select" ON ${schema}.%I
       FOR SELECT
       TO ${rolesList}
       USING (${schema}.${policyFunction}())',
      table_record.tablename
    );

    -- Create deny_all_insert policy
    EXECUTE format(
      'CREATE POLICY "${policyPrefix}_insert" ON ${schema}.%I
       FOR INSERT
       TO ${rolesList}
       WITH CHECK (${schema}.${policyFunction}())',
      table_record.tablename
    );

    -- Create deny_all_update policy
    EXECUTE format(
      'CREATE POLICY "${policyPrefix}_update" ON ${schema}.%I
       FOR UPDATE
       TO ${rolesList}
       USING (${schema}.${policyFunction}())',
      table_record.tablename
    );

    -- Create deny_all_delete policy
    EXECUTE format(
      'CREATE POLICY "${policyPrefix}_delete" ON ${schema}.%I
       FOR DELETE
       TO ${rolesList}
       USING (${schema}.${policyFunction}())',
      table_record.tablename
    );

    policy_count := policy_count + 4;
  END LOOP;

  -- Report success
  RAISE NOTICE '✅ RLS enabled on % tables with % policies total', table_count, policy_count;
END $$;

-- ============================================================================
-- SECTION 3: Verification
-- ============================================================================

DO $$
DECLARE
  unprotected_count INTEGER;
  protected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unprotected_count
  FROM pg_tables
  WHERE schemaname = '${schema}'
${excludeConditions}
  AND rowsecurity = FALSE;

  SELECT COUNT(*) INTO protected_count
  FROM pg_tables
  WHERE schemaname = '${schema}'
${excludeConditions}
  AND rowsecurity = TRUE;

  IF unprotected_count > 0 THEN
    RAISE WARNING '⚠️  % tables still have RLS disabled', unprotected_count;
  END IF;

  RAISE NOTICE '✅ Verification complete: % tables protected, % unprotected',
    protected_count, unprotected_count;
END $$;

COMMIT;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ RLS re-enablement complete';
  RAISE NOTICE '   - All tables have RLS enabled';
  RAISE NOTICE '   - Deny-all policies applied to ${rolesList} roles';
  RAISE NOTICE '   - Database access maintained via bypass RLS role';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
`;
}
