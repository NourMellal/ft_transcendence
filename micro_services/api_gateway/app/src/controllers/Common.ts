import { FastifyReply } from "fastify";
import { RabbitMQResponse } from "../types/RabbitMQMessages";
import { JWT } from "../types/AuthProvider";
import db from "../classes/Databases";

export const SendSignInResponse = function (reply: FastifyReply, response: RabbitMQResponse, jwt: JWT, jwt_token: string) {
    reply.raw.statusCode = response.status;
    if (response.status !== 200)
    {
        reply.raw.end(response.message);
        const query = db.persistent.prepare('DELETE FROM users WHERE UID = ? ;');
        query.run(jwt.sub);
        return;
    }
    reply.raw.setHeader('Content-Type', 'application/json');
    const expiresDate = new Date(jwt.exp * 1000).toUTCString();
    reply.raw.setHeader('Set-Cookie', `jwt=${jwt_token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly`);
    reply.raw.setHeader('access-control-allow-origin', '*');
    reply.raw.end(jwt_token);
}