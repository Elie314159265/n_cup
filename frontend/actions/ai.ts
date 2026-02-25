import { apiClient, apiUpload } from "./client";
import type {
  AiChatRequest,
  AiChatResponse,
  AiSpeechRequest,
  AiSpeechResponse,
  AiTranscribeResponse,
} from "../types/ai";

export type {
  AiChatRequest,
  AiChatResponse,
  AiSpeechRequest,
  AiSpeechResponse,
  AiTranscribeResponse,
} from "../types/ai";

// ---------- API 関数 ----------

/**
 * AI会話リクエスト (Bedrock / Claude)
 * POST /api/v1/ai/chat
 */
export async function aiChat(body: AiChatRequest): Promise<AiChatResponse> {
  return apiClient<AiChatResponse>("/api/v1/ai/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * テキスト→音声変換 (Amazon Polly)
 * POST /api/v1/ai/speech
 */
export async function aiSpeech(
  body: AiSpeechRequest,
): Promise<AiSpeechResponse> {
  return apiClient<AiSpeechResponse>("/api/v1/ai/speech", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * 音声→テキスト変換 (Amazon Transcribe)
 * POST /api/v1/ai/transcribe  (multipart/form-data)
 */
export async function aiTranscribe(
  audioFile: File,
  language = "ja-JP",
): Promise<AiTranscribeResponse> {
  const formData = new FormData();
  formData.append("audio_file", audioFile);
  formData.append("language", language);
  return apiUpload<AiTranscribeResponse>("/api/v1/ai/transcribe", formData);
}
