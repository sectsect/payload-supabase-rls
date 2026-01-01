import { describe, expect, test } from 'vitest';

import {
  validatePattern,
  validateIdentifier,
  validatePatterns,
  validateRoles,
} from '../../core/validators.js';

describe('validators', () => {
  describe('validatePattern', () => {
    describe('valid patterns', () => {
      test('should accept simple patterns', () => {
        expect(() => validatePattern('pg_temp')).not.toThrow();
        expect(() => validatePattern('sql_temp')).not.toThrow();
        expect(() => validatePattern('test')).not.toThrow();
      });

      test('should accept patterns with wildcards', () => {
        expect(() => validatePattern('pg_%')).not.toThrow();
        expect(() => validatePattern('sql_%')).not.toThrow();
        expect(() => validatePattern('%test%')).not.toThrow();
        expect(() => validatePattern('_test')).not.toThrow();
      });

      test('should accept patterns with numbers', () => {
        expect(() => validatePattern('table123')).not.toThrow();
        expect(() => validatePattern('test_123_%')).not.toThrow();
      });

      test('should accept complex valid patterns', () => {
        expect(() => validatePattern('temp_%_archive')).not.toThrow();
        expect(() => validatePattern('test_%123')).not.toThrow();
      });
    });

    describe('SQL injection attempts', () => {
      test('should reject patterns with semicolons', () => {
        expect(() => validatePattern('test;DROP')).toThrow(/Invalid pattern/);
      });

      test('should reject patterns with single quotes', () => {
        expect(() => validatePattern("'; DROP TABLE users; --")).toThrow(
          /Invalid pattern/,
        );
        expect(() => validatePattern("test'name")).toThrow(/Invalid pattern/);
      });

      test('should reject patterns with double dashes', () => {
        expect(() => validatePattern('test--comment')).toThrow(
          /Invalid pattern/,
        );
      });

      test('should reject patterns with SQL keywords', () => {
        expect(() => validatePattern('test DROP')).toThrow(/Invalid pattern/);
        expect(() => validatePattern('test/*comment*/')).toThrow(
          /Invalid pattern/,
        );
      });

      test('should reject patterns with special characters', () => {
        expect(() => validatePattern('test@domain')).toThrow(/Invalid pattern/);
        expect(() => validatePattern('test#hash')).toThrow(/Invalid pattern/);
        expect(() => validatePattern('test$var')).toThrow(/Invalid pattern/);
      });
    });

    describe('edge cases', () => {
      test('should reject empty patterns', () => {
        expect(() => validatePattern('')).toThrow(/cannot be empty/);
      });

      test('should reject patterns longer than 63 characters', () => {
        const longPattern = 'a'.repeat(64);
        expect(() => validatePattern(longPattern)).toThrow(/too long/);
        expect(() => validatePattern(longPattern)).toThrow(/63 characters/);
      });

      test('should accept patterns exactly 63 characters', () => {
        const maxPattern = 'a'.repeat(63);
        expect(() => validatePattern(maxPattern)).not.toThrow();
      });

      test('should reject non-string inputs', () => {
        expect(() => validatePattern(123 as unknown)).toThrow(
          /must be a string/,
        );
        expect(() => validatePattern(null as unknown)).toThrow(
          /must be a string/,
        );
        expect(() => validatePattern(undefined as unknown)).toThrow(
          /must be a string/,
        );
        expect(() => validatePattern({} as unknown)).toThrow(
          /must be a string/,
        );
      });
    });
  });

  describe('validateIdentifier', () => {
    describe('valid identifiers', () => {
      test('should accept simple identifiers', () => {
        expect(() => validateIdentifier('public', 'schema')).not.toThrow();
        expect(() => validateIdentifier('users', 'table')).not.toThrow();
        expect(() => validateIdentifier('anon', 'role')).not.toThrow();
      });

      test('should accept identifiers starting with underscore', () => {
        expect(() => validateIdentifier('_private', 'schema')).not.toThrow();
        expect(() => validateIdentifier('_internal', 'table')).not.toThrow();
      });

      test('should accept identifiers with dollar signs', () => {
        expect(() => validateIdentifier('test$var', 'schema')).not.toThrow();
        expect(() => validateIdentifier('my$table', 'table')).not.toThrow();
      });

      test('should accept identifiers with numbers', () => {
        expect(() => validateIdentifier('table1', 'table')).not.toThrow();
        expect(() => validateIdentifier('test_123', 'schema')).not.toThrow();
      });

      test('should accept complex valid identifiers', () => {
        expect(() =>
          validateIdentifier('my_schema_v2', 'schema'),
        ).not.toThrow();
        expect(() => validateIdentifier('authenticated', 'role')).not.toThrow();
      });
    });

    describe('SQL injection attempts', () => {
      test('should reject identifiers with semicolons', () => {
        expect(() =>
          validateIdentifier("public'; DROP SCHEMA public; --", 'schema'),
        ).toThrow(/Invalid schema/);
        expect(() => validateIdentifier('anon;DROP ROLE', 'role')).toThrow(
          /Invalid role/,
        );
      });

      test('should reject identifiers with single quotes', () => {
        expect(() => validateIdentifier("test'name", 'table')).toThrow(
          /Invalid table/,
        );
        expect(() =>
          validateIdentifier("'; DROP TABLE users; --", 'schema'),
        ).toThrow(/Invalid schema/);
      });

      test('should reject identifiers with double dashes', () => {
        expect(() => validateIdentifier('test--comment', 'schema')).toThrow(
          /Invalid schema/,
        );
      });

      test('should reject identifiers with spaces', () => {
        expect(() => validateIdentifier('test name', 'schema')).toThrow(
          /Invalid schema/,
        );
        expect(() => validateIdentifier('DROP TABLE', 'role')).toThrow(
          /Invalid role/,
        );
      });

      test('should reject identifiers with special characters', () => {
        expect(() => validateIdentifier('test@domain', 'schema')).toThrow(
          /Invalid schema/,
        );
        expect(() => validateIdentifier('test#hash', 'schema')).toThrow(
          /Invalid schema/,
        );
        expect(() => validateIdentifier('test%percent', 'role')).toThrow(
          /Invalid role/,
        );
      });
    });

    describe('SQL keywords', () => {
      test('should reject common SQL keywords', () => {
        expect(() => validateIdentifier('DROP', 'schema')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('SELECT', 'role')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('INSERT', 'table')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('UPDATE', 'schema')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('DELETE', 'schema')).toThrow(
          /Cannot use SQL keyword/,
        );
      });

      test('should reject dangerous SQL keywords', () => {
        expect(() => validateIdentifier('CREATE', 'schema')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('ALTER', 'schema')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('TRUNCATE', 'schema')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('GRANT', 'role')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('REVOKE', 'role')).toThrow(
          /Cannot use SQL keyword/,
        );
      });

      test('should be case-insensitive for keywords', () => {
        expect(() => validateIdentifier('drop', 'schema')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('DroP', 'schema')).toThrow(
          /Cannot use SQL keyword/,
        );
        expect(() => validateIdentifier('sElEcT', 'schema')).toThrow(
          /Cannot use SQL keyword/,
        );
      });
    });

    describe('invalid start characters', () => {
      test('should reject identifiers starting with numbers', () => {
        expect(() => validateIdentifier('123table', 'schema')).toThrow(
          /Must start with letter/,
        );
        expect(() => validateIdentifier('1test', 'table')).toThrow(
          /Must start with letter/,
        );
      });

      test('should reject identifiers starting with dollar signs', () => {
        expect(() => validateIdentifier('$test', 'schema')).toThrow(
          /Must start with letter/,
        );
      });

      test('should reject identifiers starting with special characters', () => {
        expect(() => validateIdentifier('@test', 'schema')).toThrow(
          /Must start with letter/,
        );
        expect(() => validateIdentifier('#test', 'schema')).toThrow(
          /Must start with letter/,
        );
      });
    });

    describe('edge cases', () => {
      test('should reject empty identifiers', () => {
        expect(() => validateIdentifier('', 'schema')).toThrow(
          /cannot be empty/,
        );
      });

      test('should reject identifiers longer than 63 characters', () => {
        const longId = 'a'.repeat(64);
        expect(() => validateIdentifier(longId, 'schema')).toThrow(/too long/);
        expect(() => validateIdentifier(longId, 'schema')).toThrow(
          /63 characters/,
        );
      });

      test('should accept identifiers exactly 63 characters', () => {
        const maxId = 'a'.repeat(63);
        expect(() => validateIdentifier(maxId, 'schema')).not.toThrow();
      });

      test('should reject non-string inputs', () => {
        expect(() => validateIdentifier(123 as unknown, 'schema')).toThrow(
          /must be a string/,
        );
        expect(() => validateIdentifier(null as unknown, 'schema')).toThrow(
          /must be a string/,
        );
        expect(() =>
          validateIdentifier(undefined as unknown, 'schema'),
        ).toThrow(/must be a string/);
      });

      test('should include type in error messages', () => {
        expect(() => validateIdentifier('', 'schema')).toThrow(/schema/);
        expect(() => validateIdentifier('', 'role')).toThrow(/role/);
        expect(() => validateIdentifier('', 'policy prefix')).toThrow(
          /policy prefix/,
        );
      });
    });
  });

  describe('validatePatterns', () => {
    describe('valid pattern arrays', () => {
      test('should accept empty arrays', () => {
        expect(() => validatePatterns([])).not.toThrow();
      });

      test('should accept single valid pattern', () => {
        expect(() => validatePatterns(['pg_%'])).not.toThrow();
      });

      test('should accept multiple valid patterns', () => {
        expect(() => validatePatterns(['pg_%', 'sql_%'])).not.toThrow();
        expect(() =>
          validatePatterns(['pg_%', 'sql_%', '_migrations']),
        ).not.toThrow();
      });
    });

    describe('invalid pattern arrays', () => {
      test('should reject arrays with invalid patterns', () => {
        expect(() => validatePatterns(['valid', "'; DROP"])).toThrow(
          /Invalid pattern at index 1/,
        );
        expect(() => validatePatterns(['pg_%', 'test;DROP'])).toThrow(
          /Invalid pattern at index 1/,
        );
      });

      test('should indicate which pattern failed', () => {
        expect(() => validatePatterns(['valid1', 'valid2', "'; DROP"])).toThrow(
          /index 2/,
        );
        expect(() => validatePatterns(["'; DROP", 'valid'])).toThrow(/index 0/);
      });

      test('should reject non-array inputs', () => {
        expect(() => validatePatterns('not_an_array' as unknown)).toThrow(
          /must be an array/,
        );
        expect(() => validatePatterns(null as unknown)).toThrow(
          /must be an array/,
        );
        expect(() => validatePatterns(123 as unknown)).toThrow(
          /must be an array/,
        );
      });
    });
  });

  describe('validateRoles', () => {
    describe('valid role arrays', () => {
      test('should accept single valid role', () => {
        expect(() => validateRoles(['anon'])).not.toThrow();
      });

      test('should accept multiple valid roles', () => {
        expect(() => validateRoles(['anon', 'authenticated'])).not.toThrow();
        expect(() =>
          validateRoles(['anon', 'authenticated', 'service_role']),
        ).not.toThrow();
      });
    });

    describe('invalid role arrays', () => {
      test('should reject empty role arrays', () => {
        expect(() => validateRoles([])).toThrow(/cannot be empty/);
      });

      test('should reject arrays with invalid roles', () => {
        expect(() => validateRoles(['anon', "'; DROP"])).toThrow(
          /Invalid role at index 1/,
        );
        expect(() =>
          validateRoles(['authenticated', 'test;DROP ROLE']),
        ).toThrow(/Invalid role at index 1/);
      });

      test('should indicate which role failed', () => {
        expect(() =>
          validateRoles(['anon', 'authenticated', "'; DROP"]),
        ).toThrow(/index 2/);
        expect(() => validateRoles(["'; DROP", 'anon'])).toThrow(/index 0/);
      });

      test('should reject non-array inputs', () => {
        expect(() => validateRoles('not_an_array' as unknown)).toThrow(
          /must be an array/,
        );
        expect(() => validateRoles(null as unknown)).toThrow(
          /must be an array/,
        );
        expect(() => validateRoles(123 as unknown)).toThrow(/must be an array/);
      });
    });
  });
});
