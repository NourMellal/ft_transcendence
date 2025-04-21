import { JWT } from "./common";

export enum RabbitMQMicroServices {
    API_GATEWAY = 1,
    USER_MANAGER,
    FRIENDS_MANAGER,
    NOTIFICATIONS,
}

export enum RabbitMQNotificationsOp {
    SAVE_NOTIFICATION = 1,
    LIST_UNREAD,
    LIST_ALL,
    DELETE,
    PING_USER
}

export type RabbitMQRequest = {
    op: RabbitMQNotificationsOp,
    message?: string
    id: string,
    JWT: JWT
};

export type RabbitMQResponse = {
    op: RabbitMQNotificationsOp,
    status: number,
    message?: string
    req_id: string,
    service: RabbitMQMicroServices
};
