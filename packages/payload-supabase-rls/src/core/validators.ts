/**
 * Input validation functions to prevent SQL injection
 *
 * These validators ensure that all user-provided inputs follow PostgreSQL
 * identifier and pattern rules before being used in SQL generation.
 */

/**
 * Validate PostgreSQL LIKE pattern
 *
 * Allows only safe characters for LIKE patterns:
 * - Alphanumeric characters (a-z, A-Z, 0-9)
 * - Underscore (_) - matches single character wildcard
 * - Percent (%) - matches zero or more characters wildcard
 *
 * @param pattern - The pattern to validate
 * @throws Error if pattern contains invalid characters or is malformed
 *
 * @example
 * ```typescript
 * validatePattern('pg_%'); // ✅ OK
 * validatePattern("'; DROP TABLE users; --"); // ❌ Throws
 * ```
 *
 * @public
 */
export function validatePattern(pattern: string): void {
  if (typeof pattern !== 'string') {
    throw new Error(`Pattern must be a string, got ${typeof pattern}`);
  }

  if (pattern.length === 0) {
    throw new Error('Pattern cannot be empty');
  }

  if (pattern.length > 63) {
    throw new Error(
      `Pattern too long (${pattern.length} chars). Maximum 63 characters`,
    );
  }

  // Only allow alphanumeric, underscore, and percent
  if (!/^[a-zA-Z0-9_%]+$/.test(pattern)) {
    throw new Error(
      `Invalid pattern "${pattern}": Only alphanumeric, underscore (_), and percent (%) are allowed`,
    );
  }
}

/**
 * Validate PostgreSQL identifier
 *
 * Ensures the identifier follows PostgreSQL naming rules:
 * - Must start with a letter (a-z, A-Z) or underscore (_)
 * - Can contain letters, digits, underscores, and dollar signs ($)
 * - Maximum 63 characters (PostgreSQL limit)
 * - Cannot be a SQL keyword
 *
 * @param identifier - The identifier to validate
 * @param type - The type of identifier (for error messages, e.g., 'schema', 'role')
 * @throws Error if identifier violates PostgreSQL rules or is a SQL keyword
 *
 * @example
 * ```typescript
 * validateIdentifier('public', 'schema'); // ✅ OK
 * validateIdentifier('_private', 'schema'); // ✅ OK
 * validateIdentifier('123invalid', 'schema'); // ❌ Throws
 * validateIdentifier('DROP', 'schema'); // ❌ Throws (SQL keyword)
 * ```
 *
 * @public
 */
export function validateIdentifier(identifier: string, type: string): void {
  if (typeof identifier !== 'string') {
    throw new Error(`${type} must be a string, got ${typeof identifier}`);
  }

  if (identifier.length === 0) {
    throw new Error(`${type} cannot be empty`);
  }

  if (identifier.length > 63) {
    throw new Error(
      `${type} too long (${identifier.length} chars). Maximum 63 characters`,
    );
  }

  // PostgreSQL identifier rules: start with letter or underscore,
  // then alphanumeric, underscore, or dollar
  if (!/^[a-zA-Z_][a-zA-Z0-9_$]*$/.test(identifier)) {
    throw new Error(
      `Invalid ${type} "${identifier}": Must start with letter or underscore, ` +
        `and contain only alphanumeric, underscore, or dollar sign characters`,
    );
  }

  // Prevent SQL keywords to avoid syntax errors and potential injection
  const sqlKeywords = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'TRUNCATE',
    'GRANT',
    'REVOKE',
    'EXECUTE',
    'UNION',
    'DECLARE',
  ];

  if (sqlKeywords.includes(identifier.toUpperCase())) {
    throw new Error(`Invalid ${type} "${identifier}": Cannot use SQL keyword`);
  }
}

/**
 * Validate array of patterns
 *
 * Validates each pattern in the array using validatePattern().
 * Provides detailed error messages indicating which pattern failed.
 *
 * @param patterns - Array of patterns to validate
 * @throws Error if any pattern is invalid or if input is not an array
 *
 * @example
 * ```typescript
 * validatePatterns(['pg_%', 'sql_%']); // ✅ OK
 * validatePatterns(['valid', "'; DROP"]); // ❌ Throws with index
 * ```
 *
 * @public
 */
export function validatePatterns(patterns: string[]): void {
  if (!Array.isArray(patterns)) {
    throw new Error(`Patterns must be an array, got ${typeof patterns}`);
  }

  patterns.forEach((pattern, index) => {
    try {
      validatePattern(pattern);
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
        /* c8 ignore start - validatePattern always throws Error instances */
      } else {
        message = String(error);
        /* c8 ignore stop */
      }
      throw new Error(`Invalid pattern at index ${index}: ${message}`);
    }
  });
}

/**
 * Validate array of roles
 *
 * Validates each role name in the array using validateIdentifier().
 * Ensures the array is not empty and provides detailed error messages.
 *
 * @param roles - Array of role names to validate
 * @throws Error if any role is invalid, if array is empty, or if input is not an array
 *
 * @example
 * ```typescript
 * validateRoles(['anon', 'authenticated']); // ✅ OK
 * validateRoles([]); // ❌ Throws (empty)
 * validateRoles(['anon', "'; DROP"]); // ❌ Throws with index
 * ```
 *
 * @public
 */
export function validateRoles(roles: string[]): void {
  if (!Array.isArray(roles)) {
    throw new Error(`Roles must be an array, got ${typeof roles}`);
  }

  if (roles.length === 0) {
    throw new Error('Roles array cannot be empty');
  }

  roles.forEach((role, index) => {
    try {
      validateIdentifier(role, 'role');
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
        /* c8 ignore start - validateIdentifier always throws Error instances */
      } else {
        message = String(error);
        /* c8 ignore stop */
      }
      throw new Error(`Invalid role at index ${index}: ${message}`);
    }
  });
}
