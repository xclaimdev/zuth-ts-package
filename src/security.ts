/**
 * Security utilities for Zuth SDK
 */

/**
 * Validate that a URL uses HTTPS (required for production)
 * @param url URL to validate
 * @param allowLocalhost Allow localhost for development
 * @throws Error if URL is not secure
 */
export function validateSecureUrl(url: string, allowLocalhost: boolean = true): void {
  try {
    const urlObj = new URL(url);
    
    // Allow localhost in development
    if (allowLocalhost && (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      return;
    }
    
    // Require HTTPS in production
    if (urlObj.protocol !== 'https:') {
      throw new Error(
        'Insecure URL detected. HTTPS is required in production. ' +
        'Use https:// for your baseUrl in production environments.'
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insecure URL')) {
      throw error;
    }
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Validate redirect URI to prevent open redirect vulnerabilities
 * @param redirectUri Redirect URI to validate
 * @param allowedOrigins List of allowed origins
 * @throws Error if redirect URI is not allowed
 */
export function validateRedirectUri(redirectUri: string, allowedOrigins: string[]): void {
  try {
    const uriObj = new URL(redirectUri);
    const origin = `${uriObj.protocol}//${uriObj.host}`;
    
    if (!allowedOrigins.includes(origin)) {
      throw new Error(
        `Redirect URI ${redirectUri} is not in the allowed origins list. ` +
        `Allowed origins: ${allowedOrigins.join(', ')}`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Redirect URI')) {
      throw error;
    }
    throw new Error(`Invalid redirect URI: ${redirectUri}`);
  }
}

/**
 * Generate a secure random state parameter for OAuth
 * @returns Random state string
 */
export function generateOAuthState(): string {
  // Generate a cryptographically secure random state
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environments
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate OAuth state parameter to prevent CSRF attacks
 * @param receivedState State received from OAuth callback
 * @param originalState Original state sent during authorization
 * @throws Error if states don't match
 */
export function validateOAuthState(receivedState: string | null, originalState: string): void {
  if (!receivedState) {
    throw new Error('OAuth state parameter is missing. This may indicate a CSRF attack.');
  }
  
  if (receivedState !== originalState) {
    throw new Error('OAuth state parameter mismatch. This may indicate a CSRF attack.');
  }
}

/**
 * Sanitize input to prevent XSS
 * @param input Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  // Remove HTML tags and encode special characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim();
}

/**
 * Validate email format
 * @param email Email to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength (basic)
 * @param password Password to validate
 * @param minLength Minimum length (default: 8)
 * @returns True if password meets requirements
 */
export function isValidPassword(password: string, minLength: number = 8): boolean {
  return password.length >= minLength;
}

