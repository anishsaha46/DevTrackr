import { getAuthToken, clearAuthToken } from './auth';

// Define the base URL for API calls.
export const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

/**
 * Generic helper function to make API requests with token handling.
 *
 * @template T - Expected return type (default: any)
 * @param path - API endpoint path (e.g., "/users")
 * @param init - Optional fetch configuration (method, headers, body, etc.)
 * @returns A promise resolving to the parsed JSON response or undefined
 */
export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T | undefined> {
  // Get the auth token using our centralized function
  const token = getAuthToken();

  // Prepare request headers by spreading any custom headers passed in `init`
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  // If a token is found, include it as a Bearer token in the Authorization header
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Make the actual fetch request to the full API URL
  const res = await fetch(`${apiBase}${path}`, { ...init, headers });

  // Handle Unauthorized (401) responses
  if (res.status === 401) {
    // If in browser, clear the token and redirect to login page
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      location.assign("/login");
    }

    // Also throw an error to inform the caller
    throw new Error("Unauthorized");
  }

  // Handle any other failed responses (non-2xx)
  if (!res.ok) {
    const text = await res.text(); // Attempt to read error message from response body
    throw new Error(text || `Request failed: ${res.status}`);
  }

  // Check if the response is JSON
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return res.json(); // Parse and return the JSON response
  }

  // If the response is not JSON, return undefined
  return undefined;
}
