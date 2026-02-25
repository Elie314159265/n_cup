import { apiClient } from "./client";
import type {
  Conversation,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
} from "../types/conversation";

export type {
  Conversation,
  Message,
  MessageType,
  CreateConversationRequest,
  SendMessageRequest,
} from "../types/conversation";

// ---------- API 関数 ----------

/**
 * 会話一覧取得
 * GET /api/v1/conversations
 */
export async function getConversations(): Promise<{
  conversations: Conversation[];
}> {
  return apiClient<{ conversations: Conversation[] }>("/api/v1/conversations");
}

/**
 * 会話開始
 * POST /api/v1/conversations
 */
export async function createConversation(
  body: CreateConversationRequest,
): Promise<{ conversation: Conversation }> {
  return apiClient<{ conversation: Conversation }>("/api/v1/conversations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * 会話詳細取得
 * GET /api/v1/conversations/:id
 */
export async function getConversation(
  id: number,
): Promise<{ conversation: Conversation }> {
  return apiClient<{ conversation: Conversation }>(
    `/api/v1/conversations/${id}`,
  );
}

/**
 * 会話終了
 * POST /api/v1/conversations/:id/end
 */
export async function endConversation(
  id: number,
): Promise<{ conversation: Conversation }> {
  return apiClient<{ conversation: Conversation }>(
    `/api/v1/conversations/${id}/end`,
    { method: "POST" },
  );
}

/**
 * メッセージ一覧取得
 * GET /api/v1/conversations/:id/messages
 */
export async function getMessages(
  conversationId: number,
): Promise<{ messages: Message[] }> {
  return apiClient<{ messages: Message[] }>(
    `/api/v1/conversations/${conversationId}/messages`,
  );
}

/**
 * メッセージ送信
 * POST /api/v1/conversations/:id/messages
 */
export async function sendMessage(
  conversationId: number,
  body: SendMessageRequest,
): Promise<{ message: Message }> {
  return apiClient<{ message: Message }>(
    `/api/v1/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/**
 * 既読にする
 * PATCH /api/v1/messages/:id/read
 */
export async function markMessageAsRead(
  messageId: number,
): Promise<{ message: Message }> {
  return apiClient<{ message: Message }>(`/api/v1/messages/${messageId}/read`, {
    method: "PATCH",
  });
}
