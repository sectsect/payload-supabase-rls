# @sect/payload-supabase-rls

Automated Row-Level Security (RLS) management for Supabase PostgreSQL, designed for PayloadCMS and other ORMs.

## ⚠️ Experimental Status

> [!IMPORTANT]
> This package is currently in experimental stage (v0.x). The current implementation applies a "Deny All" security policy suitable for specific use cases. Please review the limitations section carefully before use.

## Features

- 🔒 **Automatic RLS enablement** - Restore RLS after ORM schema pushes
- 🔍 **Verification tools** - Detailed RLS status reporting
- 🎯 **Framework-agnostic** - Works with any PostgreSQL/Supabase project
- 🔌 **PayloadCMS integration** - Drop-in plugin for automatic management
- 📦 **CLI & Programmatic API** - Use as command-line tool or import in code
- 🛡️ **Security-first** - Deny-all policies for anon/authenticated roles

## Installation

```bash
npm install @sect/payload-supabase-rls
```

## Why This Package?

### Two Approaches to Schema Management

PayloadCMS's `postgresAdapter` offers a `push` option that controls automatic schema synchronization:

**Option 1: Disable Auto-Sync (`push: false`)**

- Requires manual migration management
- Full control over schema changes
- No RLS conflicts during development

```typescript
db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URI },
  push: false,  // Disable automatic schema sync
}),
```

Learn more: [PayloadCMS Postgres Documentation](https://payloadcms.com/docs/database/postgres)

**Option 2: Enable Auto-Sync with RLS Protection (`push: true`)**

- Automatic schema synchronization during development
- Faster iteration cycle
- Requires this plugin to maintain RLS security

### The Problem with Auto-Sync

When `push: true` (the default) **in development mode**, PayloadCMS uses Drizzle ORM's `pushDevSchema()` which **explicitly disables RLS** on all tables:

```sql
-- What Drizzle's pushDevSchema() does
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
```

This leaves your database vulnerable to direct PostgREST API access.

### The Solution

This package automatically re-enables RLS after schema sync:

```sql
-- What this package does
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_select" ON your_table FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "deny_all_insert" ON your_table FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_all_update" ON your_table FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "deny_all_delete" ON your_table FOR DELETE TO anon, authenticated USING (false);
```

**What this means**:

- **All tables**: RLS is enabled on every table in your database
- **All operations**: SELECT, INSERT, UPDATE, DELETE are all protected
- **Target roles**: `anon` and `authenticated` roles are completely blocked
- **Bypass roles**: `postgres` and `service_role` bypass RLS (PayloadCMS uses these)

## Get Started

### For PayloadCMS Users (Recommended)

Add the plugin to your PayloadCMS configuration:

```typescript
// src/payload.config.ts
import { buildConfig } from 'payload';
import { payloadSupabaseRLS } from '@sect/payload-supabase-rls/integrations/payload';

export default buildConfig({
  // ... other config
  plugins: [
    payloadSupabaseRLS({
      autoEnable: true,
      environments: ['development'],
    }),
  ],
});
```

**What happens when you run `pnpm dev` and access a page that triggers a database query:**

1. Next.js starts the development server
2. You navigate to a page that triggers a database query (e.g., `/admin`, `/posts`, etc.)
3. PayloadCMS initializes and runs `pushDevSchema()` (disabling RLS)
4. The plugin automatically re-enables RLS

**Expected console output:**

```
🔄 PayloadSupabaseRLS: Re-enabling RLS...
✅ PayloadSupabaseRLS: RLS enabled on X tables with Y policies
```

This happens once per server startup when you first access a page that triggers a database query. Your database is now secure! 🎉

## Current Limitations

### What This Implementation Provides

✅ **Enabled Features**:

- **PayloadCMS Admin**: Full access via service role (bypasses RLS)
- **PayloadCMS REST API**: Works normally (uses service role)
- **PayloadCMS GraphQL API**: Works normally (uses service role)
- **Database Security**: All tables protected from direct PostgREST access
- **Automatic Management**: RLS automatically restored after schema changes

### What This Implementation Restricts

❌ **Restricted Supabase Features**:

**1. Supabase Auth Integration**

- `auth.uid()` returns NULL for all policies
- Frontend authentication via Supabase Auth is not functional
- JWT-based row-level access control unavailable

```typescript
// ❌ This won't work with current RLS policies
const { data } = await supabase.auth.signIn({ email, password });
// User can authenticate, but database access is denied
```

**2. PostgREST API (Supabase Client)**

- All direct database queries from frontend are blocked
- `supabase.from('table')` operations will fail with permission errors

```typescript
// ❌ All these queries are denied by RLS
await supabase.from('posts').select('*');        // Blocked
await supabase.from('media').insert({...});      // Blocked
await supabase.from('users').update({...});      // Blocked
```

**3. Realtime Subscriptions**

- Real-time database change notifications unavailable
- WebSocket subscriptions blocked by RLS policies

```typescript
// ❌ Realtime subscriptions don't work
supabase
  .channel('posts')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'posts',
    },
    payload => {
      // This callback will never fire
    },
  )
  .subscribe();
```

**4. Public Content Access**

- Cannot implement public read-only content (e.g., published blog posts)
- All content requires service role access
- Frontend must proxy all queries through PayloadCMS API

### Use Case Suitability

**✅ Ideal For**:

- Using PayloadCMS exclusively as your CMS
- All database access goes through PayloadCMS APIs
- No need for direct Supabase client access from frontend
- Prioritizing maximum database security

**⚠️ Not Suitable For**:

- Building frontend apps with Supabase Auth + direct database access
- Real-time collaborative features
- Public content with mixed authentication (some public, some private)
- Leveraging Supabase's PostgREST API features

### Future Improvements

We are exploring more flexible RLS strategies that would enable:

- Gradual RLS with table-specific policies
- Supabase Auth integration
- Public content with authenticated user access
- Real-time subscriptions for allowed content

See [GitHub Issues](https://github.com/sectsect/payload-supabase-rls/issues) for roadmap and discussions.

## Advanced Usage

### CLI Tool

Use the command-line interface for manual RLS management or in CI/CD pipelines:

```bash
# Enable RLS on all tables
npx payload-supabase-rls enable

# Verify RLS status (detailed report)
npx payload-supabase-rls verify

# Quick status check
npx payload-supabase-rls status
```

<details>
<summary>Example output for <code>status</code> command</summary>

```bash
$ npx payload-supabase-rls status

┌─────────────────────────────────┬──────────┐
│ Table                           │ RLS      │
├─────────────────────────────────┼──────────┤
│ posts                           │ ✓ Enabled│
│ posts_rels                      │ ✓ Enabled│
│ media                           │ ✓ Enabled│
│ users                           │ ✓ Enabled│
│ payload_preferences             │ ✓ Enabled│
│ payload_migrations              │ ✓ Enabled│
└─────────────────────────────────┴──────────┘

Summary: 26/26 tables have RLS enabled ✓
```

</details>

<details>
<summary>Example output for <code>verify</code> command</summary>

```bash
$ npx payload-supabase-rls verify

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RLS Verification Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
   Total tables:       26
   ✅ RLS enabled:      26
   ❌ RLS disabled:     0

📋 Detailed Table Status:
   ┌─────────────────────────────────────┬─────────┬──────────┐
   │ Table Name                          │ RLS     │ Policies │
   ├─────────────────────────────────────┼─────────┼──────────┤
   │ posts                               │ ✅ Yes  │ ✅ 4     │
   │ posts_page                          │ ✅ Yes  │ ✅ 4     │
   │ media                               │ ✅ Yes  │ ✅ 4     │
   │ users                               │ ✅ Yes  │ ✅ 4     │
   │ payload_preferences                 │ ✅ Yes  │ ✅ 4     │
   │ payload_migrations                  │ ✅ Yes  │ ✅ 4     │
   ... (26 tables total)
   └─────────────────────────────────────┴─────────┴──────────┘

✅ All tables have RLS enabled!
✅ All tables with policies have the correct deny-all configuration (4 policies each).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</details>

**Optional**: Add npm scripts to your project for convenience:

```json
{
  "scripts": {
    "rls:enable": "payload-supabase-rls enable --verbose",
    "rls:verify": "payload-supabase-rls verify",
    "rls:status": "payload-supabase-rls status"
  }
}
```

### Programmatic API

Use the programmatic API for custom integrations or other frameworks:

```typescript
import { enableRLS, verifyRLS } from '@sect/payload-supabase-rls';

// Enable RLS
const result = await enableRLS({
  connectionString: process.env.DATABASE_URI,
  verbose: true,
});

if (result.success) {
  console.log(`Processed ${result.tablesProcessed} tables`);
}

// Verify RLS
const verification = await verifyRLS({
  connectionString: process.env.DATABASE_URI,
});
```

## Configuration

### PayloadCMS Plugin Options

```typescript
interface PayloadSupabaseRLSOptions {
  autoEnable?: boolean; // default: true
  rlsConfig?: Partial<Omit<RLSConfig, 'connectionString'>>;
  environments?: string[]; // default: ['development']
  logging?: boolean; // default: true
}
```

### CLI Options

```bash
payload-supabase-rls enable --help

Options:
  -c, --connection <string>      Database connection string
  -v, --verbose                  Verbose output
  -s, --schema <string>          Schema name (default: "public")
  -r, --roles <roles>            Target roles (default: "anon,authenticated")
  -p, --policy-prefix <string>   Policy name prefix (default: "deny_all")
  -f, --policy-function <string> Policy function name (default: "deny_all")
```

### Programmatic API Config

```typescript
interface RLSConfig {
  connectionString: string;
  schema?: string; // default: 'public'
  targetRoles?: string[]; // default: ['anon', 'authenticated']
  policyPrefix?: string; // default: 'deny_all'
  verbose?: boolean; // default: false
  excludePatterns?: string[]; // default: ['pg_%', 'sql_%']
  policyFunction?: string; // default: 'deny_all'
}
```

## API Reference

### `enableRLS(config: RLSConfig): Promise<RLSOperationResult>`

Enable RLS on all tables in the database.

**Returns**:

```typescript
interface RLSOperationResult {
  success: boolean;
  tablesProcessed: number;
  policiesCreated: number;
  errors?: string[];
}
```

### `verifyRLS(config): Promise<VerificationResult>`

Verify RLS configuration on all tables.

**Returns**:

```typescript
interface VerificationResult {
  totalTables: number;
  protectedTables: number;
  unprotectedTables: number;
  tables: TableStatus[];
}
```

### `getRLSStatus(config): Promise<RLSStatusResult>`

Get quick RLS status for all tables.

**Returns**:

```typescript
interface RLSStatusResult {
  tables: TableRLSStatus[];
  totalTables: number;
  enabledTables: number;
  disabledTables: number;
}
```

## Workflows and Supabase CLI Integration

For detailed information on environment-specific workflows and Supabase CLI integration, see [WORKFLOWS.md](./docs/WORKFLOWS.md).

Topics covered:

- Development vs Staging/Production workflows
- Supabase CLI integration strategies
- Migration creation from plugin state
- Environment configuration

## Troubleshooting

If you encounter any issues, see [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for common problems and solutions.

Topics covered:

- Plugin not re-enabling RLS
- RLS disabled after `supabase db reset`
- Policy name conflicts
- Connection issues
- Verification failures
- And more

<p align="center">✌️</p>
<p align="center">
<sub><sup>A little project by <a href="https://github.com/sectsect">@sectsect</a></sup></sub>
</p>
