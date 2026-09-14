/**
 * Standard API request and response envelopes for EduTech CMS.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiFieldError {
  field: string;
  issue: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiFieldError[];
  timestamp: string;
  requestId: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
