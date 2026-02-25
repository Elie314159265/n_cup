import { apiClient } from "./client";
import type {
  ArSession,
  AiMessage,
  CreateArSessionRequest,
  UpdateArSessionRequest,
} from "../types/ar-session";

export type {
  ArSession,
  AiMessage,
  CreateArSessionRequest,
  UpdateArSessionRequest,
} from "../types/ar-session";

// ---------- API 関数 ----------

/**
 * ARセッション作成
 * POST /api/v1/ar_sessions
 */
export async function createArSession(
  body: CreateArSessionRequest,
): Promise<{ ar_session: ArSession }> {
  return apiClient<{ ar_session: ArSession }>("/api/v1/ar_sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * ARセッション情報取得
 * GET /api/v1/ar_sessions/:id
 */
export async function getArSession(
  id: number,
): Promise<{ ar_session: ArSession }> {
  return apiClient<{ ar_session: ArSession }>(`/api/v1/ar_sessions/${id}`);
}

/**
 * ARセッション更新
 * PATCH /api/v1/ar_sessions/:id
 */
export async function updateArSession(
  id: number,
  body: UpdateArSessionRequest,
): Promise<{ ar_session: ArSession }> {
  return apiClient<{ ar_session: ArSession }>(`/api/v1/ar_sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * ARセッション参加
 * POST /api/v1/ar_sessions/:id/join
 */
export async function joinArSession(
  id: number,
): Promise<{ ar_session: ArSession }> {
  return apiClient<{ ar_session: ArSession }>(
    `/api/v1/ar_sessions/${id}/join`,
    { method: "POST" },
  );
}

/**
 * ARセッション退出
 * POST /api/v1/ar_sessions/:id/leave
 */
export async function leaveArSession(id: number): Promise<void> {
  return apiClient<void>(`/api/v1/ar_sessions/${id}/leave`, {
    method: "POST",
  });
}
