import { FastifyReply, FastifyRequest } from "fastify";
import rabbitmq from "../../classes/RabbitMQ";
import { RabbitMQLeaderboardOp, RabbitMQRequest } from "../../types/RabbitMQMessages";
import { GetUsernamesByUIDs } from "../Common";

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
        try {
            reply.raw.statusCode = response.status;
            reply.raw.setHeader("Content-Type", "application/json");
            if (!response.message)
                throw 'invalid response';
            const payload = JSON.parse(response.message) as any[];
            if (payload.length > 0) {
                const usernames = GetUsernamesByUIDs(payload.map(elem => elem.UID));
                payload.forEach(elem => elem.username = usernames.get(elem.UID));
            }
            reply.raw.end(JSON.stringify(payload));
        } catch (error) {
            console.log(`ListAllRank(): ${error}`);
            reply.raw.end('[]');
        }
    });
}

export const GetUserRank = async (
    request: FastifyRequest<{ Querystring: { uid: string } }>,
    reply: FastifyReply
) => {
    if (!request.query.uid)
        return reply.code(400).send('bad request');
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
        op: RabbitMQLeaderboardOp.LIST_USER_RANK,
        id: "",
        message: request.query.uid,
        JWT: request.jwt,
    };
    rabbitmq.sendToLeaderboardQueue(RabbitMQReq, (response) => {
        reply.raw.statusCode = response.status;
        reply.raw.setHeader("Content-Type", "application/json");
        reply.raw.end(response.message);
    });
}