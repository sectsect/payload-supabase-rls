import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { enableRLS } from '../../src/core/enable-rls.js';
import { buildEnableRLSSQL } from '../../src/core/sql-builder.js';

// Create mock client instance
const mockClient = {
  connect: vi.fn(),
  query: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
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

// Mock sql-builder module
vi.mock('../../src/core/sql-builder.js');

// Helper function to simulate NOTICE events
function createNoticeSimulator(messages: string[]) {
  return (event: string, callback: (msg: { message: string }) => void) => {
    if (event === 'notice') {
      messages.forEach(msg => callback({ message: msg }));
    }
    return mockClient;
  };
}

describe('enableRLS - Input Validation', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return error when connectionString is missing', async () => {
    const result = await enableRLS({
      connectionString: '',
    });

    expect(result).toEqual({
      success: false,
      tablesProcessed: 0,
      policiesCreated: 0,
      errors: ['Connection string is required'],
    });

    // Should not attempt to connect
    expect(mockClient.connect).not.toHaveBeenCalled();
  });

  it('should return error when connectionString is undefined', async () => {
    const result = await enableRLS({
      connectionString: undefined as any,
    });

    expect(result).toEqual({
      success: false,
      tablesProcessed: 0,
      policiesCreated: 0,
      errors: ['Connection string is required'],
    });

    // Should not attempt to connect
    expect(mockClient.connect).not.toHaveBeenCalled();
  });

  it('should not connect to database when connectionString is missing', async () => {
    await enableRLS({
      connectionString: '',
    });

    expect(mockClient.connect).not.toHaveBeenCalled();
    expect(mockClient.query).not.toHaveBeenCalled();
    expect(mockClient.end).not.toHaveBeenCalled();
  });
});

describe('enableRLS - Success Cases', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully enable RLS with default config', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 3 tables with 12 policies total']),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: true,
      tablesProcessed: 3,
      policiesCreated: 12,
    });

    expect(mockClient.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should handle custom schema parameter', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 2 tables with 8 policies total']),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
      schema: 'custom_schema',
    });

    expect(result).toEqual({
      success: true,
      tablesProcessed: 2,
      policiesCreated: 8,
    });

    // Verify buildEnableRLSSQL was called with custom schema
    expect(vi.mocked(buildEnableRLSSQL)).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: 'custom_schema',
      }),
    );
  });

  it('should handle custom targetRoles parameter', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
      targetRoles: ['custom_role'],
    });

    expect(result.success).toBe(true);

    // Verify buildEnableRLSSQL was called with custom roles
    expect(vi.mocked(buildEnableRLSSQL)).toHaveBeenCalledWith(
      expect.objectContaining({
        targetRoles: ['custom_role'],
      }),
    );
  });

  it('should handle custom policyPrefix parameter', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
      policyPrefix: 'custom_prefix',
    });

    expect(result.success).toBe(true);

    // Verify buildEnableRLSSQL was called with custom prefix
    expect(vi.mocked(buildEnableRLSSQL)).toHaveBeenCalledWith(
      expect.objectContaining({
        policyPrefix: 'custom_prefix',
      }),
    );
  });

  it('should handle custom excludePatterns parameter', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 5 tables with 20 policies total']),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
      excludePatterns: ['temp_%', 'migration_%'],
    });

    expect(result.success).toBe(true);

    // Verify buildEnableRLSSQL was called with custom patterns
    expect(vi.mocked(buildEnableRLSSQL)).toHaveBeenCalledWith(
      expect.objectContaining({
        excludePatterns: ['temp_%', 'migration_%'],
      }),
    );
  });

  it('should handle custom policyFunction parameter', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
      policyFunction: 'custom_deny',
    });

    expect(result.success).toBe(true);

    // Verify buildEnableRLSSQL was called with custom function
    expect(vi.mocked(buildEnableRLSSQL)).toHaveBeenCalledWith(
      expect.objectContaining({
        policyFunction: 'custom_deny',
      }),
    );
  });

  it('should apply default values correctly', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 3 tables with 12 policies total']),
    );

    await enableRLS({
      connectionString: mockConnectionString,
    });

    // Verify buildEnableRLSSQL was called with default values
    expect(vi.mocked(buildEnableRLSSQL)).toHaveBeenCalledWith({
      schema: 'public',
      targetRoles: ['anon', 'authenticated'],
      policyPrefix: 'deny_all',
      excludePatterns: ['pg_%', 'sql_%'],
      policyFunction: 'deny_all',
    });
  });
});

describe('enableRLS - NOTICE Parsing', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse tables count from NOTICE message', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 5 tables with 20 policies total']),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: true,
      tablesProcessed: 5,
      policiesCreated: 20,
    });
  });

  it('should parse policies count from NOTICE message', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['RLS enabled on 2 tables with 8 policies total']),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: true,
      tablesProcessed: 2,
      policiesCreated: 8,
    });
  });

  it('should handle NOTICE without statistics', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['Some other message without statistics']),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: true,
      tablesProcessed: 0,
      policiesCreated: 0,
    });
  });

  it('should handle multiple NOTICE messages', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator([
        '✅ RLS function created',
        '✅ RLS enabled on 3 tables with 12 policies total',
        '✅ Verification complete: 3 tables protected, 0 unprotected',
      ]),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: true,
      tablesProcessed: 3,
      policiesCreated: 12,
    });
  });

  it('should update statistics from latest matching NOTICE', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator([
        '✅ RLS enabled on 1 tables with 4 policies total',
        '✅ RLS enabled on 5 tables with 20 policies total',
      ]),
    );

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    // Latest values should win
    expect(result).toEqual({
      success: true,
      tablesProcessed: 5,
      policiesCreated: 20,
    });
  });
});

describe('enableRLS - Error Handling', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle connection errors', async () => {
    mockClient.connect.mockRejectedValue(new Error('Connection failed'));

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: false,
      tablesProcessed: 0,
      policiesCreated: 0,
      errors: ['Connection failed'],
    });

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should handle SQL builder validation errors', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockImplementation(() => {
      throw new Error('SQL Builder validation failed: Invalid schema');
    });

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: false,
      tablesProcessed: 0,
      policiesCreated: 0,
      errors: ['SQL Builder validation failed: Invalid schema'],
    });

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should handle query execution errors', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockReturnValue(mockClient);
    mockClient.query.mockRejectedValue(new Error('Query failed'));

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: false,
      tablesProcessed: 0,
      policiesCreated: 0,
      errors: ['Query failed'],
    });

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should handle non-Error thrown values (string)', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockReturnValue(mockClient);
    mockClient.query.mockRejectedValue('String error');

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: false,
      tablesProcessed: 0,
      policiesCreated: 0,
      errors: ['String error'],
    });

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should handle non-Error thrown values (number)', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockReturnValue(mockClient);
    mockClient.query.mockRejectedValue(42);

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result).toEqual({
      success: false,
      tablesProcessed: 0,
      policiesCreated: 0,
      errors: ['42'],
    });

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should return zero stats on error', async () => {
    mockClient.connect.mockRejectedValue(new Error('Any error'));

    const result = await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(result.tablesProcessed).toBe(0);
    expect(result.policiesCreated).toBe(0);
    expect(result.success).toBe(false);
  });
});

describe('enableRLS - Connection Cleanup', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should close connection on success', async () => {
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should close connection on error', async () => {
    mockClient.connect.mockRejectedValue(new Error('Connection error'));

    await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  it('should close connection even if SQL builder throws', async () => {
    vi.mocked(buildEnableRLSSQL).mockImplementation(() => {
      throw new Error('SQL validation failed');
    });

    await enableRLS({
      connectionString: mockConnectionString,
    });

    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });
});

describe('enableRLS - Verbose Logging', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log connecting message when verbose=true', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.query.mockResolvedValue(undefined);
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    await enableRLS({
      connectionString: mockConnectionString,
      verbose: true,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('🔄 Connecting to database...');
  });

  it('should log connected message when verbose=true', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.query.mockResolvedValue(undefined);
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    await enableRLS({
      connectionString: mockConnectionString,
      verbose: true,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Connected to database');
  });

  it('should log SQL generation messages when verbose=true', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.query.mockResolvedValue(undefined);
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    await enableRLS({
      connectionString: mockConnectionString,
      verbose: true,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('🔄 Generating RLS SQL...');
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ SQL generated');
  });

  it('should log execution messages when verbose=true', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.query.mockResolvedValue(undefined);
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    await enableRLS({
      connectionString: mockConnectionString,
      verbose: true,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('🔄 Executing RLS re-enablement...');
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ RLS re-enablement complete');
  });

  it('should log NOTICE messages when verbose=true', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.query.mockResolvedValue(undefined);
    const noticeMessage = '✅ RLS enabled on 3 tables with 12 policies total';
    mockClient.on.mockImplementation(createNoticeSimulator([noticeMessage]));

    await enableRLS({
      connectionString: mockConnectionString,
      verbose: true,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(noticeMessage);
  });

  it('should log error details when verbose=true', async () => {
    mockClient.connect.mockRejectedValue(new Error('Connection failed'));

    await enableRLS({
      connectionString: mockConnectionString,
      verbose: true,
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error enabling RLS:');
    expect(consoleErrorSpy).toHaveBeenCalledWith('   Connection failed');
  });

  it('should log stack trace when verbose=true and Error has stack', async () => {
    const errorWithStack = new Error('Test error');
    errorWithStack.stack = 'Error: Test error\n    at <stack trace>';
    mockClient.connect.mockRejectedValue(errorWithStack);

    await enableRLS({
      connectionString: mockConnectionString,
      verbose: true,
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(errorWithStack.stack);
  });

  it('should log connection closed when verbose=true', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.query.mockResolvedValue(undefined);
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    await enableRLS({
      connectionString: mockConnectionString,
      verbose: true,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('🔌 Database connection closed');
  });

  it('should NOT log when verbose=false', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.query.mockResolvedValue(undefined);
    mockClient.on.mockImplementation(
      createNoticeSimulator(['✅ RLS enabled on 1 tables with 4 policies total']),
    );

    await enableRLS({
      connectionString: mockConnectionString,
      verbose: false,
    });

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe('enableRLS - Edge Cases', () => {
  const mockConnectionString = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle Error without stack property', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorWithoutStack = new Error('Error without stack');
    delete errorWithoutStack.stack;
    mockClient.connect.mockRejectedValue(errorWithoutStack);

    const result = await enableRLS({
      connectionString: mockConnectionString,
      verbose: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Error without stack']);
    // Should not crash when trying to log stack
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should register NOTICE listener before query execution', async () => {
    mockClient.connect.mockResolvedValue(undefined);
    vi.mocked(buildEnableRLSSQL).mockReturnValue('MOCK SQL');
    mockClient.query.mockResolvedValue(undefined);

    const callOrder: string[] = [];
    mockClient.on.mockImplementation(() => {
      callOrder.push('on');
      return mockClient;
    });
    mockClient.query.mockImplementation(async () => {
      callOrder.push('query');
      return undefined;
    });

    await enableRLS({
      connectionString: mockConnectionString,
    });

    // NOTICE listener ('on') should be registered before query execution
    expect(callOrder).toEqual(['on', 'query']);
    expect(mockClient.on).toHaveBeenCalledWith('notice', expect.any(Function));
  });
});
