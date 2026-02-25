import type { Profile } from "./user";

export type DiscoverUser = {
  id: number;
  username: string;
  profile: Profile;
  compatibility_score?: number;
};

export type DiscoverQuery = {
  limit?: number;
  age_min?: number;
  age_max?: number;
  gender?: "male" | "female" | "other";
};

export type Like = {
  id: number;
  from_user_id: number;
  to_user_id: number;
  created_at: string;
  is_matched: boolean;
};

export type Match = {
  id: number;
  user_id_1: number;
  user_id_2: number;
  status: "pending" | "matched" | "rejected";
  matched_at: string | null;
  created_at: string;
  updated_at: string;
  matched_user: DiscoverUser;
};
