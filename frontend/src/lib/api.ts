/**
 * Thin fetch wrapper. Sessions live in HttpOnly cookies; the CSRF token is read
 * from a readable cookie and echoed in a header for every mutation.
 */
const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  code?: string;
  detail: unknown;
  hint?: string;

  constructor(status: number, message: string, detail?: unknown, code?: string, hint?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.code = code;
    this.hint = hint;
  }
}

export function readCookie(name: string): string {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(path: string, method: Method = "GET", body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-CSRF-Token"] = readCookie("mt_csrf");

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the MoneyTwin API. Is the backend running on port 8000?");
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("mt:unauthorized"));
    const detail = payload?.detail;
    let message: string;
    let code: string | undefined;
    let hint: string | undefined;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail.map((d: any) => d?.msg ?? "Invalid value").join(", ");
      code = "validation";
    } else if (detail && typeof detail === "object") {
      message = (detail as any).message ?? "Request failed";
      code = (detail as any).code;
      hint = (detail as any).hint;
    } else {
      message = `Request failed (${response.status})`;
    }
    throw new ApiError(response.status, message, payload, code, hint);
  }
  return payload as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path, "GET"),
  post: <T,>(path: string, body?: unknown) => request<T>(path, "POST", body ?? {}),
  patch: <T,>(path: string, body?: unknown) => request<T>(path, "PATCH", body ?? {}),
  del: <T,>(path: string) => request<T>(path, "DELETE"),
};
