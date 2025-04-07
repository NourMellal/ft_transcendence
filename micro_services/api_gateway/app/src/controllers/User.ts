import { FastifyReply, FastifyRequest } from "fastify";
import AuthProvider from "../classes/AuthProvider";
import { RabbitMQRequest, RabbitMQUserManagerOp } from "../types/RabbitMQMessages";
import { JWT } from "../types/AuthProvider";
import rabbitmq from "../classes/RabbitMQ";

export const FetchUserInfo = async (request: FastifyRequest<{ Querystring: { uid: string } }>, reply: FastifyReply) => {
    try {
        reply.hijack();
        const { uid } = request.query;
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.FETCH,
            message: uid === 'me' ? request.jwt.sub : uid,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, reply);
    } catch (error) {
        console.log(`ERROR: FetchUserInfo(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
}