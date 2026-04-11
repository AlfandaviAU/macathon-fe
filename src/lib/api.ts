const API_URL = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: any,
  ) {
    super(message);
  }
}

function getToken(): string | null {
  return localStorage.getItem("dwllr_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("dwllr_token", token);
  else localStorage.removeItem("dwllr_token");
}

export function getStoredToken() {
  return getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const incoming = options.headers as Record<string, string> | undefined;
  if (incoming) Object.assign(headers, incoming);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message || body.detail || res.statusText, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

function get<T>(path: string) {
  return request<T>(path);
}

function post<T>(path: string, body?: unknown) {
  if (body === undefined) return request<T>(path, { method: "POST" });
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patch<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function del<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

async function upload<T>(path: string, files: File[], fieldName = "file"): Promise<T> {
  const token = getToken();
  const formData = new FormData();
  for (const file of files) formData.append(fieldName, file);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message || res.statusText, body);
  }

  return res.json();
}

export const api = { get, post, patch, del, upload, request };
