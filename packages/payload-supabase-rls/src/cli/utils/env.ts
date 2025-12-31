/**
 * Get database connection string from environment
 *
 * @returns Connection string or undefined
 */
export function getConnectionString(): string | undefined {
  return process.env.DATABASE_URI;
}

/**
 * Get connection string or exit with error
 *
 * @returns Connection string (guaranteed)
 */
export function getRequiredConnectionString(): string {
  const connectionString = getConnectionString();

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URI environment variable is required');
    console.error('   Set DATABASE_URI or use --connection flag');
    process.exit(1);
  }

  return connectionString;
}
