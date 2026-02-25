import { apiClient } from "./client";
import type {
  DiscoverUser,
  DiscoverQuery,
  Like,
  Match,
} from "../types/matching";

export type {
  DiscoverUser,
  DiscoverQuery,
  Like,
  Match,
} from "../types/matching";

// ---------- API 関数 ----------

/**
 * マッチング候補取得
 * GET /api/v1/discover
 */
export async function getDiscover(
  query?: DiscoverQuery,
): Promise<{ users: DiscoverUser[] }> {
  const params = new URLSearchParams();
  if (query?.limit !== undefined) params.set("limit", String(query.limit));
  if (query?.age_min !== undefined)
    params.set("age_min", String(query.age_min));
  if (query?.age_max !== undefined)
    params.set("age_max", String(query.age_max));
  if (query?.gender) params.set("gender", query.gender);

  const qs = params.toString();
  return apiClient<{ users: DiscoverUser[] }>(
    `/api/v1/discover${qs ? `?${qs}` : ""}`,
  );
}

/**
 * いいねを送る
 * POST /api/v1/likes
 */
export async function sendLike(toUserId: number): Promise<{ like: Like }> {
  return apiClient<{ like: Like }>("/api/v1/likes", {
    method: "POST",
    body: JSON.stringify({ to_user_id: toUserId }),
  });
}

/**
 * 受け取ったいいね一覧
 * GET /api/v1/likes/received
 */
export async function getReceivedLikes(): Promise<{ likes: Like[] }> {
  return apiClient<{ likes: Like[] }>("/api/v1/likes/received");
}

/**
 * マッチング一覧取得
 * GET /api/v1/matches
 */
export async function getMatches(): Promise<{ matches: Match[] }> {
  return apiClient<{ matches: Match[] }>("/api/v1/matches");
}

/**
 * マッチング解除
 * DELETE /api/v1/matches/:id
 */
export async function deleteMatch(id: number): Promise<void> {
  return apiClient<void>(`/api/v1/matches/${id}`, { method: "DELETE" });
}
