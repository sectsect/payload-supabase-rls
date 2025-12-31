import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { verifyRLS, printReport } from '../../src/core/verify-rls.js';

// Create mock client instance
const mockClient = {
  connect: vi.fn(),
  query: vi.fn(),
  end: vi.fn(),
};

// Mock pg module
vi.mock('pg', () => {
  return {
    default: {
      Client: class Client {
        constructor() {
          return mockClient;
        }
      },
    },
  };
});

describe('verifyRLS - Input Validation', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';

  describe('SQL injection prevention in schema parameter', () => {
    it('should reject SQL injection attempts in schema', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          schema: "public'; DROP SCHEMA public; --",
        }),
      ).rejects.toThrow(/Verification configuration failed/);
    });

    it('should reject schema with SQL keywords', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          schema: 'DROP',
        }),
      ).rejects.toThrow(/Verification configuration failed/);
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          schema: 'DROP',
        }),
      ).rejects.toThrow(/Cannot use SQL keyword/);
    });

    it('should reject schema starting with number', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          schema: '123invalid',
        }),
      ).rejects.toThrow(/Verification configuration failed/);
    });

    it('should reject schema with semicolons', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          schema: 'test;DROP',
        }),
      ).rejects.toThrow(/Verification configuration failed/);
    });
  });

  describe('SQL injection prevention in excludePatterns', () => {
    it('should reject SQL injection with DROP TABLE', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          excludePatterns: ["'; DROP TABLE users; --"],
        }),
      ).rejects.toThrow(/Verification configuration failed/);
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          excludePatterns: ["'; DROP TABLE users; --"],
        }),
      ).rejects.toThrow(/Invalid pattern/);
    });

    it('should reject SQL injection with OR condition', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          excludePatterns: ["' OR '1'='1"],
        }),
      ).rejects.toThrow(/Verification configuration failed/);
    });

    it('should reject patterns with semicolons', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          excludePatterns: ['test;DROP'],
        }),
      ).rejects.toThrow(/Verification configuration failed/);
    });

    it('should reject patterns with SQL comments', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          excludePatterns: ['test--comment'],
        }),
      ).rejects.toThrow(/Verification configuration failed/);
    });

    it('should reject patterns with quotes', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          excludePatterns: ["test'pattern"],
        }),
      ).rejects.toThrow(/Verification configuration failed/);
    });

    it('should reject patterns with special SQL characters', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          excludePatterns: ['test()', 'test[]', 'test{}'],
        }),
      ).rejects.toThrow(/Verification configuration failed/);
    });

    it('should provide detailed error messages with pattern index', async () => {
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
          excludePatterns: ['valid_pattern', "'; DROP", 'another_valid'],
        }),
      ).rejects.toThrow(/Invalid pattern at index 1/);
    });
  });

  describe('Valid input acceptance', () => {
    it('should accept valid schema names', async () => {
      const validSchemas = ['public', 'my_schema', '_private', 'schema123'];

      for (const schema of validSchemas) {
        // Should not throw during validation (will fail at connection)
        await expect(
          verifyRLS({
            connectionString: mockConnectionString,
            schema,
          }),
        ).rejects.not.toThrow(/Verification configuration failed/);
      }
    });

    it('should accept valid patterns', async () => {
      const validPatterns = [
        ['pg_%', 'sql_%'],
        ['_internal'],
        ['temp%'],
        ['migration_123'],
      ];

      for (const excludePatterns of validPatterns) {
        // Should not throw during validation (will fail at connection)
        await expect(
          verifyRLS({
            connectionString: mockConnectionString,
            excludePatterns,
          }),
        ).rejects.not.toThrow(/Verification configuration failed/);
      }
    });

    it('should accept default parameters', async () => {
      // Should not throw during validation (will fail at connection)
      await expect(
        verifyRLS({
          connectionString: mockConnectionString,
        }),
      ).rejects.not.toThrow(/Verification configuration failed/);
    });
  });

  describe('Required parameters', () => {
    it('should require connectionString', async () => {
      await expect(
        verifyRLS({
          connectionString: '',
        }),
      ).rejects.toThrow(/Connection string is required/);
    });
  });
});

describe('verifyRLS - Success Cases', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully verify RLS status for tables', async () => {
    // Mock successful database response
    const mockQueryResult = {
      rows: [
        { tablename: 'users', rls_enabled: true, policy_count: 4 },
        { tablename: 'posts', rls_enabled: true, policy_count: 4 },
        { tablename: 'media', rls_enabled: false, policy_count: 0 },
      ],
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    const result = await verifyRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      totalTables: 3,
      protectedTables: 2,
      unprotectedTables: 1,
      tables: mockQueryResult.rows,
    });

    expect(mockClient.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should handle custom schema parameter', async () => {
    const mockQueryResult = {
      rows: [
        { tablename: 'custom_table', rls_enabled: true, policy_count: 2 },
      ],
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    const result = await verifyRLS({
      connectionString: mockConnectionString,
      schema: 'custom_schema',
    });

    expect(result).toEqual({
      totalTables: 1,
      protectedTables: 1,
      unprotectedTables: 0,
      tables: mockQueryResult.rows,
    });

    // Verify SQL query includes custom schema
    const queryCall = mockClient.query.mock.calls[0][0];
    expect(queryCall).toContain("schemaname = 'custom_schema'");
  });

  it('should handle excludePatterns parameter', async () => {
    const mockQueryResult = {
      rows: [
        { tablename: 'users', rls_enabled: true, policy_count: 4 },
      ],
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    const result = await verifyRLS({
      connectionString: mockConnectionString,
      excludePatterns: ['pg_%', 'sql_%'],
    });

    expect(result.totalTables).toBe(1);

    // Verify SQL query includes exclude conditions
    const queryCall = mockClient.query.mock.calls[0][0];
    expect(queryCall).toContain("NOT LIKE 'pg_%'");
    expect(queryCall).toContain("NOT LIKE 'sql_%'");
  });

  it('should handle empty result set', async () => {
    const mockQueryResult = {
      rows: [],
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    const result = await verifyRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      totalTables: 0,
      protectedTables: 0,
      unprotectedTables: 0,
      tables: [],
    });
  });

  it('should properly close connection on success', async () => {
    const mockQueryResult = {
      rows: [{ tablename: 'test', rls_enabled: true, policy_count: 1 }],
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    await verifyRLS({
      connectionString: mockConnectionString,
    });

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should properly close connection on error', async () => {
    mockClient.query.mockRejectedValue(new Error('Database error'));

    await expect(
      verifyRLS({
        connectionString: mockConnectionString,
      }),
    ).rejects.toThrow('Database error');

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should calculate statistics correctly', async () => {
    const mockQueryResult = {
      rows: [
        { tablename: 'table1', rls_enabled: true, policy_count: 4 },
        { tablename: 'table2', rls_enabled: true, policy_count: 2 },
        { tablename: 'table3', rls_enabled: false, policy_count: 0 },
        { tablename: 'table4', rls_enabled: false, policy_count: 0 },
        { tablename: 'table5', rls_enabled: true, policy_count: 1 },
      ],
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    const result = await verifyRLS({
      connectionString: mockConnectionString,
    });

    expect(result.totalTables).toBe(5);
    expect(result.protectedTables).toBe(3);
    expect(result.unprotectedTables).toBe(2);
  });
});

describe('printReport', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should print summary with correct statistics', () => {
    const result = {
      totalTables: 5,
      protectedTables: 3,
      unprotectedTables: 2,
      tables: [
        { tablename: 'users', rls_enabled: true, policy_count: 4 },
        { tablename: 'posts', rls_enabled: true, policy_count: 4 },
        { tablename: 'media', rls_enabled: true, policy_count: 4 },
        { tablename: 'legacy1', rls_enabled: false, policy_count: 0 },
        { tablename: 'legacy2', rls_enabled: false, policy_count: 0 },
      ],
    };

    printReport(result);

    expect(consoleLogSpy).toHaveBeenCalled();
    const allCalls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(allCalls).toContain('RLS Verification Report');
    expect(allCalls).toContain('Total tables:       5');
    expect(allCalls).toContain('RLS enabled:      3');
    expect(allCalls).toContain('RLS disabled:     2');
  });

  it('should show unprotected tables', () => {
    const result = {
      totalTables: 3,
      protectedTables: 1,
      unprotectedTables: 2,
      tables: [
        { tablename: 'users', rls_enabled: true, policy_count: 4 },
        { tablename: 'legacy1', rls_enabled: false, policy_count: 0 },
        { tablename: 'legacy2', rls_enabled: false, policy_count: 0 },
      ],
    };

    printReport(result);

    const allCalls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(allCalls).toContain('Tables without RLS');
    expect(allCalls).toContain('legacy1');
    expect(allCalls).toContain('legacy2');
  });

  it('should show tables with RLS but no policies', () => {
    const result = {
      totalTables: 2,
      protectedTables: 2,
      unprotectedTables: 0,
      tables: [
        { tablename: 'users', rls_enabled: true, policy_count: 4 },
        { tablename: 'empty', rls_enabled: true, policy_count: 0 },
      ],
    };

    printReport(result);

    const allCalls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(allCalls).toContain('Tables with RLS but no policies');
    expect(allCalls).toContain('empty');
  });

  it('should show tables with unexpected policy count', () => {
    const result = {
      totalTables: 2,
      protectedTables: 2,
      unprotectedTables: 0,
      tables: [
        { tablename: 'users', rls_enabled: true, policy_count: 4 },
        { tablename: 'partial', rls_enabled: true, policy_count: 2 },
      ],
    };

    printReport(result);

    const allCalls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(allCalls).toContain('Tables with unexpected policy count');
    expect(allCalls).toContain('partial: 2 policies');
  });

  it('should show success message when all tables are protected', () => {
    const result = {
      totalTables: 2,
      protectedTables: 2,
      unprotectedTables: 0,
      tables: [
        { tablename: 'users', rls_enabled: true, policy_count: 4 },
        { tablename: 'posts', rls_enabled: true, policy_count: 4 },
      ],
    };

    printReport(result);

    const allCalls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(allCalls).toContain('All tables have RLS enabled');
    expect(allCalls).toContain('correct deny-all configuration');
  });

  it('should show warning when tables need attention', () => {
    const result = {
      totalTables: 2,
      protectedTables: 1,
      unprotectedTables: 1,
      tables: [
        { tablename: 'users', rls_enabled: true, policy_count: 4 },
        { tablename: 'legacy', rls_enabled: false, policy_count: 0 },
      ],
    };

    printReport(result);

    const allCalls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(allCalls).toContain('Some tables need attention');
    expect(allCalls).toContain('payload-supabase-rls enable');
  });

  it('should print detailed table status', () => {
    const result = {
      totalTables: 2,
      protectedTables: 1,
      unprotectedTables: 1,
      tables: [
        { tablename: 'users', rls_enabled: true, policy_count: 4 },
        { tablename: 'legacy', rls_enabled: false, policy_count: 0 },
      ],
    };

    printReport(result);

    const allCalls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(allCalls).toContain('Detailed Table Status');
    expect(allCalls).toContain('Table Name');
    expect(allCalls).toContain('RLS');
    expect(allCalls).toContain('Policies');
  });
});
