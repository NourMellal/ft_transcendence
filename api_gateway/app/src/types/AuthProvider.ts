import { KeyObject } from "crypto"

export type JWT = {
    iss: string,
    aud: string,
    sub: string,
    exp: number,
    iat: number,
    email?: string,
    given_name?: string,
    picture?: string
}

export type JWTHeaders = {
    alg: string,
    kid: string,
    typ: string
}

export type JWTKeyCert = {
    keys: [{
        pkey: KeyObject,
        kid: string,
        n: string,
        e: string,
        alg: string
    }]
}