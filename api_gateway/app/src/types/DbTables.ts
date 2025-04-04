export type SignInStatesModel = {
    state: string,
    created: number
};

export type UserModel = {
    UID: string,
    role: string,
    access_token: string,
    refresh_token: string,
    ate: number,
};
