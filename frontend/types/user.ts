export type User = {
  id: number;
  cognito_sub: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type CupSize = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

export type Gender = "male" | "female" | "other";

export type Profile = {
  id: number;
  user_id: number;
  display_name: string;
  bio: string | null;
  age: number;
  gender: Gender;
  location: string | null;
  avatar_url: string | null;
  ar_avatar_id: number | null;
  cup_size: CupSize | null;
  personality: string | null;
  interests: string[] | null;
  preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type UpdateUserRequest = {
  email?: string;
  username?: string;
};

export type UpdateProfileRequest = {
  display_name?: string;
  bio?: string;
  age?: number;
  gender?: Gender;
  location?: string;
  cup_size?: CupSize;
  personality?: string;
  interests?: string[];
  preferences?: Record<string, unknown>;
};
