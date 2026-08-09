const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface BackendErrorBody {
  message?: string | string[];
  error?: string;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Don't set Content-Type for FormData bodies — the browser must set it
  // itself (including the multipart boundary).
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Please check your connection.');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body: BackendErrorBody | T | undefined = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const errorBody = body as BackendErrorBody | undefined;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(', ')
      : errorBody?.message || 'Something went wrong. Please try again.';
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}
