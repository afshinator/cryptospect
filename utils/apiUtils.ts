// apiUtils.ts


// Default timeout in milliseconds (e.g., 10 seconds)
const REQUEST_TIMEOUT_MS: number = 10000; 

// Default Content-Type header
const CONTENT_TYPE: string = 'application/json';


/**
 * Interface for the custom API error object.
 */
export interface ApiError extends Error {
  status: number;
  detail: string;
}

// Factory function to structure an ApiError object from raw inputs
const formatApiError = (message: string, status: number, detail: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.status = status;
  error.detail = detail;
  return error;
};


// A simple centralized logger for error reporting.
const logError = (error: unknown, fullUrl: string): void => {
  console.error(`\n--- API Error Detected ---`);
  console.error(`URL: ${fullUrl}`);

  // Check if the error matches the ApiError structure
  const isApiError = (err: any): err is ApiError => 
    err instanceof Error && 'status' in err && 'detail' in err;

  if (isApiError(error)) {
    console.error(`Status: ${error.status}, Detail: ${error.detail}`);
    console.error(`Message: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`Standard Error: ${error.message}`);
  } else {
    console.error('An unknown, non-Error type was thrown.');
  }

  // In a production app, integrate an external logger (Sentry, etc.) here
  console.log(`--- End of Error Report ---\n`);
};

// Handles the raw Response object, checking for status and parsing the body.
const handleResponse = async (response: Response, fullUrl: string): Promise<any> => {
  if (!response.ok) {
    let errorDetail = response.statusText;
    
    // Attempt to read the error message from the body
    try {
      const errorBody = await response.json();
      // Use common API error fields
      errorDetail = errorBody.message || errorBody.error || errorDetail;
    } catch (e) {
      // If the body isn't JSON, or reading fails, use the status text
    }

    throw formatApiError(
      `HTTP error! Status: ${response.status}`,
      response.status,
      errorDetail
    );
  }

  // If the response is good, return the JSON data
  return response.json();
};

// MAIN EXPORTED FUNCTIONS

/**
 * Generic function to make a typed API request.
 * @template T - The expected type of the data returned by the API.
 * @param baseUrl - The base URL of the API (e.g., 'https://api.myapp.com/v1').
 * @param endpoint - The specific API endpoint (e.g., '/users/123').
 * @param options - Optional fetch configuration (method, headers, body, etc.).
 * @returns {Promise<T>} - The parsed JSON data of type T.
 */
export const apiRequest = async <T>(
  baseUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Construct the full URL by combining base and endpoint
  const url = `${baseUrl}${endpoint}`;

  // Default headers
  const defaultHeaders = {
    'Content-Type': CONTENT_TYPE,
  };

  const config: RequestInit = {
    method: 'GET', // Default method
    ...options,
    headers: {
      ...defaultHeaders,
      // Merge in any user-provided headers
      ...(options.headers as Record<string, string> || {}),
    },
    // Enforce the timeout using AbortController
    signal: options.signal || AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };

  try {
    const response = await fetch(url, config);
    // T is inferred here based on how you call the function
    const data: T = await handleResponse(response, url); 
    return data;
  } catch (error) {
    // Centralized error logging
    logError(error, url);

    // Re-throw the original error to be handled by the calling component
    throw error;
  }
};

/**
 * Simple wrapper for making a GET request.
 * @template T - The expected return type.
 * @param baseUrl - The base URL.
 * @param endpoint - The specific endpoint.
 * @param options - Optional fetch configuration (excluding 'method' and 'body').
 * @returns {Promise<T>} - The parsed JSON data.
 */
export const apiGet = <T>(
  baseUrl: string,
  endpoint: string,
  options?: Omit<RequestInit, 'method' | 'body'> // Omit method and body for GET
): Promise<T> => {
  return apiRequest<T>(baseUrl, endpoint, { method: 'GET', ...options });
};