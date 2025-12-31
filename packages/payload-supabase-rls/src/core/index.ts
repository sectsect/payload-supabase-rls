/**
 * Core RLS management functions
 * @packageDocumentation
 */

export { enableRLS } from './enable-rls.js';
export { verifyRLS, printReport } from './verify-rls.js';
export { getRLSStatus, printStatus } from './status-rls.js';
export { buildEnableRLSSQL } from './sql-builder.js';
export {
  validateIdentifier,
  validatePattern,
  validatePatterns,
  validateRoles,
} from './validators.js';
export type {
  RLSConfig,
  RLSOperationResult,
  TableStatus,
  VerificationResult,
  SQLBuilderConfig,
} from './types.js';
export type { TableRLSStatus, RLSStatusResult } from './status-rls.js';
