import { FastifyReply, FastifyRequest } from "fastify";
import rabbitmq from "../../classes/RabbitMQ";
import { RabbitMQLeaderboardOp, RabbitMQRequest } from "../../types/RabbitMQMessages";
import { UserModel, users_table_name } from "../../types/DbTables";
import db from "../../classes/Databases";

const decorateRankPayload = function (raw: string) {
    const payload = JSON.parse(raw) as any[];
    for (let i = 0; i < payload.length; i++) {
        const elem: any = payload[i];
        const query = db.persistent.prepare(`SELECT username FROM ${users_table_name} WHERE UID = ? ;`);
        {
            const res = query.all(elem.UID) as UserModel[];
            if (res.length > 0) {
                elem.username = res[0].username;
            }
        }
    }
    return JSON.stringify(payload);
}

export const ListAllRank = async (
    request: FastifyRequest<{ Querystring: { page: number } }>,
    reply: FastifyReply
) => {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
        op: RabbitMQLeaderboardOp.LIST_ALL_RANK,
        id: "",
        message: request.query.page.toString(),
        JWT: request.jwt,
    };
    rabbitmq.sendToLeaderboardQueue(RabbitMQReq, (response) => {
        reply.raw.statusCode = response.status;
        reply.raw.setHeader("Content-Type", "application/json");
        if (response.message)
            reply.raw.end(decorateRankPayload(response.message));
        else
            reply.raw.end();
    });
}

export const ListUserRank = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
        op: RabbitMQLeaderboardOp.LIST_USER_RANK,
        id: "",
        JWT: request.jwt,
    };
    rabbitmq.sendToLeaderboardQueue(RabbitMQReq, (response) => {
        reply.raw.statusCode = response.status;
        reply.raw.setHeader("Content-Type", "application/json");
        reply.raw.end(response.message);
    });
}