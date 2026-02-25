const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  // 設計書に従い IdToken を Authorization ヘッダーで送信する
  return localStorage.getItem("id_token");
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body);
  }

  // 204 No Content の場合は空を返す
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * multipart/form-data でファイルをアップロードする場合に使用
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body);
  }

  return response.json() as Promise<T>;
}
