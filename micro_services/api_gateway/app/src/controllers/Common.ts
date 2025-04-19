import { FastifyReply, FastifyRequest } from "fastify";
import { RabbitMQResponse } from "../types/RabbitMQMessages";
import { JWT } from "../types/AuthProvider";
import db from "../classes/Databases";
import { totp_states_table_name, users_table_name } from "../types/DbTables";
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
    // reply.raw.setHeader('Set-Cookie', `jwt=${jwt_token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly`);
    reply.raw.setHeader('access-control-allow-origin', '*');
    const payload: SignPayload = { status: 'New User Created.', decoded: jwt, token: jwt_token };
    reply.raw.end(reply.serialize(payload));
}

export const isRequestAuthorizedHook = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!AuthProvider.isReady)
            throw `OAuth class not ready`;
        // request.jwt = AuthProvider.ValidateJWT_Cookie(request.headers.cookie as string);
        request.jwt = AuthProvider.ValidateJWT_AuthHeader(request.headers.authorization as string);
    } catch (error) {
        console.log(`ERROR: isRequestAuthorizedHook(): ${error}`);
        reply.code(401);
        throw 'request unauthorized';
    }
}

export const GetRandomString = function (bytesCount: number): string {
    const randomValues = new Uint32Array(bytesCount);
    crypto.getRandomValues(randomValues);
    // Encode as UTF-8
    const utf8Encoder = new TextEncoder();
    const utf8Array = utf8Encoder.encode(
        String.fromCharCode.apply(null, Array.from(randomValues))
    );
    // Base64 encode the UTF-8 data
    return Buffer.from(utf8Array).toString('base64url');
}

export const GetTOTPRedirectionUrl = function (jwt_token: string, totp_key: string): string {
    const state = GetRandomString(4);
    const query = db.transient.prepare(`INSERT INTO '${totp_states_table_name}' ( 'state', 'totp_key', 'jwt_token', 'created'  ) VALUES ( ? , ? , ? , ? );`);
    const res = query.run(state, totp_key, jwt_token, Date.now() / 1000);
    if (res.changes !== 1)
        throw 'database error';
    return `${process.env.FRONTEND_URL}/2fa/verify?state=${state}`;
}