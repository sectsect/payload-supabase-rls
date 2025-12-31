# Troubleshooting

### Plugin Not Re-enabling RLS

**Symptoms**:

- No console output: `🔄 PayloadSupabaseRLS: Re-enabling RLS...`
- RLS remains disabled after starting dev server

**Possible Causes & Solutions**:

1. **Environment mismatch**:

   ```typescript
   // Check your plugin config
   payloadSupabaseRLS({
     environments: ['development'], // Must match NODE_ENV
   });
   ```

   Solution: Ensure `NODE_ENV=development` or adjust `environments` array.

2. **Missing DATABASE_URI**:

   ```
   ⚠️  PayloadSupabaseRLS: DATABASE_URI not found, skipping RLS enablement
   ```

   Solution: Add `DATABASE_URI` to your `.env` file.

3. **No database query triggered**:
   - Plugin runs in `onInit` hook only when PayloadCMS initializes
   - Initialization happens when first database query is executed

   Solution: Access `/admin` or any page that queries the database.

### RLS Disabled After `supabase db reset`

**Symptoms**:

- RLS policies missing after running `supabase db reset`
- Tables exist but have no RLS policies

**Cause**: Migrations don't include RLS policy definitions.

**Solution**:

```bash
# Option 1: Use plugin (development only)
pnpm dev  # Access a page to trigger plugin

# Option 2: Add RLS to migrations (recommended for staging/production)
supabase db diff -f add_missing_rls_policies
# Edit the generated migration file to include RLS policies
supabase db reset
```

### Policy Name Conflicts

**Symptoms**:

```
ERROR: policy "deny_all_select" for table "posts" already exists
```

**Cause**: Existing policies with same names.

**Solutions**:

1. **Override existing policies** (default behavior):
   - The plugin automatically drops and recreates policies
   - No action needed

2. **Use custom policy prefix**:

   ```typescript
   payloadSupabaseRLS({
     rlsConfig: {
       policyPrefix: 'payload_deny', // Custom prefix
     },
   });
   ```

3. **Check for manual policies**:

   ```sql
   -- View all policies on a table
   SELECT * FROM pg_policies WHERE tablename = 'posts';

   -- Drop conflicting policies
   DROP POLICY IF EXISTS "deny_all_select" ON posts;
   ```

### Connection Issues

**Symptoms**:

```
❌ PayloadSupabaseRLS: Failed to enable RLS: connection refused
```

**Possible Causes & Solutions**:

1. **Wrong connection string**:

   ```bash
   # Check your .env file
   # Correct format for Supabase:
   # secretlint-disable-next-line
   DATABASE_URI="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

   # Correct format for local Supabase CLI:
   # secretlint-disable-next-line
   DATABASE_URI="postgresql://postgres:postgres@localhost:54322/postgres"
   ```

2. **Insufficient privileges**:

   ```
   ERROR: must be owner of table posts
   ```

   Solution: Use `postgres` or `service_role` connection (has BYPASSRLS privilege).

3. **Local Supabase not running**:

   ```bash
   # Start local Supabase
   supabase start

   # Check status
   supabase status
   ```

### Verification Failures

**Symptoms**:

```bash
$ pnpm rls:verify
❌ X tables without RLS protection
```

**Solutions**:

1. **Re-enable RLS manually**:

   ```bash
   pnpm rls:enable --verbose
   ```

2. **Check excluded patterns**:

   ```typescript
   payloadSupabaseRLS({
     rlsConfig: {
       excludePatterns: ['pg_%', 'sql_%'], // System tables excluded by default
     },
   });
   ```

3. **Verify specific tables**:

   ```sql
   -- Check if RLS is enabled
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';

   -- Check policies
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

### PayloadCMS Admin Panel Access Issues

**Symptoms**:

- Can't log in to `/admin`
- Permission errors when accessing admin panel

**This should NOT happen** because:

- PayloadCMS uses `postgres` or `service_role` connection
- These roles have BYPASSRLS privilege
- RLS policies don't affect these roles

**If it does happen**:

1. **Check your database connection role**:

   ```typescript
   // Ensure you're using service role, not anon key
   db: postgresAdapter({
     pool: {
       connectionString: process.env.DATABASE_URI, // Must use service role
     },
   });
   ```

2. **Verify role privileges**:
   ```sql
   -- Check if role can bypass RLS
   SELECT rolname, rolbypassrls
   FROM pg_roles
   WHERE rolname IN ('postgres', 'service_role');
   ```

### Supabase CLI and Plugin Conflicts

**Symptoms**:

- RLS state inconsistent between plugin and migrations
- Unexpected policy duplicates

**Solution**: Choose one approach per environment:

**Development**:

```typescript
// Use plugin (don't create RLS migrations)
payloadSupabaseRLS({
  autoEnable: true,
  environments: ['development'],
});
```

**Staging/Production**:

```typescript
// Use migrations (disable plugin)
payloadSupabaseRLS({
  environments: ['development'], // Only development
});
```

### Getting Help

If you encounter issues not covered here:

1. **Enable verbose logging**:

   ```typescript
   payloadSupabaseRLS({
     rlsConfig: { verbose: true },
     logging: true,
   });
   ```

2. **Check RLS status**:

   ```bash
   pnpm rls:verify  # Detailed report
   ```

3. **Review generated SQL**:

   ```bash
   payload-supabase-rls enable --verbose
   ```

4. **Open an issue**: [GitHub Issues](https://github.com/sectsect/payload-supabase-rls/issues)
   - Include error messages
   - Provide `rls:verify` output
   - Share relevant configuration (remove sensitive data)
