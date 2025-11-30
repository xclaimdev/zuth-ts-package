import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { ZuthConfig, ZuthError, ZuthSDKError } from './types';

/**
 * Base HTTP client for Zuth API
 * Handles authentication, error handling, and request/response interceptors
 */
export class ZuthClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;

  constructor(private config: ZuthConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor: Add auth token if available
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle errors consistently
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ZuthError>) => {
        if (error.response) {
          const zuthError = error.response.data;
          throw new ZuthSDKError(
            zuthError.message || 'An error occurred',
            zuthError.statusCode || error.response.status,
            zuthError.error || 'UnknownError',
            zuthError.details
          );
        } else if (error.request) {
          throw new ZuthSDKError(
            'Network error: Unable to reach the server',
            0,
            'NetworkError'
          );
        } else {
          throw new ZuthSDKError(
            error.message || 'An unexpected error occurred',
            0,
            'UnknownError'
          );
        }
      }
    );
  }

  /**
   * Set the access token for authenticated requests
   */
  public setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  /**
   * Get the current access token
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Clear the access token
   */
  public clearAccessToken(): void {
    this.accessToken = null;
  }

  /**
   * Make a GET request
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * Make a POST request
   */
  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get the base URL
   */
  public getBaseUrl(): string {
    return this.config.baseUrl;
  }
}

