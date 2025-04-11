export type SignInStatesModel = {
    state: string,
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
