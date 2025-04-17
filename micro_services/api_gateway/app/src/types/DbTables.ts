export const signin_state_table_name = 'signin_states';
export const totp_states_table_name = 'totp_states';
export const users_table_name = 'users';
export const state_expiree_sec = 60;

export type SignInStatesModel = {
    state: string,
    created: number
};

export type TOTPStatesModel = {
    state: string,
    UID: string,
    jwt_token: string,
    created: number
};

export enum UserRoles {
    SuperAdmin = 1,
    Admin = 2,
    User = 3
};

export enum UserProviders {
    Google = 1,
    PASSWD = 2,
};

export type UserModel = {
    UID: string,
    username: string,
    password_hash?: string,
    provider: UserProviders,
    role: UserRoles,
    access_token?: string,
    refresh_token?: string,
    ate?: number,
};
