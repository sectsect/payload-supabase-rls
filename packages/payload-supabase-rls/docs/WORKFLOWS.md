# Workflows and Supabase CLI Integration

## Environment-Specific Workflows

### Development Environment

**Recommended Approach**: Use PayloadCMS auto-sync with this plugin

```typescript
// src/payload.config.ts
export default buildConfig({
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    push: true, // Enable auto-sync (default)
  }),
  plugins: [
    payloadSupabaseRLS({
      autoEnable: true,
      environments: ['development'],
    }),
  ],
});
```

**Workflow**:

1. Start dev server: `pnpm dev`
2. Add/modify collections
3. Access any page that triggers a database query
4. PayloadCMS auto-syncs schema via Drizzle
5. Plugin automatically re-enables RLS
6. Verify: `pnpm rls:status`

**Benefits**:

- ✅ Fast iteration cycle
- ✅ No manual migration management
- ✅ Automatic RLS protection
- ✅ Instant schema updates

### Staging/Production Environments

**Recommended Approach**: Use Supabase CLI migrations (disable plugin)

```typescript
// src/payload.config.ts
export default buildConfig({
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    push: false, // Disable auto-sync in production
  }),
  plugins: [
    payloadSupabaseRLS({
      autoEnable: true,
      environments: ['development'], // Only run in development
    }),
  ],
});
```

**Workflow**:

1. Develop locally with auto-sync + plugin
2. Create migration from local schema changes:
   ```bash
   supabase db diff -f add_rls_policies
   ```
3. Edit migration file to include RLS policies:

   ```sql
   -- supabase/migrations/20240101000000_add_rls_policies.sql

   -- Enable RLS on new tables
   ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

   -- Create deny-all policies
   CREATE POLICY "deny_all_select" ON posts
     FOR SELECT TO anon, authenticated USING (false);

   CREATE POLICY "deny_all_insert" ON posts
     FOR INSERT TO anon, authenticated WITH CHECK (false);

   CREATE POLICY "deny_all_update" ON posts
     FOR UPDATE TO anon, authenticated USING (false);

   CREATE POLICY "deny_all_delete" ON posts
     FOR DELETE TO anon, authenticated USING (false);
   ```

4. Deploy to staging/production:
   ```bash
   supabase db push
   ```

**Benefits**:

- ✅ Version-controlled schema changes
- ✅ Rollback capability
- ✅ Audit trail via Git history
- ✅ Safe production deployments

### Summary

| Environment     | Schema Management                       | Plugin Enabled | RLS Management        |
| --------------- | --------------------------------------- | -------------- | --------------------- |
| **Development** | PayloadCMS auto-sync (`push: true`)     | ✅ Yes         | Automatic via plugin  |
| **Staging**     | Supabase CLI migrations (`push: false`) | ❌ No          | Manual via migrations |
| **Production**  | Supabase CLI migrations (`push: false`) | ❌ No          | Manual via migrations |

## Supabase CLI Integration

### Local Development with Supabase CLI

If you're using Supabase CLI for local development (`supabase start`), you can use this plugin alongside Supabase's migration system.

#### Understanding the Relationship

**Two Schema Management Systems**:

1. **Supabase CLI Migrations** - File-based, version-controlled schema changes
2. **PayloadCMS Auto-Sync** - Runtime schema synchronization via Drizzle ORM

These systems operate independently:

- **Supabase CLI**: Manages schema through `supabase/migrations/` files
- **PayloadCMS**: Syncs schema directly during development (`push: true`)

#### Recommended Local Development Setup

**Option 1: PayloadCMS Auto-Sync with Plugin (Recommended for rapid development)**

```typescript
// src/payload.config.ts
export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI, // Points to local Supabase
    },
    push: true, // Let PayloadCMS manage schema
  }),
  plugins: [
    payloadSupabaseRLS({
      autoEnable: true,
      environments: ['development'],
    }),
  ],
});
```

```bash
# Start local Supabase
supabase start

# Start PayloadCMS (schema auto-syncs)
pnpm dev

# Verify RLS status
pnpm rls:status
```

**When to use**: Fast iteration, frequent collection changes, local-only development.

**Option 2: Migration-Based Workflow (Recommended for team environments)**

```typescript
// src/payload.config.ts
export default buildConfig({
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    push: false, // Disable auto-sync
  }),
});
```

```bash
# Start local Supabase
supabase start

# Create migration for schema changes
supabase db diff -f create_posts_table

# Edit migration to include RLS
# supabase/migrations/XXXXXX_create_posts_table.sql

# Apply migration locally
supabase db reset

# Start PayloadCMS
pnpm dev
```

**When to use**: Team collaboration, production parity, CI/CD pipelines.

#### Creating RLS Migrations from Plugin State

If you've been using the plugin for development and want to create migrations for production:

```bash
# 1. Ensure your local database has RLS enabled via plugin
pnpm dev  # Access a page to trigger RLS enablement

# 2. Pull current schema including RLS policies
supabase db pull --schema public

# This creates a migration file with:
# - Table definitions
# - RLS enable statements
# - Policy definitions

# 3. Review and commit the migration file
git add supabase/migrations/
git commit -m "feat: add RLS policies from development"

# 4. Deploy to production
supabase db push --linked
```

#### Environment Configuration

**Local development** (`.env.local`):

```bash
# secretlint-disable-next-line
DATABASE_URI="postgresql://postgres:postgres@localhost:54322/postgres"
```

**Production** (`.env.production`):

```bash
# secretlint-disable-next-line
DATABASE_URI="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

#### Working with Supabase Studio

Supabase Studio (local: `http://localhost:54323`) shows your database state:

**After plugin execution**:

- Navigate to "Database" → "Policies"
- Verify all tables have RLS enabled
- Check deny-all policies are present

**After `supabase db reset`**:

- Migrations are applied in order
- RLS policies should be included in migration files
- No plugin execution needed if migrations include RLS
