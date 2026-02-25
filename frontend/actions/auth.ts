import { apiClient } from "./client";
import type {
  AuthUser,
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  RefreshResponse,
} from "../types/auth";

export type {
  AuthUser,
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  RefreshResponse,
} from "../types/auth";

// ---------- API 関数 ----------

/**
 * 新規ユーザー登録
 * POST /api/v1/auth/signup
 */
export async function signUp(body: SignUpRequest): Promise<SignUpResponse> {
  return apiClient<SignUpResponse>("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * ログイン
 * POST /api/v1/auth/signin
 */
export async function signIn(body: SignInRequest): Promise<SignInResponse> {
  return apiClient<SignInResponse>("/api/v1/auth/signin", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * ログアウト
 * POST /api/v1/auth/signout
 */
export async function signOut(): Promise<void> {
  return apiClient<void>("/api/v1/auth/signout", { method: "POST" });
}

/**
 * トークンリフレッシュ
 * POST /api/v1/auth/refresh
 */
export async function refreshToken(
  refreshToken: string,
): Promise<RefreshResponse> {
  return apiClient<RefreshResponse>("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

/**
 * 現在のユーザー情報取得
 * GET /api/v1/auth/me
 */
export async function getMe(): Promise<AuthUser> {
  return apiClient<AuthUser>("/api/v1/auth/me");
}
