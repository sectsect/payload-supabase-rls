# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Turborepo monorepo containing a framework-agnostic library for automated Row-Level Security (RLS) management for Supabase PostgreSQL databases, designed for PayloadCMS and other ORMs.

**Packages**:

- `packages/payload-supabase-rls`: Core library (CLI + API)
- `apps/supabase-payload`: Demo app (PayloadCMS + Next.js 15 + Supabase)

**Key Technologies**:

- TypeScript 5.9.3
- Node.js >=18.20.2
- pnpm >=10.0.0
- Turborepo
- Vitest (testing)

## Development Commands

### Root Level (Monorepo)

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage reports
pnpm coverage

# Type checking
pnpm type-check

# Type checking in watch mode
pnpm type-check:watch

# Linting
pnpm lint

# Linting with auto-fix
pnpm lint:fix

# Format code
pnpm format

# Clean all build artifacts and node_modules
pnpm clean

# Security scanning
pnpm secretlint
```

### Package-Specific

```bash
# Work on main package
cd packages/payload-supabase-rls
pnpm dev                    # Watch mode (TypeScript compilation)
pnpm build                  # Build ESM + CJS + types
pnpm test                   # Run Vitest tests
pnpm test:watch             # Vitest watch mode
pnpm coverage               # Generate coverage report

# Work on demo app
cd apps/supabase-payload
pnpm dev                    # Next.js dev server
pnpm build                  # Production build
pnpm start                  # Production server
```

### Release

```bash
# Version packages using changesets
pnpm changeset

# Update package versions
pnpm version-packages

# Build and publish to npm
pnpm release
```

## Architecture

### Library Structure (`packages/payload-supabase-rls`)

```
src/
├── core/                      # Core RLS management logic
│   ├── enable-rls.ts         # Enable RLS + create policies
│   ├── verify-rls.ts         # Verify RLS configuration
│   ├── status-rls.ts         # Quick RLS status check
│   ├── sql-builder.ts        # SQL generation + validation
│   ├── validators.ts         # Input validation (SQL injection prevention)
│   └── types.ts              # Core type definitions
├── cli/                      # CLI implementation
│   ├── commands/
│   │   ├── enable.ts
│   │   ├── verify.ts
│   │   └── status.ts
│   └── utils/
├── integrations/
│   └── payload/              # PayloadCMS plugin
│       └── plugin.ts         # Auto-enable RLS on schema sync
└── index.ts                  # Main exports
```

**Export Strategy**:

- Main exports: Core API + PayloadCMS plugin
- Subpath exports:
  - `@sect/payload-supabase-rls/core`: Core API only
  - `@sect/payload-supabase-rls/integrations/payload`: PayloadCMS plugin

**Build Output**:

- ESM: `dist/esm/`
- CJS: `dist/cjs/`
- Types: `dist/types/`

### Core Security Model

**RLS Policy Strategy**:

- Enables RLS on all tables in specified schema (default: `public`)
- Creates 4 deny-all policies per table (SELECT/INSERT/UPDATE/DELETE)
- Target roles: `anon` and `authenticated` (Supabase default roles)
- Bypass roles: `postgres` and `service_role` (BYPASSRLS privilege)

**SQL Generation**:

- All inputs validated via `validators.ts` to prevent SQL injection
- Identifiers: `validateIdentifier()` - alphanumeric, `_`, `$` only
- Patterns: `validatePattern()` - alphanumeric, `_`, `%` only
- Roles: `validateRoles()` - comma-separated valid identifiers

**Policy Naming**:

- Format: `{prefix}_{operation}` (e.g., `deny_all_select`)
- Custom prefixes supported via config
- Default prefix: `deny_all`

### Database Connection

Uses `pg` (node-postgres) with connection pooling:

- Requires service role or BYPASSRLS-privileged connection
- Environment variable: `DATABASE_URI`
- Automatic connection cleanup

## Important Patterns

### 1. Monorepo Workspace Management

Uses pnpm workspaces:

```json
// Root package.json
"packageManager": "pnpm@10.26.2"
```

**Local package linking**:

```json
// apps/supabase-payload/package.json
"dependencies": {
  "@sect/payload-supabase-rls": "workspace:*"
}
```

### 2. Dual Module Build (ESM + CJS)

Build process runs TypeScript compiler twice:

```bash
# ESM build
tsc --project tsconfig.build.json

# CJS build
tsc --project tsconfig.build.json --module commonjs --outDir dist/cjs
```

**Import extensions**: All imports use `.js` extensions (ESM requirement):

```typescript
// Correct
import { enableRLS } from './enable-rls.js';

// Wrong
import { enableRLS } from './enable-rls';
```

### 3. Testing with Vitest

**Test location**: Co-located with source files (`.test.ts` suffix)
**Global setup**: `globals: true` in vitest.config.ts
**Coverage**: v8 provider, excludes tests and config files

**Running specific tests**:

```bash
# Single file
pnpm test src/core/validators.test.ts

# Pattern matching
pnpm test -t "validation"
```

### 4. Input Validation

All user inputs validated before SQL generation:

```typescript
// Before using in SQL
validateIdentifier(schema);
validateIdentifier(tableName);
validateRoles(targetRoles);
validatePatterns(excludePatterns);
```

**Validation throws descriptive errors**:

```typescript
try {
  validateIdentifier("public'; DROP SCHEMA public; --");
} catch (error) {
  // Error: SQL Builder validation failed: Invalid schema...
}
```

### 5. CLI Implementation

Uses `commander` library:

- Commands: `enable`, `verify`, `status`
- Connection string from `--connection` flag or `DATABASE_URI` env var
- Optional verbose output via `--verbose`

**Adding new commands**:

1. Create in `src/cli/commands/`
2. Import in `bin/payload-supabase-rls.js`
3. Register with commander program

### 6. PayloadCMS Integration

Plugin hooks into PayloadCMS lifecycle:

```typescript
// payload.config.ts
import { payloadSupabaseRLS } from '@sect/payload-supabase-rls/integrations/payload';

export default buildConfig({
  plugins: [
    payloadSupabaseRLS({
      autoEnable: true,
      environments: ['development'],
    }),
  ],
});
```

**Hook behavior**:

- Runs in `onInit` hook (after PayloadCMS initialization)
- Only runs in specified environments (default: development)
- Automatically re-enables RLS after Drizzle's `pushDevSchema()`

## Turborepo Task Orchestration

Task dependencies defined in `turbo.json`:

- `build` depends on `^build` (dependencies built first)
- `dev` depends on `^build` (persistent task)
- `test` depends on `^build`
- `type-check`, `lint`, `lint:fix` run independently

**Caching**:

- Build outputs: `dist/**`
- Test outputs: `coverage/**`
- Dev/watch tasks: `cache: false`

## Commit Conventions

**Pre-commit hooks** (via husky + lint-staged):

1. secretlint: Scan for leaked secrets
2. ESLint: Auto-fix and lint
3. Type-check: TypeScript compilation check
4. Format: Prettier formatting

**Commit messages**: Conventional Commits format enforced

```bash
# Valid
feat: add RLS verification command
fix: handle null policy counts
docs: update README examples

# Invalid
Added new feature
```

**Changesets workflow**:

1. Make changes
2. Run `pnpm changeset` to document changes
3. Commit changeset files
4. On release: `pnpm version-packages` + `pnpm release`

## Testing Strategy

**Unit tests**: Core logic and validators
**Integration tests**: Database operations (require test DB)
**Coverage targets**: Focus on core RLS logic

**Test environment**:

- Set `DATABASE_URI` for integration tests
- Use `.env.test` file if needed
- Tests use actual PostgreSQL connections

## Code Quality

**ESLint configuration**:

- Airbnb TypeScript style guide
- Import order enforcement (react → builtin → external → internal)
- Unused imports auto-removed
- Deprecation warnings enabled

**TypeScript strict mode**:

- `strict: true`
- `forceConsistentCasingInFileNames: true`
- No implicit any
- Isolated modules

**Project references**:

- Root tsconfig.json references both packages
- Each package has own build config
- Enables incremental builds

## Environment Variables

**Required for library**:

- `DATABASE_URI`: PostgreSQL connection string (service role)

**Optional**:

- `NODE_ENV`: Controls plugin auto-enable behavior

**Demo app** (`apps/supabase-payload`):

- See `apps/supabase-payload/CLAUDE.md` for full list

## Common Development Tasks

### Adding a new RLS operation

1. Create function in `src/core/` (e.g., `disable-rls.ts`)
2. Export from `src/core/index.ts`
3. Add CLI command in `src/cli/commands/`
4. Update types in `src/core/types.ts`
5. Write tests
6. Update README

### Modifying SQL generation

1. Edit `src/core/sql-builder.ts`
2. Update validators if new inputs added
3. Add tests for new SQL patterns
4. Ensure validation prevents injection

### Testing against real database

```bash
# Set connection string
# secretlint-disable-next-line
export DATABASE_URI="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Run integration tests
cd packages/payload-supabase-rls
pnpm test
```

### Debugging plugin behavior

```bash
cd apps/supabase-payload
pnpm dev

# Watch console for:
# "🔄 PayloadSupabaseRLS: Re-enabling RLS..."
# "✅ PayloadSupabaseRLS: RLS enabled on X tables with Y policies"
```

## Project-Specific Constraints

### Security Considerations

1. **Input validation**: NEVER skip validation before SQL generation
2. **Service role**: All operations require BYPASSRLS privilege
3. **Policy naming**: Use validated identifiers only
4. **Existing policies**: Same-name policies are overridden

### Current Limitations

1. **v0.x status**: Experimental, deny-all policies only
2. **Supabase features**: Blocks PostgREST, Auth, Realtime
3. **Use case**: Designed for PayloadCMS-exclusive database access

### Breaking Changes

When making breaking changes:

1. Document in changeset (type: `major`)
2. Update migration guide in README
3. Consider deprecation warnings first
