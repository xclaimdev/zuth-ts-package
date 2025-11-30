import { ZuthClient } from './client';
import {
  OAuthAuthorizeParams,
  OAuthTokenRequest,
  OAuthTokenResponse,
  OAuthAuthorizationResult,
} from './types';
import { generateOAuthState, validateOAuthState, validateRedirectUri } from './security';

/**
 * OAuth and OIDC methods for Zuth SDK
 */
export class ZuthOAuth {
  constructor(private client: ZuthClient) {}

  /**
   * Get OAuth authorization URL
   * @param params OAuth authorization parameters
   * @param allowedOrigins Optional list of allowed redirect URI origins for validation
   * @returns Authorization URL and generated state (if not provided)
   */
  getAuthorizationUrl(
    params: OAuthAuthorizeParams,
    allowedOrigins?: string[]
  ): OAuthAuthorizationResult {
    // Validate redirect URI if allowed origins provided
    if (allowedOrigins && allowedOrigins.length > 0) {
      validateRedirectUri(params.redirectUri, allowedOrigins);
    }

    // Generate state if not provided (CSRF protection)
    const state = params.state || generateOAuthState();

    const baseUrl = this.client.getBaseUrl();
    const queryParams = new URLSearchParams({
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      response_type: params.responseType || 'code',
      scope: params.scope || 'openid profile email',
      state,
    });

    return {
      url: `${baseUrl}/oauth/authorize?${queryParams.toString()}`,
      state,
    };
  }

  /**
   * Exchange authorization code for access token
   * Automatically sets the access token for subsequent requests
   * @param data Token exchange data
   * @returns Token response
   */
  async exchangeCodeForToken(data: OAuthTokenRequest): Promise<OAuthTokenResponse> {
    const response = await this.client.post<OAuthTokenResponse>('/oauth/token', {
      ...data,
      grant_type: data.grantType || 'authorization_code',
    });
    
    // Automatically set the access token
    if (response.access_token) {
      this.client.setAccessToken(response.access_token);
    }
    
    return response;
  }

  /**
   * Refresh an access token using a refresh token
   * @param refreshToken Refresh token
   * @param clientId Client ID
   * @returns New token response
   */
  async refreshToken(refreshToken: string, clientId: string): Promise<OAuthTokenResponse> {
    const response = await this.client.post<OAuthTokenResponse>('/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    });
    
    // Automatically set the new access token
    if (response.access_token) {
      this.client.setAccessToken(response.access_token);
    }
    
    return response;
  }

  /**
   * Get OIDC discovery document
   * @returns OIDC configuration
   */
  async getOidcConfiguration(): Promise<any> {
    const response = await this.client.get('/.well-known/openid-configuration');
    return response;
  }

  /**
   * Redirect to OAuth authorization page
   * Use this in browser environments
   * @param params OAuth authorization parameters
   * @param allowedOrigins Optional list of allowed redirect URI origins for validation
   * @returns State parameter (store this to validate in callback)
   */
  redirectToAuthorization(
    params: OAuthAuthorizeParams,
    allowedOrigins?: string[]
  ): string {
    if (typeof window === 'undefined') {
      throw new Error('redirectToAuthorization can only be used in browser environments');
    }
    const { url, state } = this.getAuthorizationUrl(params, allowedOrigins);
    window.location.href = url;
    return state;
  }

  /**
   * Handle OAuth callback
   * Extracts authorization code from URL and exchanges it for a token
   * @param url Current URL (defaults to window.location.href in browser)
   * @param clientId Client ID
   * @param clientSecret Client Secret (optional, not recommended for client-side)
   * @param redirectUri Redirect URI used in authorization
   * @param originalState Original state parameter from authorization (for CSRF protection)
   * @returns Token response
   */
  async handleCallback(
    url: string,
    clientId: string,
    clientSecret: string | undefined,
    redirectUri: string | undefined,
    originalState?: string
  ): Promise<OAuthTokenResponse> {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');
    const receivedState = urlObj.searchParams.get('state');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('Authorization code not found in callback URL');
    }

    // Validate state parameter for CSRF protection
    if (originalState) {
      validateOAuthState(receivedState, originalState);
    } else if (receivedState) {
      // Warn if state was sent but not validated
      console.warn(
        '⚠️ Security Warning: OAuth state parameter received but not validated. ' +
        'This may leave your application vulnerable to CSRF attacks. ' +
        'Always validate the state parameter by passing originalState to handleCallback.'
      );
    }

    return this.exchangeCodeForToken({
      code,
      clientId,
      clientSecret,
      redirectUri: redirectUri || urlObj.origin + urlObj.pathname,
    });
  }
}

