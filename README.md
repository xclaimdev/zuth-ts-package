# @zuth/auth

Official TypeScript SDK for Zuth Authentication - Easy integration for secure authentication, OAuth, OIDC, and MFA.

## Features

- 🔐 **Secure Authentication** - Email/password, OAuth, and OIDC support
- 🔑 **JWT Token Management** - Automatic token handling and refresh
- 🛡️ **Multi-Factor Authentication** - TOTP and Email MFA support
- 📱 **Session Management** - Track and manage user sessions
- 🔒 **Type-Safe** - Full TypeScript support with comprehensive types
- 🌐 **Browser & Node.js** - Works in both environments
- ⚡ **Lightweight** - Minimal dependencies, fast performance

## Installation

```bash
npm install @zuth/auth
# or
yarn add @zuth/auth
# or
pnpm add @zuth/auth
```

## Quick Start

### Basic Setup

```typescript
import { Zuth } from '@zuth/auth';

const zuth = new Zuth({
  baseUrl: 'https://api.zuth.example.com',
});
```

### Authentication

#### Register a New User

```typescript
const user = await zuth.auth.register({
  email: 'user@example.com',
  password: 'securePassword123!',
  name: 'John Doe',
});
```

#### Login

```typescript
const response = await zuth.auth.login({
  email: 'user@example.com',
  password: 'securePassword123!',
});

// Access token is automatically stored
console.log('User:', response.user);
console.log('Token:', response.access_token);
```

#### Get Current User

```typescript
const user = await zuth.auth.getCurrentUser();
console.log('Current user:', user);
```

#### Logout

```typescript
await zuth.auth.logout();
// Token is automatically cleared
```

### OAuth Integration

#### Authorization Code Flow

```typescript
// 1. Get authorization URL (state is auto-generated if not provided)
const { url: authUrl, state } = zuth.oauth.getAuthorizationUrl({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  responseType: 'code',
  scope: 'openid profile email',
  // state is optional - will be auto-generated for CSRF protection
}, ['https://yourapp.com']); // Optional: validate redirect URI

// 2. Store state for validation (e.g., in sessionStorage)
sessionStorage.setItem('oauth_state', state);

// 3. Redirect user to authUrl
window.location.href = authUrl;

// 3. Handle callback (in your callback route)
const originalState = sessionStorage.getItem('oauth_state');
sessionStorage.removeItem('oauth_state'); // Clean up

const tokenResponse = await zuth.oauth.handleCallback(
  window.location.href,
  'your-client-id',
  undefined, // clientSecret (not recommended for client-side)
  'https://yourapp.com/callback',
  originalState || undefined // Validate state for CSRF protection
);

// Token is automatically stored
```

#### Using Helper Method (Browser Only)

```typescript
// Redirect user to authorization
// Store the returned state for validation
const state = zuth.oauth.redirectToAuthorization({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  scope: 'openid profile email',
}, ['https://yourapp.com']); // Optional: validate redirect URI

// Store state for validation
sessionStorage.setItem('oauth_state', state);
```

### Multi-Factor Authentication (MFA)

#### Setup TOTP MFA

```typescript
// 1. Setup MFA
const mfaSetup = await zuth.auth.setupMfa();
console.log('QR Code:', mfaSetup.qrCode);
console.log('Manual Entry Key:', mfaSetup.manualEntryKey);

// 2. User scans QR code with authenticator app
// 3. Verify the code
await zuth.auth.verifyMfa({
  code: '123456', // Code from authenticator app
});
```

#### Email MFA

```typescript
// 1. Setup Email MFA
await zuth.auth.setupEmailMfa();

// 2. Send code
await zuth.auth.sendEmailMfaCode();

// 3. Verify code
await zuth.auth.verifyEmailMfaCode('123456');
```

### Session Management

```typescript
// Get all active sessions
const sessions = await zuth.auth.getActiveSessions();
console.log('Active sessions:', sessions);

// Revoke a specific session
await zuth.auth.revokeSession('session-id');
```

### Token Management

```typescript
// Set token manually (e.g., from localStorage)
zuth.setAccessToken('your-token-here');

// Check if authenticated
if (zuth.isAuthenticated()) {
  console.log('User is authenticated');
}

// Clear authentication
zuth.clearAuth();
```

### Error Handling

```typescript
import { ZuthSDKError } from '@zuth/auth';

try {
  await zuth.auth.login({
    email: 'user@example.com',
    password: 'wrong-password',
  });
} catch (error) {
  if (error instanceof ZuthSDKError) {
    console.error('Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Error Type:', error.error);
  }
}
```

## Configuration

### Full Configuration Options

```typescript
const zuth = new Zuth({
  baseUrl: 'https://api.zuth.example.com', // Required
  clientId: 'your-client-id', // Optional, for OAuth
  clientSecret: 'your-client-secret', // Optional, not recommended for client-side
  redirectUri: 'https://yourapp.com/callback', // Optional, default OAuth redirect
  timeout: 30000, // Optional, request timeout in ms (default: 30000)
  headers: { // Optional, custom headers
    'X-Custom-Header': 'value',
  },
});
```

## Security Features

The SDK includes built-in security features:

- ✅ **HTTPS Enforcement** - Automatically validates HTTPS in production
- ✅ **CSRF Protection** - Auto-generates and validates OAuth state parameters
- ✅ **Input Validation** - Validates email and password before sending
- ✅ **Input Sanitization** - Sanitizes user inputs to prevent XSS
- ✅ **Redirect URI Validation** - Validates OAuth redirect URIs
- ✅ **Secure Random State** - Uses cryptographically secure random for OAuth state

## Security Best Practices

### 1. Never Store Client Secret in Client-Side Code

```typescript
// ❌ BAD - Never do this in browser code
const zuth = new Zuth({
  baseUrl: 'https://api.zuth.example.com',
  clientSecret: 'secret', // This will be exposed!
});

// ✅ GOOD - Only use clientId in browser
const zuth = new Zuth({
  baseUrl: 'https://api.zuth.example.com',
  clientId: 'your-client-id',
});
```

### 2. Secure Token Storage

```typescript
// Store token securely (consider using httpOnly cookies in production)
const token = zuth.client.getAccessToken();
if (token) {
  // Use secure storage (e.g., httpOnly cookies, secure localStorage with encryption)
  localStorage.setItem('zuth_token', token);
}

// Restore token on app initialization
const savedToken = localStorage.getItem('zuth_token');
if (savedToken) {
  zuth.setAccessToken(savedToken);
  
  // Verify token is still valid
  try {
    await zuth.auth.getCurrentUser();
  } catch (error) {
    // Token expired, clear it
    zuth.clearAuth();
    localStorage.removeItem('zuth_token');
  }
}
```

### 3. Handle Token Refresh

```typescript
// Implement token refresh logic
async function refreshTokenIfNeeded() {
  try {
    await zuth.auth.getCurrentUser();
  } catch (error) {
    if (error instanceof ZuthSDKError && error.statusCode === 401) {
      // Token expired, redirect to login
      zuth.clearAuth();
      // Redirect to login page
    }
  }
}
```

### 4. Use HTTPS in Production

Always use HTTPS when communicating with the Zuth API in production:

```typescript
const zuth = new Zuth({
  baseUrl: 'https://api.zuth.example.com', // ✅ HTTPS
  // Never use http:// in production
});
```

### 5. Validate Redirect URIs

Always validate redirect URIs to prevent open redirect vulnerabilities:

```typescript
const allowedRedirectUris = [
  'https://yourapp.com/callback',
  'https://yourapp.com/auth/callback',
];

function isValidRedirectUri(uri: string): boolean {
  return allowedRedirectUris.includes(uri);
}

// Use validated URI
if (isValidRedirectUri(redirectUri)) {
  zuth.oauth.redirectToAuthorization({
    clientId: 'your-client-id',
    redirectUri,
  });
}
```

## React Integration Example

```typescript
import { useEffect, useState } from 'react';
import { Zuth, User } from '@zuth/auth';

const zuth = new Zuth({
  baseUrl: process.env.REACT_APP_ZUTH_API_URL!,
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore token from storage
    const token = localStorage.getItem('zuth_token');
    if (token) {
      zuth.setAccessToken(token);
      zuth.auth.getCurrentUser()
        .then(setUser)
        .catch(() => {
          zuth.clearAuth();
          localStorage.removeItem('zuth_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await zuth.auth.login({ email, password });
      localStorage.setItem('zuth_token', response.access_token);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    await zuth.auth.logout();
    localStorage.removeItem('zuth_token');
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}
```

## Node.js Integration Example

```typescript
import { Zuth } from '@zuth/auth';

const zuth = new Zuth({
  baseUrl: process.env.ZUTH_API_URL!,
  clientId: process.env.ZUTH_CLIENT_ID!,
  clientSecret: process.env.ZUTH_CLIENT_SECRET!, // OK in server-side
});

// Server-side authentication
async function authenticateUser(email: string, password: string) {
  try {
    const response = await zuth.auth.login({ email, password });
    return response.user;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
```

## API Reference

### Zuth Class

Main SDK class that provides access to all authentication features.

#### Constructor

```typescript
new Zuth(config: ZuthConfig)
```

#### Methods

- `setAccessToken(token: string): void` - Set access token manually
- `isAuthenticated(): boolean` - Check if user is authenticated
- `clearAuth(): void` - Clear authentication state

### ZuthAuth Class

Authentication methods.

#### Methods

- `register(data: RegisterRequest): Promise<User>`
- `login(data: LoginRequest): Promise<LoginResponse>`
- `getCurrentUser(): Promise<User>`
- `checkSession(): Promise<{ valid: boolean; user?: User }>`
- `logout(): Promise<void>`
- `getActiveSessions(): Promise<Session[]>`
- `revokeSession(sessionId: string): Promise<void>`
- `setupMfa(): Promise<MfaSetupResponse>`
- `verifyMfa(data: MfaVerifyRequest): Promise<void>`
- `setupEmailMfa(): Promise<void>`
- `sendEmailMfaCode(): Promise<void>`
- `verifyEmailMfaCode(code: string): Promise<void>`

### ZuthOAuth Class

OAuth and OIDC methods.

#### Methods

- `getAuthorizationUrl(params: OAuthAuthorizeParams): string`
- `exchangeCodeForToken(data: OAuthTokenRequest): Promise<OAuthTokenResponse>`
- `refreshToken(refreshToken: string, clientId: string): Promise<OAuthTokenResponse>`
- `getOidcConfiguration(): Promise<any>`
- `redirectToAuthorization(params: OAuthAuthorizeParams): void`
- `handleCallback(url: string, clientId: string, clientSecret?: string, redirectUri?: string): Promise<OAuthTokenResponse>`

## Type Definitions

All TypeScript types are exported from the package:

```typescript
import {
  ZuthConfig,
  User,
  LoginResponse,
  RegisterRequest,
  LoginRequest,
  Session,
  MfaSetupResponse,
  OAuthAuthorizeParams,
  OAuthTokenResponse,
  ZuthSDKError,
} from '@zuth/auth';
```

## Error Handling

The SDK throws `ZuthSDKError` for all API errors:

```typescript
import { ZuthSDKError } from '@zuth/auth';

try {
  await zuth.auth.login({ email: 'user@example.com', password: 'wrong' });
} catch (error) {
  if (error instanceof ZuthSDKError) {
    console.error('Status:', error.statusCode);
    console.error('Error:', error.error);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
  }
}
```

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

MIT

## Support

- Documentation: [GitHub Repository](https://github.com/xclaimdev/zuth-ts-package)
- Issues: [GitHub Issues](https://github.com/xclaimdev/zuth-ts-package/issues)
- Email: support@zuth.example.com

## Changelog

### 1.0.0

- Initial release
- Authentication (register, login, logout)
- OAuth/OIDC support
- MFA support (TOTP and Email)
- Session management
- Full TypeScript support

