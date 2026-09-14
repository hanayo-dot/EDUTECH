import { ApiResponse, ApiErrorResponse } from '@edutech/common';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorData = data as ApiErrorResponse;
    throw new Error(
      errorData.error?.message || `API request failed with status ${response.status}`,
    );
  }

  return data as ApiResponse<T>;
}
