import { JWT } from "./common";

export enum RabbitMQFriendsManagerOp {
    ADD_FRIEND = 1,
    ACCEPT_REQUEST,
    DENY_REQUEST,
    REMOVE_FRIEND,
    LIST_FRIENDS,
    LIST_REQUESTS,
}

export type RabbitMQRequest = {
    op: RabbitMQFriendsManagerOp,
    message?: string
    id: string,
    JWT: JWT
};

export type RabbitMQResponse = {
    op: RabbitMQFriendsManagerOp,
    status: number,
    message?: string
    req_id: string
};
