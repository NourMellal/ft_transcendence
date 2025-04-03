export type OAuthCodeQueryString = {
    state: string,
    code: string,
    scope: string
};

export type OAuthCodeExchangeResponse = {
    access_token: string
    expires_in: Number
    id_token: string
    scope: string
    token_type: string
    refresh_token?: string
};
