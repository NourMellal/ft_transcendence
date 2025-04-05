export enum RabbitMQUserManagerOp {
    CREATE = 1,
    UPDATE = 2,
    DELETE = 3,
    FETCH = 4
}

export type RabbitMQReq = {
    op: RabbitMQUserManagerOp,
    message: string
    id: string
};
export type RabbitMQRes = {
    status: number,
    message: string
    req_id: string
};
