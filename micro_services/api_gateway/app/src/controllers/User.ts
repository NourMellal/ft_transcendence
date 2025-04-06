import { FastifyReply, FastifyRequest } from "fastify";
import AuthProvider from "../classes/AuthProvider";
import { RabbitMQRequest, RabbitMQUserManagerOp } from "../types/RabbitMQMessages";
import { JWT } from "../types/AuthProvider";
import rabbitmq from "../classes/RabbitMQ";

export const FetchUserInfo = async (request: FastifyRequest<{ Querystring: { uid: string } }>, reply: FastifyReply) => {
    var jwt: JWT;
    try {
        if (!AuthProvider.isReady)
            throw `OAuth class not ready`;
        jwt = AuthProvider.ValidateJWT_Header(request.headers.authorization as string);
    } catch (error) {
        console.log(`ERROR: FetchUserInfo(): ${error}`);
        reply.code(401).send('request unauthorized');
        return;
    }
    try {
        reply.hijack();
        const { uid } = request.query;
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.FETCH,
            message: uid === 'me' ? jwt.sub : uid,
            id: '',
            JWT: jwt
        };
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, reply);
    } catch (error) {
        console.log(`ERROR: FetchUserInfo(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
}