import { JWT } from "./AuthProvider";

export enum RabbitMQUserManagerOp {
    CREATE = 1,
    UPDATE = 2,
    DELETE = 3,
    FETCH = 4
}

export type RabbitMQRequest = {
    op: number,
    message?: string
    id: string
    JWT: JWT
};
export type RabbitMQResponse = {
    status: number,
    message: string
    req_id: string
};
