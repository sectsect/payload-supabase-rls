/* eslint-disable no-console */
import type { Config } from 'payload';

import { enableRLS } from '../../core/enable-rls.js';
import type { RLSConfig } from '../../core/types.js';

export interface PayloadSupabaseRLSOptions {
  /**
   * Enable automatic RLS re-enablement on server initialization
   * (useful in development when Drizzle's pushDevSchema disables RLS)
   * @defaultValue true
   */
  autoEnable?: boolean;

  /**
   * RLS configuration
   */
  rlsConfig?: Partial<Omit<RLSConfig, 'connectionString'>>;

  /**
   * Only run in specific environments
   * @defaultValue ['development']
   */
  environments?: string[];

  /**
   * Log enable/disable messages
   * @defaultValue true
   */
  logging?: boolean;
}

/**
 * PayloadCMS plugin for Supabase RLS management
 *
 * This plugin automatically re-enables RLS after PayloadCMS's Drizzle pushDevSchema()
 * disables it in development mode.
 *
 * @param options - Plugin configuration options
 * @returns PayloadCMS config modifier function
 *
 * @example
 * ```typescript
 * import { payloadSupabaseRLS } from '@sect/payload-supabase-rls/integrations/payload';
 *
 * export default buildConfig({
 *   // ... other config
 *   plugins: [
 *     payloadSupabaseRLS({
 *       autoEnable: true,
 *       environments: ['development'],
 *     }),
 *   ],
 * });
 * ```
 *
 * @public
 */
export const payloadSupabaseRLS =
  (options: PayloadSupabaseRLSOptions = {}) =>
  (config: Config): Config => {
    const {
      autoEnable = true,
      rlsConfig = {},
      environments = ['development'],
      logging = true,
    } = options;

    // Check if we should run in this environment
    const shouldRun =
      environments.length === 0 ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      environments.includes(process.env.NODE_ENV || 'development');

    if (!shouldRun) {
      return config;
    }

    return {
      ...config,
      onInit: async payload => {
        // Call original onInit if exists
        if (config.onInit) {
          await config.onInit(payload);
        }

        // Auto-enable RLS if configured
        if (autoEnable) {
          const connectionString = process.env.DATABASE_URI;

          if (!connectionString) {
            if (logging) {
              console.warn(
                '⚠️  PayloadSupabaseRLS: DATABASE_URI not found, skipping RLS enablement',
              );
            }
            return;
          }

          if (logging) {
            console.log('🔄 PayloadSupabaseRLS: Re-enabling RLS...');
          }

          const result = await enableRLS({
            connectionString,
            verbose: rlsConfig.verbose ?? false,
            ...rlsConfig,
          });

          if (result.success) {
            if (logging) {
              console.log(
                `✅ PayloadSupabaseRLS: RLS enabled on ${result.tablesProcessed} tables with ${result.policiesCreated} policies`,
              );
            }
          } else {
            console.error(
              '❌ PayloadSupabaseRLS: Failed to enable RLS:',
              result.errors?.join(', '),
            );
          }
        }
      },
    };
  };
