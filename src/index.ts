/**
 * Zuth Authentication SDK
 * Official TypeScript SDK for integrating Zuth authentication into your applications
 * 
 * @packageDocumentation
 */

import { ZuthClient } from './client';
import { ZuthAuth } from './auth';
import { ZuthOAuth } from './oauth';
import { ZuthConfig } from './types';

export * from './types';

/**
 * Main Zuth SDK class
 * Provides authentication, OAuth, and session management capabilities
 * 
 * @example
 * ```typescript
 * import { Zuth } from '@zuth/auth';
 * 
 * const zuth = new Zuth({
 *   baseUrl: 'https://api.zuth.example.com',
 *   clientId: 'your-client-id',
 * });
 * 
 * // Login
 * const response = await zuth.auth.login({
 *   email: 'user@example.com',
 *   password: 'password123',
 * });
 * 
 * // Get current user
 * const user = await zuth.auth.getCurrentUser();
 * ```
 */
export class Zuth {
  public readonly client: ZuthClient;
  public readonly auth: ZuthAuth;
  public readonly oauth: ZuthOAuth;

  constructor(config: ZuthConfig) {
    // Validate configuration
    if (!config.baseUrl) {
      throw new Error('baseUrl is required in Zuth configuration');
    }

    // Ensure baseUrl doesn't end with a slash
    const normalizedConfig = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, ''),
    };

    this.client = new ZuthClient(normalizedConfig);
    this.auth = new ZuthAuth(this.client);
    this.oauth = new ZuthOAuth(this.client);
  }

  /**
   * Initialize with an existing access token
   * Useful for restoring sessions from storage
   * @param token Access token
   */
  public setAccessToken(token: string): void {
    this.client.setAccessToken(token);
  }

  /**
   * Check if user is authenticated
   * @returns True if access token is set
   */
  public isAuthenticated(): boolean {
    return this.client.getAccessToken() !== null;
  }

  /**
   * Clear authentication state
   */
  public clearAuth(): void {
    this.client.clearAccessToken();
  }
}

// Default export
export default Zuth;

