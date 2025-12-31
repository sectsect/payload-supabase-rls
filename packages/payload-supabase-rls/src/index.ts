/**
 * \@sect/payload-supabase-rls
 *
 * Automated Row-Level Security (RLS) management for Supabase PostgreSQL,
 * designed for PayloadCMS and other ORMs.
 *
 * @packageDocumentation
 */

// Core exports
export { enableRLS, verifyRLS, getRLSStatus } from './core/index.js';

// Type exports
export type {
  RLSConfig,
  RLSOperationResult,
  TableStatus,
  VerificationResult,
  TableRLSStatus,
  RLSStatusResult,
} from './core/index.js';
