import { JWT } from "./AuthProvider";

export type OAuthCodeExchangeResponse = {
    access_token: string
    expires_in: number
    id_token: string
    scope: string
    token_type: string
    refresh_token?: string
};

export type OAuthResponse = {
    response:OAuthCodeExchangeResponse,
    jwt: JWT
}