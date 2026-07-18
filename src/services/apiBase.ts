import { getStoredAccessToken } from "./cognitoAuth";

export const API_BASE_URL =
  "https://daiee5zick.execute-api.af-south-1.amazonaws.com/prod";

export function getAuthHeaders(hasBody = false): HeadersInit {
  const token = getStoredAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const hasBody =
    method !== "GET" &&
    method !== "HEAD" &&
    options.body !== undefined;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(hasBody),
      ...options.headers,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}
