import { ZuthClient } from './client';
import {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  User,
  Session,
  MfaSetupResponse,
  MfaVerifyRequest,
} from './types';
import { isValidEmail, isValidPassword, sanitizeInput } from './security';

/**
 * Authentication methods for Zuth SDK
 */
export class ZuthAuth {
  constructor(private client: ZuthClient) {}

  /**
   * Register a new user
   * @param data Registration data
   * @returns User object
   */
  async register(data: RegisterRequest): Promise<User> {
    // Basic client-side validation
    if (!isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    
    if (!isValidPassword(data.password)) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Sanitize inputs
    const sanitizedData: RegisterRequest = {
      email: sanitizeInput(data.email.toLowerCase().trim()),
      password: data.password, // Don't sanitize password, but ensure it's a string
      name: data.name ? sanitizeInput(data.name.trim()) : undefined,
    };

    const response = await this.client.post<User>('/auth/register', sanitizedData);
    return response;
  }

  /**
   * Login with email and password
   * Automatically sets the access token for subsequent requests
   * @param data Login credentials
   * @returns Login response with access token and user info
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Basic client-side validation
    if (!isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Sanitize email input
    const sanitizedData: LoginRequest = {
      email: sanitizeInput(data.email.toLowerCase().trim()),
      password: data.password, // Don't sanitize password
    };

    const response = await this.client.post<LoginResponse>('/auth/login', sanitizedData);
    // Automatically set the access token
    this.client.setAccessToken(response.access_token);
    return response;
  }

  /**
   * Get the current authenticated user
   * @returns Current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response;
  }

  /**
   * Check if the current session is valid
   * @returns Session validity status
   */
  async checkSession(): Promise<{ valid: boolean; user?: User }> {
    try {
      const user = await this.getCurrentUser();
      return { valid: true, user };
    } catch (error: any) {
      if (error.statusCode === 401) {
        return { valid: false };
      }
      throw error;
    }
  }

  /**
   * Logout the current user
   * Clears the access token
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      // Always clear the token, even if the request fails
      this.client.clearAccessToken();
    }
  }

  /**
   * Get active sessions for the current user
   * @returns Array of active sessions
   */
  async getActiveSessions(): Promise<Session[]> {
    const response = await this.client.get<{ sessions: Session[] }>('/auth/sessions');
    return response.sessions;
  }

  /**
   * Revoke a specific session
   * @param sessionId Session ID to revoke
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.client.post(`/auth/sessions/${sessionId}/revoke`);
  }

  /**
   * Setup MFA (Multi-Factor Authentication)
   * @returns MFA setup data including QR code and manual entry key
   */
  async setupMfa(): Promise<MfaSetupResponse> {
    const response = await this.client.post<MfaSetupResponse>('/auth/mfa/setup');
    return response;
  }

  /**
   * Verify MFA code
   * @param data MFA verification data
   */
  async verifyMfa(data: MfaVerifyRequest): Promise<void> {
    await this.client.post('/auth/mfa/verify', data);
  }

  /**
   * Setup Email MFA
   */
  async setupEmailMfa(): Promise<void> {
    await this.client.post('/auth/mfa/setup/email');
  }

  /**
   * Send Email MFA code
   */
  async sendEmailMfaCode(): Promise<void> {
    await this.client.post('/auth/mfa/email/send-code');
  }

  /**
   * Verify Email MFA code
   * @param code Email MFA code
   */
  async verifyEmailMfaCode(code: string): Promise<void> {
    await this.client.post('/auth/mfa/email/verify', { code });
  }
}

