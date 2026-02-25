export type Conversation = {
  id: number;
  match_id: number;
  ar_session_id: string | null;
  status: "active" | "ended";
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageType =
  | "text"
  | "image"
  | "voice"
  | "ar_action"
  | "ai_response";

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  message_type: MessageType;
  content: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export type CreateConversationRequest = {
  match_id: number;
  type?: "ar_session" | "text";
};

export type SendMessageRequest = {
  message_type: MessageType;
  content?: string;
  metadata?: Record<string, unknown>;
};
