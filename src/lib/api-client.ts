import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  code?: string;
  detail?: any;

  constructor(status: number, message: string, code?: string, detail?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, ...customConfig } = options;

  let url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders = new Headers(headers);

  // Attach Firebase ID token if user is signed in
  try {
    if (auth && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        reqHeaders.set('Authorization', `Bearer ${token}`);
      }
    }
  } catch (err) {
    console.warn('Could not retrieve Firebase ID token:', err);
  }

  // Set default JSON Content-Type unless FormData body is supplied
  if (!(customConfig.body instanceof FormData) && !reqHeaders.has('Content-Type')) {
    reqHeaders.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: reqHeaders,
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText || 'Request failed' };
      }

      const errorMessage =
        errorData.message ||
        errorData.detail ||
        (Array.isArray(errorData.detail)
          ? errorData.detail.map((d: any) => d.msg).join(', ')
          : 'Server returned an error');

      throw new ApiError(response.status, errorMessage, errorData.code, errorData.detail);
    }

    // 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(0, err.message || 'Network connection failed. Backend might be unreachable.');
  }
}
