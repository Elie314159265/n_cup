import { apiClient, apiUpload } from "./client";
import type {
  ArAvatar,
  CreateArAvatarRequest,
  UpdateArAvatarRequest,
} from "../types/ar-avatar";

export type {
  ArAvatar,
  CreateArAvatarRequest,
  UpdateArAvatarRequest,
} from "../types/ar-avatar";

// ---------- API 関数 ----------

/**
 * ARアバター一覧取得
 * GET /api/v1/ar_avatars
 */
export async function getArAvatars(): Promise<ArAvatar[]> {
  return apiClient<ArAvatar[]>("/api/v1/ar_avatars");
}

/**
 * ARアバター作成
 * POST /api/v1/ar_avatars
 */
export async function createArAvatar(
  body: CreateArAvatarRequest,
): Promise<ArAvatar> {
  return apiClient<ArAvatar>("/api/v1/ar_avatars", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * ARアバター詳細取得
 * GET /api/v1/ar_avatars/:id
 */
export async function getArAvatar(id: number): Promise<ArAvatar> {
  return apiClient<ArAvatar>(`/api/v1/ar_avatars/${id}`);
}

/**
 * ARアバター更新
 * PATCH /api/v1/ar_avatars/:id
 */
export async function updateArAvatar(
  id: number,
  body: UpdateArAvatarRequest,
): Promise<ArAvatar> {
  return apiClient<ArAvatar>(`/api/v1/ar_avatars/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * ARアバター削除
 * DELETE /api/v1/ar_avatars/:id
 */
export async function deleteArAvatar(id: number): Promise<void> {
  return apiClient<void>(`/api/v1/ar_avatars/${id}`, { method: "DELETE" });
}

/**
 * 3Dモデルアップロード
 * POST /api/v1/ar_avatars/:id/upload_model
 */
export async function uploadArAvatarModel(
  id: number,
  modelFile: File,
  textureFile?: File,
): Promise<ArAvatar> {
  const formData = new FormData();
  formData.append("model", modelFile);
  if (textureFile) {
    formData.append("texture", textureFile);
  }
  return apiUpload<ArAvatar>(`/api/v1/ar_avatars/${id}/upload_model`, formData);
}
