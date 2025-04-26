export const refresh_token_table_name = "refresh_token";
export const users_table_name = "users";
export const state_expiree_sec = 60;


export enum UserRoles {
  SuperAdmin = 1,
  Admin = 2,
  User = 3,
}

export enum UserProviders {
  Google = 1,
  PASSWD = 2,
}

export type UserModel = {
  UID: string;
  username: string;
  password_hash?: string;
  totp_key?: string;
  totp_enabled: number;
  provider: UserProviders;
  role: UserRoles;
  google_access_token?: string;
  google_refresh_token?: string;
  ate?: number;
};

export type RefreshTokenModel = {
  token_id: string;
  UID: string;
  token: string;
  ip: string;
  created: number;
};