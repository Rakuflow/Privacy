export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}
