# Security Policy

## Supported Versions

This project is currently in **experimental stage (v0.x)**. Security patches will be applied to the latest version only.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Considerations

### Input Validation

All user-provided inputs (schema names, table patterns, role names, policy names) are validated to prevent SQL injection attacks before being used in SQL generation.

**Validation Rules**:

- **Schema/Identifiers**: Must start with a letter or underscore, contain only alphanumeric, underscore, or dollar sign characters, and cannot be SQL keywords
- **LIKE Patterns**: Only alphanumeric, underscore (`_`), and percent (`%`) characters allowed
- **Roles**: Validated as identifiers with comma-separated list support
- **Maximum Length**: All inputs limited to 63 characters (PostgreSQL limit)

**Example of Rejected Inputs**:

```typescript
// ❌ SQL injection attempts - all rejected
enableRLS({
  schema: "public'; DROP SCHEMA public; --", // Contains semicolon and SQL injection
  excludePatterns: ["' OR '1'='1"], // SQL injection in pattern
  targetRoles: ['DROP', 'SELECT'], // SQL keywords
});
```

### Database Credentials

**Connection String Security**:

- Connection strings must use **service role** or a role with `BYPASSRLS` privilege
- Never commit `.env` files containing real credentials to version control
- Use environment variables for production deployments
- Rotate credentials immediately if accidentally exposed

**Best Practices**:

<!-- secretlint-disable -->

```bash
# ✅ Good - use environment variables
export DATABASE_URI="postgresql://postgres:[password]@[host]:5432/postgres"
pnpm payload-supabase-rls enable

# ❌ Bad - hardcoded in scripts
DATABASE_URI="postgresql://postgres:password123@..." pnpm rls:enable
```

<!-- secretlint-enable -->

### RLS Policy Model

**Security Model**:

This library creates **deny-all policies** by default:

- All `SELECT`, `INSERT`, `UPDATE`, `DELETE` operations are denied for `anon` and `authenticated` roles
- This blocks Supabase's PostgREST API, Auth, and Realtime features
- Only `postgres` and `service_role` roles can bypass RLS

**Important Limitations**:

- ⚠️ **Not suitable for multi-tenant applications** - denies all access to standard roles
- ⚠️ **Blocks Supabase features** - PostgREST, Auth, Realtime will not work
- ⚠️ **Overwrites existing policies** - policies with the same name will be replaced

**Use Case**:

This library is designed for **PayloadCMS-exclusive database access** where:

- Only PayloadCMS connects to the database (via service role)
- No direct client access is needed
- Supabase features (Auth, Realtime, PostgREST) are not used

### Deployment Security

**Development vs Production**:

- ✅ **Development**: Auto-enable RLS using PayloadCMS plugin (`autoEnable: true`)
- ❌ **Production**: Disable auto-enable (`autoEnable: false`) and apply RLS manually or via CI/CD

**Recommended Configuration**:

```typescript
// payload.config.ts
import { payloadSupabaseRLS } from '@sect/payload-supabase-rls/integrations/payload';

export default buildConfig({
  plugins: [
    payloadSupabaseRLS({
      autoEnable: true,
      environments: ['development'], // Only in development
    }),
  ],
});
```

### Testing Before Production

**Pre-deployment Checklist**:

1. **Verify RLS Status**:

   ```bash
   pnpm payload-supabase-rls verify --connection $DATABASE_URI
   ```

2. **Check Supabase Dashboard**:
   - Security Advisor → 0 RLS-related errors
   - Table Editor → All tables show "RLS Enabled"

3. **Test Application**:
   - Ensure PayloadCMS admin panel works correctly
   - Verify all CRUD operations function as expected
   - Confirm no unauthorized access is possible

4. **Monitor Logs**:
   - Check for permission denied errors
   - Verify service role connections succeed

## Known Limitations

### Version 0.x Limitations

- **Deny-all policies only**: Cannot create custom RLS policies
- **Policy name conflicts**: Overwrites existing policies with the same name
- **No policy customization**: Cannot specify custom policy expressions
- **Schema-wide operation**: Cannot selectively enable RLS on specific tables

### PostgreSQL Compatibility

- **PostgreSQL 9.5+**: RLS support required
- **Supabase PostgreSQL**: Fully compatible
- **Self-hosted PostgreSQL**: Requires `BYPASSRLS` privilege for service role

## Reporting a Vulnerability

**DO NOT** open public GitHub issues for security vulnerabilities.

Instead, please report security issues by:

1. **Email**: Send to the repository maintainer (check `package.json` for contact info)
2. **GitHub Security Advisories**: Use "Report a vulnerability" in the Security tab

**What to Include**:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Response Time**:

- Initial response: Within 48 hours
- Security patch: Within 7 days for critical issues
- Public disclosure: After patch is released and users have had time to update

## Security Best Practices

### For Library Users

1. **Always validate inputs** when building custom RLS policies
2. **Use environment variables** for database connection strings
3. **Rotate credentials** if accidentally exposed
4. **Test RLS policies** in staging environment before production
5. **Monitor database logs** for unauthorized access attempts
6. **Keep dependencies updated** (run `pnpm update` regularly)

### For Contributors

1. **Never commit credentials** to version control
2. **Use secretlint** before committing (automatically runs via pre-commit hook)
3. **Write tests** for all security-sensitive code
4. **Follow input validation patterns** from `src/core/validators.ts`
5. **Use safe SQL generation** with parameterized queries or `format()`

## Security Scanning

This project uses automated security scanning:

- **secretlint**: Detects leaked credentials in commits
- **pre-commit hooks**: Runs security checks before every commit
- **dependency scanning**: Use `pnpm audit` to check for vulnerable dependencies

**Run Security Checks**:

```bash
# Check for secrets in all files
pnpm secretlint

# Audit dependencies for vulnerabilities
pnpm audit

# Run all tests (includes security validation tests)
pnpm test
```

## Additional Resources

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PayloadCMS Security](https://payloadcms.com/docs/configuration/overview#security)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
