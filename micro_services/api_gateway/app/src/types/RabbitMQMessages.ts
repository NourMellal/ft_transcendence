import { JWT } from "./AuthProvider";

export enum RabbitMQUserManagerOp {
    CREATE = 1,
    UPDATE = 2,
    DELETE = 3,
    FETCH = 4
}

export type UpdateUser = {
    display_name: string | null,
    picture_url: string | null,
    bio: string | null
};

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
