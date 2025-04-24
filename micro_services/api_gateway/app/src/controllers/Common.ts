import { FastifyReply, FastifyRequest } from "fastify";
import { RabbitMQResponse } from "../types/RabbitMQMessages";
import { JWT } from "../types/AuthProvider";
import db from "../classes/Databases";
import { refresh_token_table_name, RefreshTokenModel, users_table_name } from "../types/DbTables";
import AuthProvider from "../classes/AuthProvider";
import { discoverDocument } from "../models/DiscoveryDocument";
import Totp from "../classes/TOTP";

export type SignPayload = {
  status: string;
  decoded: JWT;
  token: string;
};

export const CreateRefreshToken = function (UID: string, IP: string): string {
  const token = GetRandomString(30);
  const query = db.persistent.prepare(`INSERT INTO '${refresh_token_table_name}' ( token_id , token , created , ip , UID ) VALUES( ? , ? , ? , ? , ? );`);
  const result = query.run(crypto.randomUUID(), token, Date.now() / 1000, IP, UID);
  if (result.changes !== 1)
    throw 'CreateRefreshToken(): database error';
  return token;
}

export const ProcessSignUpResponse = function (
  reply: FastifyReply,
  response: RabbitMQResponse,
  jwt: JWT,
  jwt_token: string,
  ip: string
) {
  reply.raw.statusCode = response.status;
  if (response.status !== 200) {
    reply.raw.end(response.message);
    const query = db.persistent.prepare(
      `DELETE FROM '${users_table_name}' WHERE UID = ? ;`
    );
    const res = query.run(jwt.sub);
    if (res.changes !== 1)
      console.log(
        `ProcessSignUpResponse(): WARNING: user uid=${jwt.sub} is not deleted from db!`
      );
    else
      console.log(`ProcessSignUpResponse(): user uid=${jwt.sub} is deleted!`);
    return;
  }
  try {
    const refresh_token = CreateRefreshToken(jwt.sub, ip);
    reply.raw.statusCode = 301;
    reply.raw.setHeader(
      "Location",
      `${discoverDocument.ServerUrl}/signin?token=${jwt_token}&refresh_token=${refresh_token}`
    );
    reply.raw.end();
  } catch (error) {
    console.log(error);
    reply.raw.statusCode = 500;
    reply.raw.end('internal server error');
  }
};

export const isRequestAuthorizedHook = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    if (!AuthProvider.isReady) throw `OAuth class not ready`;
    // request.jwt = AuthProvider.ValidateJWT_Cookie(request.headers.cookie as string);
    request.jwt = AuthProvider.ValidateJWT_AuthHeader(
      request.headers.authorization as string
    );
  } catch (error) {
    console.log(`ERROR: isRequestAuthorizedHook(): ${error}`);
    reply.code(401);
    throw "request unauthorized";
  }
};

export const GetRandomString = function (bytesCount: number): string {
  const randomValues = new Uint32Array(bytesCount);
  crypto.getRandomValues(randomValues);
  // Encode as UTF-8
  const utf8Encoder = new TextEncoder();
  const utf8Array = utf8Encoder.encode(
    String.fromCharCode.apply(null, Array.from(randomValues))
  );
  // Base64 encode the UTF-8 data
  return Buffer.from(utf8Array).toString("base64url");
};

export const GetTOTPRedirectionUrl = function (
  uid: string,
  jwt_token: string,
  totp_key: string
): string {
  const state = GetRandomString(8);
  if (Totp.states.has(state)) throw "GetTOTPRedirectionUrl(): Duplicate state";
  Totp.states.set(state, { created: Date.now() / 1000, UID: uid, totp_key: totp_key, jwt_token: jwt_token });
  return `${discoverDocument.ServerUrl}/2fa/verify?state=${state}`;
};
