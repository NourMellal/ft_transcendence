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

export enum RabbitMQUserManagerOp {
    CREATE = 1,
    UPDATE = 2,
    DELETE = 3,
    FETCH = 4
}

export type RabbitMQRequest = {
    op: RabbitMQUserManagerOp,
    message?: string
    id: string,
    JWT: JWT
};
export type RabbitMQResponse = {
    status: number,
    message: string
    req_id: string
};
