export type ArAvatar = {
  id: number;
  user_id: number;
  name: string;
  model_url: string;
  texture_url: string | null;
  animation_data: Record<string, unknown> | null;
  customization: Record<string, unknown> | null;
  voice_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateArAvatarRequest = {
  name: string;
  voice_id?: string;
  animation_data?: Record<string, unknown>;
  customization?: Record<string, unknown>;
};

export type UpdateArAvatarRequest = {
  name?: string;
  voice_id?: string;
  animation_data?: Record<string, unknown>;
  customization?: Record<string, unknown>;
};
