export type JWT = {
    iss: string,
    aud: string,
    sub: string,
    exp: number,
    iat: number,
    email?: string,
    name?: string,
    picture?: string
}