export type AuthUser = {
  id: number;
  cognito_sub: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type SignUpRequest = {
  email: string;
  password: string;
  username: string;
};

export type SignUpResponse = {
  user: AuthUser;
  id_token: string;
  access_token: string;
  refresh_token: string;
};

export type SignInRequest = {
  email: string;
  password: string;
};

export type SignInResponse = {
  user: AuthUser;
  id_token: string;
  access_token: string;
  refresh_token: string;
};

export type RefreshResponse = {
  id_token: string;
  access_token: string;
};
