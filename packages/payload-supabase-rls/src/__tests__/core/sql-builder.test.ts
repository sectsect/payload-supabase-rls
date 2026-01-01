import { describe, expect, vi, test } from 'vitest';

import { buildEnableRLSSQL } from '../../core/sql-builder.js';

describe('buildEnableRLSSQL', () => {
  describe('Security', () => {
    describe('SQL injection prevention in excludePatterns', () => {
      test('should reject SQL injection with DROP TABLE', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: ["'; DROP TABLE users; --"],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/SQL Builder validation failed/);
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: ["'; DROP TABLE users; --"],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/Invalid pattern/);
      });

      test('should reject SQL injection with semicolons', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: ['test;DROP'],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/SQL Builder validation failed/);
      });

      test('should reject SQL injection with comments', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: ['test--comment'],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/SQL Builder validation failed/);
      });
    });

    describe('SQL injection prevention in schema', () => {
      test('should reject SQL injection with DROP SCHEMA', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: "public'; DROP SCHEMA public; --",
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/SQL Builder validation failed/);
        expect(() =>
          buildEnableRLSSQL({
            schema: "public'; DROP SCHEMA public; --",
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/Invalid schema/);
      });

      test('should reject schema with semicolons', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public;DROP',
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/SQL Builder validation failed/);
      });

      test('should reject schema with spaces', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public DROP',
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/SQL Builder validation failed/);
      });
    });

    describe('SQL injection prevention in targetRoles', () => {
      test('should reject SQL injection in role names', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon', "'; DROP ROLE anon; --"],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/SQL Builder validation failed/);
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon', "'; DROP ROLE anon; --"],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/Invalid role/);
      });

      test('should reject empty roles array', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: [],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/SQL Builder validation failed/);
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: [],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/cannot be empty/);
      });
    });

    describe('SQL injection prevention in policyPrefix', () => {
      test('should reject SQL injection in policy prefix', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon'],
            policyPrefix: "deny'; DROP POLICY",
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/SQL Builder validation failed/);
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon'],
            policyPrefix: "deny'; DROP POLICY",
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(/Invalid policy prefix/);
      });
    });

    describe('SQL injection prevention in policyFunction', () => {
      test('should reject SQL injection in policy function', () => {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: "deny'; DROP FUNCTION",
          }),
        ).toThrow(/SQL Builder validation failed/);
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: "deny'; DROP FUNCTION",
          }),
        ).toThrow(/Invalid policy function/);
      });
    });
  });

  describe('Valid Inputs', () => {
    test('should generate valid SQL for legitimate inputs', () => {
      const sql = buildEnableRLSSQL({
        schema: 'public',
        targetRoles: ['anon', 'authenticated'],
        policyPrefix: 'deny_all',
        excludePatterns: ['pg_%', 'sql_%'],
        policyFunction: 'deny_all',
      });

      expect(sql).toContain('BEGIN;');
      expect(sql).toContain('COMMIT;');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION');
      expect(sql).not.toContain('DROP TABLE');
    });

    test('should include all target roles in SQL', () => {
      const sql = buildEnableRLSSQL({
        schema: 'public',
        targetRoles: ['anon', 'authenticated', 'service_role'],
        policyPrefix: 'deny_all',
        excludePatterns: [],
        policyFunction: 'deny_all',
      });

      expect(sql).toContain('anon, authenticated, service_role');
    });

    test('should apply exclude patterns correctly', () => {
      const sql = buildEnableRLSSQL({
        schema: 'public',
        targetRoles: ['anon'],
        policyPrefix: 'deny_all',
        excludePatterns: ['pg_%', '_migrations'],
        policyFunction: 'deny_all',
      });

      expect(sql).toContain("AND tablename NOT LIKE 'pg_%'");
      expect(sql).toContain("AND tablename NOT LIKE '_migrations'");
    });

    test('should use custom schema name', () => {
      const sql = buildEnableRLSSQL({
        schema: 'custom_schema',
        targetRoles: ['anon'],
        policyPrefix: 'deny_all',
        excludePatterns: [],
        policyFunction: 'deny_all',
      });

      expect(sql).toContain('custom_schema');
      expect(sql).toContain("schemaname = 'custom_schema'");
    });

    test('should use custom policy prefix', () => {
      const sql = buildEnableRLSSQL({
        schema: 'public',
        targetRoles: ['anon'],
        policyPrefix: 'custom_prefix',
        excludePatterns: [],
        policyFunction: 'deny_all',
      });

      expect(sql).toContain('custom_prefix_select');
      expect(sql).toContain('custom_prefix_insert');
      expect(sql).toContain('custom_prefix_update');
      expect(sql).toContain('custom_prefix_delete');
    });

    test('should use custom policy function name', () => {
      const sql = buildEnableRLSSQL({
        schema: 'public',
        targetRoles: ['anon'],
        policyPrefix: 'deny_all',
        excludePatterns: [],
        policyFunction: 'custom_deny_function',
      });

      expect(sql).toContain(
        'CREATE OR REPLACE FUNCTION public.custom_deny_function()',
      );
      expect(sql).toContain('public.custom_deny_function()');
    });

    test('should generate SQL with proper structure', () => {
      const sql = buildEnableRLSSQL({
        schema: 'public',
        targetRoles: ['anon'],
        policyPrefix: 'deny_all',
        excludePatterns: [],
        policyFunction: 'deny_all',
      });

      // Check for main sections
      expect(sql).toContain('SECTION 1: Helper Function');
      expect(sql).toContain('SECTION 2: Enable RLS');
      expect(sql).toContain('SECTION 3: Verification');
      expect(sql).toContain('COMPLETION MESSAGE');

      // Check for policy types
      expect(sql).toContain('FOR SELECT');
      expect(sql).toContain('FOR INSERT');
      expect(sql).toContain('FOR UPDATE');
      expect(sql).toContain('FOR DELETE');
    });
  });

  describe('Edge Cases', () => {
    test('should handle single role', () => {
      const sql = buildEnableRLSSQL({
        schema: 'public',
        targetRoles: ['anon'],
        policyPrefix: 'deny_all',
        excludePatterns: [],
        policyFunction: 'deny_all',
      });

      expect(sql).toContain('TO anon');
    });

    test('should handle empty exclude patterns', () => {
      const sql = buildEnableRLSSQL({
        schema: 'public',
        targetRoles: ['anon'],
        policyPrefix: 'deny_all',
        excludePatterns: [],
        policyFunction: 'deny_all',
      });

      expect(sql).not.toContain('AND tablename NOT LIKE');
    });

    test('should handle schema names with underscores', () => {
      const sql = buildEnableRLSSQL({
        schema: 'my_custom_schema',
        targetRoles: ['anon'],
        policyPrefix: 'deny_all',
        excludePatterns: [],
        policyFunction: 'deny_all',
      });

      expect(sql).toContain('my_custom_schema');
    });

    test('should handle role names with underscores', () => {
      const sql = buildEnableRLSSQL({
        schema: 'public',
        targetRoles: ['service_role', 'custom_role'],
        policyPrefix: 'deny_all',
        excludePatterns: [],
        policyFunction: 'deny_all',
      });

      expect(sql).toContain('service_role, custom_role');
    });

    test('should be idempotent (same input produces same output)', () => {
      const config = {
        schema: 'public',
        targetRoles: ['anon', 'authenticated'],
        policyPrefix: 'deny_all',
        excludePatterns: ['pg_%'],
        policyFunction: 'deny_all',
      };

      const sql1 = buildEnableRLSSQL(config);
      const sql2 = buildEnableRLSSQL(config);

      expect(sql1).toBe(sql2);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-Error exceptions from validators', async () => {
      const validators = await import('../../core/validators.js');

      const spy = vi
        .spyOn(validators, 'validateIdentifier')
        .mockImplementationOnce(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw new Error('This is a plain string error');
        });

      try {
        expect(() =>
          buildEnableRLSSQL({
            schema: 'public',
            targetRoles: ['anon'],
            policyPrefix: 'deny_all',
            excludePatterns: [],
            policyFunction: 'deny_all',
          }),
        ).toThrow(
          /SQL Builder validation failed: This is a plain string error/,
        );
      } finally {
        spy.mockRestore();
      }
    });
  });
});
