# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Best Practices

### 1. Token Storage

**Never store tokens in plain text or insecure storage.**

- ✅ **Recommended**: Use httpOnly cookies (server-side)
- ✅ **Acceptable**: Encrypted localStorage with secure key management
- ❌ **Never**: Plain localStorage, sessionStorage, or global variables

### 2. Client Secrets

**Never include client secrets in client-side code.**

- ✅ **Server-side**: Client secrets are acceptable
- ❌ **Client-side**: Never expose client secrets in browser code

### 3. HTTPS Only

**Always use HTTPS in production.**

- ✅ Use `https://` for all API calls in production
- ❌ Never use `http://` in production environments

### 4. Token Validation

**Always validate tokens on the server side.**

- Validate token signature
- Check token expiration
- Verify token audience and issuer

### 5. Redirect URI Validation

**Always validate redirect URIs to prevent open redirect attacks.**

```typescript
const allowedRedirectUris = [
  'https://yourapp.com/callback',
];

function isValidRedirectUri(uri: string): boolean {
  return allowedRedirectUris.includes(uri);
}
```

### 6. Error Handling

**Never expose sensitive information in error messages.**

The SDK automatically sanitizes error responses, but always handle errors securely:

```typescript
try {
  await zuth.auth.login({ email, password });
} catch (error) {
  // Log error details server-side only
  // Show generic message to user
  console.error('Login failed:', error); // Server-side only
  showError('Login failed. Please try again.'); // User-facing
}
```

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** open a public issue.

Instead, please email security@zuth.example.com with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Security Updates

Security updates are released as patch versions (e.g., 1.0.0 → 1.0.1).

Always keep your dependencies up to date:

```bash
npm audit
npm update @zuth/auth
```

## Dependencies

We regularly audit and update dependencies for security vulnerabilities.

Current security status:
- ✅ All dependencies are up to date
- ✅ No known vulnerabilities
- ✅ Regular security audits performed

## Compliance

This SDK follows security best practices and industry standards:

- ✅ OWASP Top 10 compliance
- ✅ OAuth 2.0 security best practices
- ✅ OIDC security guidelines
- ✅ JWT security recommendations

