import type { AiMessage } from "./ar-session";

export type AiChatRequest = {
  ar_session_id: string; // ARセッションの session_token (例: "sess_abc123")
  message: string;
  context?: {
    target_profile_id?: number;
    language?: string;
  };
};

export type AiChatResponse = {
  response: {
    text: string;
    emotion?: string;
    ar_action?: string;
    audio_url?: string;
    conversation_history: AiMessage[];
  };
};

export type AiSpeechRequest = {
  text: string;
  voice_id?: string;
  engine?: "standard" | "neural";
  language_code?: string;
};

export type AiSpeechResponse = {
  audio_url: string;
  duration: number;
};

export type AiTranscribeResponse = {
  text: string;
  confidence: number;
};
