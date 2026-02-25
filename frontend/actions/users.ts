import { apiClient, apiUpload } from "./client";
import type {
  User,
  Profile,
  UpdateUserRequest,
  UpdateProfileRequest,
} from "../types/user";

export type {
  User,
  Profile,
  UpdateUserRequest,
  UpdateProfileRequest,
} from "../types/user";

// ---------- API 関数 ----------

/**
 * ユーザー情報取得
 * GET /api/v1/users/:id
 */
export async function getUser(id: number): Promise<User> {
  return apiClient<User>(`/api/v1/users/${id}`);
}

/**
 * ユーザー情報更新
 * PATCH /api/v1/users/:id
 */
export async function updateUser(
  id: number,
  body: UpdateUserRequest,
): Promise<User> {
  return apiClient<User>(`/api/v1/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * プロフィール取得
 * GET /api/v1/profiles/:id
 */
export async function getProfile(id: number): Promise<Profile> {
  return apiClient<Profile>(`/api/v1/profiles/${id}`);
}

/**
 * プロフィール更新
 * PATCH /api/v1/profiles/:id
 */
export async function updateProfile(
  id: number,
  body: UpdateProfileRequest,
): Promise<Profile> {
  return apiClient<Profile>(`/api/v1/profiles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * プロフィール画像アップロード
 * POST /api/v1/profiles/:id/avatar
 */
export async function uploadProfileAvatar(
  id: number,
  file: File,
): Promise<{ avatar_url: string }> {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiUpload<{ avatar_url: string }>(
    `/api/v1/profiles/${id}/avatar`,
    formData,
  );
}
