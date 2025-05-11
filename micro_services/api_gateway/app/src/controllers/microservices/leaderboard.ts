import { FastifyReply, FastifyRequest } from "fastify";
import rabbitmq from "../../classes/RabbitMQ";
import { RabbitMQLeaderboardOp, RabbitMQRequest } from "../../types/RabbitMQMessages";

export const ListAllRank = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
        op: RabbitMQLeaderboardOp.LIST_ALL_RANK,
        id: "",
        JWT: request.jwt,
    };
    rabbitmq.sendToLeaderboardQueue(RabbitMQReq, (response) => {
        reply.raw.statusCode = response.status;
        reply.raw.setHeader("Content-Type", "application/json");
        reply.raw.end(response.message);
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