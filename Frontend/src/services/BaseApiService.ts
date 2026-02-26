/**
 * Base API Service
 * Provides common HTTP methods and error handling for all services
 */

import type { ApiResponse, RequestOptions } from "../types/Api.type";

export class BaseApiService {
  protected baseUrl: string;
  protected defaultTimeout: number = 30000; // 30 seconds

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * GET request
   */
  protected async get<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * POST request
   */
  protected async post<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * PUT request
   */
  protected async put<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * DELETE request
   */
  protected async delete<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Generic request method with timeout and retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options?.timeout || this.defaultTimeout;
    const retries = options?.retries || 0;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          ...options,
        });

        clearTimeout(timeoutId);

        // Parse response
        let data: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // Check if response is ok
        if (!response.ok) {
          return {
            success: false,
            error: data.error || data.message || `HTTP ${response.status}`,
            statusCode: response.status,
          };
        }

        return {
          success: true,
          data: data as T,
          statusCode: response.status,
        };
      } catch (error: any) {
        lastError = error;

        // If it's the last retry, throw
        if (attempt === retries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    // All retries failed
    return {
      success: false,
      error: lastError?.message || 'Network request failed',
      statusCode: 0,
    };
  }

  /**
   * Check if service is available
   */
  async checkHealth(healthEndpoint: string = '/health'): Promise<boolean> {
    try {
      const response = await this.get(healthEndpoint);
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build query string from params
   */
  protected buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }
}
