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

export type MatchPartner = {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
};

export type Match = {
  id: number;
  compatibility_score: number | null;
  matched_at: string | null;
  partner: MatchPartner;
};
