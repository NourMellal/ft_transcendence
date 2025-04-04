import {JWT} from '../classes/AuthProvider'

export type OAuthCodeQueryString = {
    state: string,
    code: string,
    scope: string
};

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