import { FastifyReply, FastifyRequest } from "fastify";
import { RabbitMQResponse } from "../types/RabbitMQMessages";
import { JWT } from "../types/AuthProvider";
import db from "../classes/Databases";
import { users_table_name } from "../types/DbTables";
import AuthProvider from "../classes/AuthProvider";

export type SignPayload = {
    status: string,
    decoded: JWT
    token: string,
}

export const ProcessSignUpResponse = function (reply: FastifyReply, response: RabbitMQResponse, jwt: JWT, jwt_token: string) {
    reply.raw.statusCode = response.status;
    if (response.status !== 200) {
        reply.raw.end(response.message);
        const query = db.persistent.prepare(`DELETE FROM '${users_table_name}' WHERE UID = ? ;`);
        const res = query.run(jwt.sub);
        if (res.changes !== 1)
            console.log(`ProcessSignUpResponse(): WARNING: user uid=${jwt.sub} is not deleted from db!`);
        else
            console.log(`ProcessSignUpResponse(): user uid=${jwt.sub} is deleted!`);
        return;
    }
    reply.raw.setHeader('Content-Type', 'application/json');
    const expiresDate = new Date(jwt.exp * 1000).toUTCString();
    reply.raw.setHeader('Set-Cookie', `jwt=${jwt_token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly`);
    reply.raw.setHeader('access-control-allow-origin', '*');
    const payload: SignPayload = { status: 'New User Created.', decoded: jwt, token: jwt_token };
    reply.raw.end(reply.serialize(payload));
}

export const isRequestAuthorizedHook = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!AuthProvider.isReady)
            throw `OAuth class not ready`;
        request.jwt = AuthProvider.ValidateJWT_Cookie(request.headers.cookie as string);
    } catch (error) {
        console.log(`ERROR: isRequestAuthorizedHook(): ${error}`);
        reply.code(401);
        throw 'request unauthorized';
    }
}
