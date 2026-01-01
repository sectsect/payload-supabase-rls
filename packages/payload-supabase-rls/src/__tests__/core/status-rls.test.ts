import { describe, expect, vi, beforeEach, afterEach, test } from 'vitest';

import { getRLSStatus, printStatus } from '../../core/status-rls.js';

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
      Client: vi.fn(function MockClient() {
        return mockClient;
      }),
    },
  };
});

describe('getRLSStatus', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(() => {
    mockClient.connect.mockClear();
    mockClient.query.mockClear();
    mockClient.end.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation', () => {
    describe('SQL injection prevention in schema parameter', () => {
      test('should reject SQL injection attempts in schema', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            schema: "public'; DROP SCHEMA public; --",
          }),
        ).rejects.toThrow(/Status check configuration failed/);
      });

      test('should reject schema with SQL keywords', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            schema: 'DROP',
          }),
        ).rejects.toThrow(/Status check configuration failed/);
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            schema: 'DROP',
          }),
        ).rejects.toThrow(/Cannot use SQL keyword/);
      });

      test('should reject schema starting with number', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            schema: '123invalid',
          }),
        ).rejects.toThrow(/Status check configuration failed/);
      });

      test('should reject schema with semicolons', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            schema: 'test;DROP',
          }),
        ).rejects.toThrow(/Status check configuration failed/);
      });
    });

    describe('SQL injection prevention in excludePatterns', () => {
      test('should reject SQL injection with DROP TABLE', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            excludePatterns: ["'; DROP TABLE users; --"],
          }),
        ).rejects.toThrow(/Status check configuration failed/);
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            excludePatterns: ["'; DROP TABLE users; --"],
          }),
        ).rejects.toThrow(/Invalid pattern/);
      });

      test('should reject SQL injection with OR condition', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            excludePatterns: ["' OR '1'='1"],
          }),
        ).rejects.toThrow(/Status check configuration failed/);
      });

      test('should reject patterns with semicolons', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            excludePatterns: ['test;DROP'],
          }),
        ).rejects.toThrow(/Status check configuration failed/);
      });

      test('should reject patterns with SQL comments', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            excludePatterns: ['test--comment'],
          }),
        ).rejects.toThrow(/Status check configuration failed/);
      });

      test('should reject patterns with quotes', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            excludePatterns: ["test'pattern"],
          }),
        ).rejects.toThrow(/Status check configuration failed/);
      });

      test('should reject patterns with special SQL characters', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            excludePatterns: ['test()', 'test[]', 'test{}'],
          }),
        ).rejects.toThrow(/Status check configuration failed/);
      });

      test('should provide detailed error messages with pattern index', async () => {
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
            excludePatterns: ['valid_pattern', "'; DROP", 'another_valid'],
          }),
        ).rejects.toThrow(/Invalid pattern at index 1/);
      });
    });

    describe('Valid input acceptance', () => {
      test('should accept valid schema names', async () => {
        const validSchemas = ['public', 'my_schema', '_private', 'schema123'];

        const results = await Promise.all(
          validSchemas.map(async schema => {
            // Should not throw during validation (will fail at connection)
            try {
              await getRLSStatus({
                connectionString: mockConnectionString,
                schema,
              });
              return { schema, validationFailed: false };
            } catch (error) {
              if (
                error instanceof Error &&
                error.message.includes('Status check configuration failed')
              ) {
                return { schema, validationFailed: true };
              }
              return { schema, validationFailed: false };
            }
          }),
        );

        results.forEach(result => {
          expect(result.validationFailed).toBe(false);
        });
      });

      test('should accept valid patterns', async () => {
        const validPatterns = [
          ['pg_%', 'sql_%'],
          ['_internal'],
          ['temp%'],
          ['migration_123'],
        ];

        const results = await Promise.all(
          validPatterns.map(async excludePatterns => {
            // Should not throw during validation (will fail at connection)
            try {
              await getRLSStatus({
                connectionString: mockConnectionString,
                excludePatterns,
              });
              return { excludePatterns, validationFailed: false };
            } catch (error) {
              if (
                error instanceof Error &&
                error.message.includes('Status check configuration failed')
              ) {
                return { excludePatterns, validationFailed: true };
              }
              return { excludePatterns, validationFailed: false };
            }
          }),
        );

        results.forEach(result => {
          expect(result.validationFailed).toBe(false);
        });
      });

      test('should accept default parameters', async () => {
        // Should not throw during validation (will fail at connection)
        await expect(
          getRLSStatus({
            connectionString: mockConnectionString,
          }),
        ).rejects.not.toThrow(/Status check configuration failed/);
      });
    });

    describe('Required parameters', () => {
      test('should require connectionString', async () => {
        await expect(
          getRLSStatus({
            connectionString: '',
          }),
        ).rejects.toThrow(/Connection string is required/);
      });
    });
  });

  describe('Success Cases', () => {
    test('should successfully get RLS status for tables', async () => {
      // Mock successful database response
      const mockQueryResult = {
        rows: [
          { tablename: 'users', rowsecurity: true },
          { tablename: 'posts', rowsecurity: true },
          { tablename: 'media', rowsecurity: false },
        ],
      };

      mockClient.query.mockResolvedValue(mockQueryResult);

      const result = await getRLSStatus({
        connectionString: mockConnectionString,
      });

      expect(result).toEqual({
        tables: mockQueryResult.rows,
        totalTables: 3,
        enabledTables: 2,
        disabledTables: 1,
      });

      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.end).toHaveBeenCalledTimes(1);
    });

    test('should handle custom schema parameter', async () => {
      const mockQueryResult = {
        rows: [{ tablename: 'custom_table', rowsecurity: true }],
      };

      mockClient.query.mockResolvedValue(mockQueryResult);

      const result = await getRLSStatus({
        connectionString: mockConnectionString,
        schema: 'custom_schema',
      });

      expect(result).toEqual({
        tables: mockQueryResult.rows,
        totalTables: 1,
        enabledTables: 1,
        disabledTables: 0,
      });

      // Verify SQL query includes custom schema
      const queryCall = mockClient.query.mock.calls[0][0];
      expect(queryCall).toContain("schemaname = 'custom_schema'");
    });

    test('should handle excludePatterns parameter', async () => {
      const mockQueryResult = {
        rows: [{ tablename: 'users', rowsecurity: true }],
      };

      mockClient.query.mockResolvedValue(mockQueryResult);

      const result = await getRLSStatus({
        connectionString: mockConnectionString,
        excludePatterns: ['pg_%', 'sql_%'],
      });

      expect(result.totalTables).toBe(1);

      // Verify SQL query includes exclude conditions
      const queryCall = mockClient.query.mock.calls[0][0];
      expect(queryCall).toContain("NOT LIKE 'pg_%'");
      expect(queryCall).toContain("NOT LIKE 'sql_%'");
    });

    test('should handle empty result set', async () => {
      const mockQueryResult = {
        rows: [],
      };

      mockClient.query.mockResolvedValue(mockQueryResult);

      const result = await getRLSStatus({
        connectionString: mockConnectionString,
      });

      expect(result).toEqual({
        tables: [],
        totalTables: 0,
        enabledTables: 0,
        disabledTables: 0,
      });
    });

    test('should properly close connection on success', async () => {
      const mockQueryResult = {
        rows: [{ tablename: 'test', rowsecurity: true }],
      };

      mockClient.query.mockResolvedValue(mockQueryResult);

      await getRLSStatus({
        connectionString: mockConnectionString,
      });

      expect(mockClient.end).toHaveBeenCalledTimes(1);
    });

    test('should properly close connection on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(
        getRLSStatus({
          connectionString: mockConnectionString,
        }),
      ).rejects.toThrow('Database error');

      expect(mockClient.end).toHaveBeenCalledTimes(1);
    });

    test('should calculate statistics correctly', async () => {
      const mockQueryResult = {
        rows: [
          { tablename: 'table1', rowsecurity: true },
          { tablename: 'table2', rowsecurity: true },
          { tablename: 'table3', rowsecurity: false },
          { tablename: 'table4', rowsecurity: false },
          { tablename: 'table5', rowsecurity: true },
        ],
      };

      mockClient.query.mockResolvedValue(mockQueryResult);

      const result = await getRLSStatus({
        connectionString: mockConnectionString,
      });

      expect(result.totalTables).toBe(5);
      expect(result.enabledTables).toBe(3);
      expect(result.disabledTables).toBe(2);
    });
  });
});

describe('printStatus', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleTableSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleTableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleTableSpy.mockRestore();
  });

  test('should print RLS status header', () => {
    const result = {
      tables: [{ tablename: 'users', rowsecurity: true }],
      totalTables: 1,
      enabledTables: 1,
      disabledTables: 0,
    };

    printStatus(result);

    expect(consoleLogSpy).toHaveBeenCalled();
    const allCalls = consoleLogSpy.mock.calls
      .map((call: unknown[]) => call[0])
      .join('\n');
    expect(allCalls).toContain('RLS Status');
  });

  test('should print table data with console.table', () => {
    const result = {
      tables: [
        { tablename: 'users', rowsecurity: true },
        { tablename: 'posts', rowsecurity: false },
      ],
      totalTables: 2,
      enabledTables: 1,
      disabledTables: 1,
    };

    printStatus(result);

    expect(consoleTableSpy).toHaveBeenCalledTimes(1);
    const tableData = consoleTableSpy.mock.calls[0][0];
    expect(tableData).toEqual([
      { 'Table Name': 'users', 'RLS Enabled': '✅ Yes' },
      { 'Table Name': 'posts', 'RLS Enabled': '❌ No' },
    ]);
  });

  test('should print summary with correct statistics', () => {
    const result = {
      tables: [
        { tablename: 'users', rowsecurity: true },
        { tablename: 'posts', rowsecurity: true },
        { tablename: 'media', rowsecurity: false },
      ],
      totalTables: 3,
      enabledTables: 2,
      disabledTables: 1,
    };

    printStatus(result);

    const allCalls = consoleLogSpy.mock.calls
      .map((call: unknown[]) => call[0])
      .join('\n');
    expect(allCalls).toContain('Summary');
    expect(allCalls).toContain('2/3 tables have RLS enabled');
  });

  test('should handle empty table list', () => {
    const result = {
      tables: [],
      totalTables: 0,
      enabledTables: 0,
      disabledTables: 0,
    };

    printStatus(result);

    expect(consoleTableSpy).toHaveBeenCalledWith([]);
    const allCalls = consoleLogSpy.mock.calls
      .map((call: unknown[]) => call[0])
      .join('\n');
    expect(allCalls).toContain('0/0 tables have RLS enabled');
  });
});
