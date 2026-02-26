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

// Polly speech marks から取得する口形イベント
export type Viseme = {
  time: number;  // 音声開始からのミリ秒
  value: string; // "sil" | "a" | "e" | "i" | "o" | "u" | etc.
};

export type AiSpeechResponse = {
  audio_url: string;
  duration: number;
  visemes: Viseme[];
};

export type AiTranscribeResponse = {
  text: string;
  confidence: number;
};
