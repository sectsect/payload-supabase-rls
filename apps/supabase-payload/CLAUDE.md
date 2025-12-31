# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PayloadCMS 3.x + Next.js 15 + Supabase project. Uses PayloadCMS as a headless CMS, Supabase PostgreSQL as the database, and Supabase Storage for media storage.

**Key Technology Stack**:

- PayloadCMS 3.69.0 (currently compatible with Next.js 14.x only)
- Next.js 15.5.9 (App Router)
- React 19.2.3
- PostgreSQL (via Supabase)
- TypeScript 5.9.3
- Tailwind CSS

## Development Commands

### Essential Commands

```bash
# Start development server
pnpm dev

# Start development server (with .next directory cleanup)
pnpm devsafe

# Production build
pnpm build

# Start production server
pnpm start

# Type checking
pnpm type-check

# Type checking (watch mode)
pnpm type-check:watch

# Run linter
pnpm lint

# Run linter (with auto-fix)
pnpm lint:fix
```

### PayloadCMS Related

```bash
# Generate PayloadCMS type definitions
pnpm generate:types

# Execute PayloadCMS CLI command
pnpm payload [command]
```

### RLS (Row-Level Security) Management

RLS is managed via the `@sect/payload-supabase-rls` library package. Commands use the library's CLI:

```bash
# Re-enable RLS (only when manual execution is needed)
pnpm rls:enable

# Verify RLS state (detailed report)
pnpm rls:verify

# Quick check RLS status
pnpm rls:status
```

## Architecture

### Project Structure

```
src/
├── app/
│   ├── (app)/                    # Frontend application
│   │   ├── (1-column)/          # 1-column layout
│   │   │   ├── posts/           # Posts list and detail pages
│   │   │   └── page.tsx         # Home page
│   │   └── layout.tsx           # Application root layout
│   └── (payload)/               # PayloadCMS admin panel
│       ├── admin/               # Admin panel route
│       └── api/                 # GraphQL/REST API
├── collections/                 # PayloadCMS collection definitions
│   ├── Posts.ts                # Posts collection (block-based)
│   ├── Media.ts                # Media collection
│   ├── Documents.ts            # Documents collection
│   └── Users.ts                # Users collection
├── components/
│   ├── elements/               # Reusable UI elements
│   └── modules/                # Page modules
├── utils/                      # Utility functions
├── styles/                     # Global styles
├── payload.config.ts           # PayloadCMS configuration
└── payload-types.ts            # Auto-generated type definitions (do not edit)
```

### Key Design Patterns

#### 1. PayloadCMS Collections

PayloadCMS collections are defined in `src/collections/` and automatically created as PostgreSQL tables.

**Posts Collection Structure**:

- Block-based page builder
- 5 block types: Heading2, Text, RichText, Button, Slider
- Version control and draft functionality enabled

**Table Naming Convention**:

- Main table: `posts`
- Nested fields: `posts_page`, `posts_blocks_heading2`, etc.
- Version tables: `_posts_v`, `_posts_v_version_page`, etc.

#### 2. Supabase RLS Automatic Management

This project uses the `@sect/payload-supabase-rls` library package for automatic RLS management.

**Development Environment Workflow**:

1. First access to `/admin` → PayloadCMS initialization
2. Drizzle ORM's `pushDevSchema()` execution → RLS disabled
3. `payloadSupabaseRLS` plugin's `onInit` hook execution → RLS automatically re-enabled

**Important**: In development environment, manual RLS management is **not required**. The plugin's `onInit` hook handles it automatically.

**RLS Policies**:

- RLS enabled on all tables
- `anon`/`authenticated` roles deny all access (blocks PostgREST API)
- `postgres`/`service_role` roles bypass RLS (PayloadCMS can access)

#### 3. TypeScript Path Aliases

```typescript
// tsconfig.json path configuration
"@/*" → "./src/*"
"@payload-config" → "./src/payload.config.ts"
```

**Usage Example**:

```typescript
import { Posts } from '@/collections/Posts';
import config from '@payload-config';
```

#### 4. Next.js 15 Async Params

In Next.js 15, `params` and `searchParams` return Promises:

```typescript
// ❌ Old approach (Next.js 14 and earlier)
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}

// ✅ New approach (Next.js 15)
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

#### 5. Import Order Rules

ESLint enforces strict ordering:

1. React (always first)
2. Built-in modules
3. External packages
4. Internal modules (using `@/` alias)

Groups are separated by blank lines and sorted alphabetically.

#### 6. Component Definitions

All React components are defined using arrow functions:

```typescript
// ✅ Correct
const MyComponent = () => {
  return <div>Content</div>;
};

// ❌ Incorrect
function MyComponent() {
  return <div>Content</div>;
}
```

## Important Notes

### Next.js 15 Compatibility Status

**Current Status**: PayloadCMS 3.69.0 does not have full compatibility with Next.js 15.

**Issues**:

- PayloadCMS type definitions are not compatible with Next.js 15's new API specifications
- Build errors related to `importMap` and `serverFunction` properties

**Recommendation**: Maintain the current configuration (Next.js 14 compatibility mode) until PayloadCMS officially announces Next.js 15 support.

### PayloadCMS Database Synchronization

**Development Environment**:

- PayloadCMS automatically synchronizes schema using Drizzle ORM's `pushDevSchema()`
- Automatically executed when `NODE_ENV !== 'production'`
- Migration files are not required (during development)

**Production Environment**:

- `pushDevSchema()` is not executed
- Migrations must be explicitly applied

### RLS Management Best Practices

#### When Adding Collections

1. Create `src/collections/NewCollection.ts`
2. Register in `payload.config.ts`
3. Start with `pnpm dev`
4. Access `/admin` → Automatically creates table + applies RLS

**No manual operations required**. Verify only:

```bash
pnpm rls:status  # Confirm all tables have RLS enabled
```

#### When Deleting Tables

Deleting a PayloadCMS collection automatically deletes the table and RLS policies. No manual cleanup required.

#### Pre-Production Deployment Verification

```bash
# Detailed verification of RLS state for all tables
pnpm rls:verify

# Check Supabase Dashboard Security Advisor
# → Confirm 0 RLS-related errors
```

### Environment Variables

Required environment variables:

- `DATABASE_URI`: Supabase PostgreSQL connection string
- `PAYLOAD_SECRET`: PayloadCMS secret key
- `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_ENDPOINT`: Supabase Storage configuration
- `SUPABASE_MCP_URL`: MCP Server URL (used in `.mcp.json`)

**Setup Instructions**:

1. Copy `.env.example` to `.env`
2. Replace each environment variable with your Supabase project values
3. `SUPABASE_MCP_URL` should be in the format `https://mcp.supabase.com/mcp?project_ref=YOUR-PROJECT-REF`
4. The `.env` file is included in `.gitignore` and will not be tracked by Git

### Linting Rules

**Important Restrictions**:

- Relative imports prohibited: `../` and `./` patterns cannot be used
- Path alias required: All imports must use `@/`
- Unused imports: Automatically error
- TypeScript: `any` type prohibited, strict type checking

**PayloadCMS-Specific Rules**:

- Relative imports allowed in `src/app/(payload)/` and `src/payload.config.ts`
- `.js` extension must be explicitly specified (PayloadCMS requirement)

### Type Generation

PayloadCMS auto-generates `src/payload-types.ts`:

- Run `pnpm generate:types` after changing collection definitions
- This file is **do not edit**
- Recommended to commit to GitHub (for type synchronization across team)

### Database Schema Changes

**Development Environment**:

1. Modify collection definition
2. Restart server (`pnpm dev`)
3. Access `/admin` → Schema automatically updated

**Production Environment**:

- Migrations must be created and applied via Supabase Dashboard
- PayloadCMS uses Drizzle ORM which handles schema synchronization

### Localization

Current configuration:

- Default locale: `ja` (Japanese)
- Fallback enabled

If multi-language support is needed, update `localization.locales` in `payload.config.ts`.
