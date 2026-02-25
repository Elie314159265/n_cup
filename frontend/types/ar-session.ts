export type AiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ArSession = {
  id: number;
  conversation_id: number;
  session_token: string;
  environment_type: string;
  environment_data: Record<string, unknown> | null;
  ai_conversation_history: AiMessage[] | null;
  created_at: string;
  updated_at: string;
};

export type CreateArSessionRequest = {
  conversation_id: number;
  environment_type: string;
  environment_data?: Record<string, unknown>;
};

export type UpdateArSessionRequest = {
  environment_data?: Record<string, unknown>;
  ai_conversation_history?: AiMessage[];
};
