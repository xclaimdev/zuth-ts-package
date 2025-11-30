import { ZuthClient } from './client';
import {
  OAuthAuthorizeParams,
  OAuthTokenRequest,
  OAuthTokenResponse,
} from './types';

/**
 * OAuth and OIDC methods for Zuth SDK
 */
export class ZuthOAuth {
  constructor(private client: ZuthClient) {}

  /**
   * Get OAuth authorization URL
   * @param params OAuth authorization parameters
   * @returns Authorization URL
   */
  getAuthorizationUrl(params: OAuthAuthorizeParams): string {
    const baseUrl = this.client.getBaseUrl();
    const queryParams = new URLSearchParams({
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      response_type: params.responseType || 'code',
      scope: params.scope || 'openid profile email',
      ...(params.state && { state: params.state }),
    });

    return `${baseUrl}/oauth/authorize?${queryParams.toString()}`;
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
   */
  redirectToAuthorization(params: OAuthAuthorizeParams): void {
    if (typeof window === 'undefined') {
      throw new Error('redirectToAuthorization can only be used in browser environments');
    }
    window.location.href = this.getAuthorizationUrl(params);
  }

  /**
   * Handle OAuth callback
   * Extracts authorization code from URL and exchanges it for a token
   * @param url Current URL (defaults to window.location.href in browser)
   * @param clientId Client ID
   * @param clientSecret Client Secret (optional, not recommended for client-side)
   * @param redirectUri Redirect URI used in authorization
   * @returns Token response
   */
  async handleCallback(
    url: string,
    clientId: string,
    clientSecret?: string,
    redirectUri?: string
  ): Promise<OAuthTokenResponse> {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');
    // Note: state parameter can be used for CSRF protection validation

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('Authorization code not found in callback URL');
    }

    return this.exchangeCodeForToken({
      code,
      clientId,
      clientSecret,
      redirectUri: redirectUri || urlObj.origin + urlObj.pathname,
    });
  }
}

