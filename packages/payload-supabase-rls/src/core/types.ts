/**
 * Configuration for RLS operations
 */
export interface RLSConfig {
  /**
   * PostgreSQL connection string
   */
  connectionString: string;

  /**
   * Schema name to target (default: "public")
   */
  schema?: string;

  /**
   * Roles to deny access (default: ["anon", "authenticated"])
   */
  targetRoles?: string[];

  /**
   * Policy name prefix (default: "deny_all")
   */
  policyPrefix?: string;

  /**
   * Enable verbose logging
   */
  verbose?: boolean;

  /**
   * Table name patterns to exclude (glob patterns)
   * @example ["pg_%", "sql_%", "_migrations"]
   */
  excludePatterns?: string[];

  /**
   * Custom policy function name (default: "deny_all")
   */
  policyFunction?: string;
}

/**
 * Table RLS status
 */
export interface TableStatus {
  tablename: string;
  rls_enabled: boolean;
  policy_count: number;
}

/**
 * RLS verification result
 */
export interface VerificationResult {
  totalTables: number;
  protectedTables: number;
  unprotectedTables: number;
  tables: TableStatus[];
}

/**
 * RLS operation result
 */
export interface RLSOperationResult {
  success: boolean;
  tablesProcessed: number;
  policiesCreated: number;
  errors?: string[];
}

/**
 * SQL builder configuration
 */
export interface SQLBuilderConfig {
  schema: string;
  targetRoles: string[];
  policyPrefix: string;
  excludePatterns: string[];
  policyFunction: string;
}
