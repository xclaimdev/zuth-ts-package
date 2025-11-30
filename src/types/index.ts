/**
 * Type definitions for Zuth Authentication SDK
 */

export interface ZuthConfig {
  /** Base URL of the Zuth API server */
  baseUrl: string;
  /** Client ID for OAuth applications (optional) */
  clientId?: string;
  /** Client Secret for OAuth applications (optional, not recommended for client-side) */
  clientSecret?: string;
  /** Default redirect URI for OAuth flows */
  redirectUri?: string;
  /** Timeout for API requests in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organization?: {
    id: string;
    name: string;
    setup_completed?: boolean;
  };
  mfaEnabled?: boolean;
  createdAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  device?: {
    id: string;
    fingerprint: string;
    lastUsedAt: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Session {
  id: string;
  device: string;
  ipAddress: string;
  lastUsedAt: string;
  isCurrent?: boolean;
}

export interface MfaSetupResponse {
  qrCode: string;
  manualEntryKey: string;
  backupCodes?: string[];
}

export interface MfaVerifyRequest {
  code: string;
  factorId?: string;
}

export interface OAuthAuthorizeParams {
  clientId: string;
  redirectUri: string;
  responseType?: 'code' | 'token';
  scope?: string;
  state?: string;
}

export interface OAuthTokenRequest {
  code: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  grantType?: 'authorization_code' | 'refresh_token';
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface ZuthError {
  error: string;
  message: string;
  statusCode: number;
  timestamp?: string;
  path?: string;
  details?: any;
}

export class ZuthSDKError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number, error: string, details?: any) {
    super(message);
    this.name = 'ZuthSDKError';
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    Object.setPrototypeOf(this, ZuthSDKError.prototype);
  }
}

