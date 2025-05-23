import { FastifyReply, FastifyRequest } from "fastify";
import { RabbitMQResponse } from "../types/RabbitMQMessages";
import { JWT } from "../types/AuthProvider";
import db from "../classes/Databases";
import {
  refresh_token_table_name,
  state_expiree_sec,
  UserModel,
  users_table_name,
} from "../types/DbTables";
import AuthProvider from "../classes/AuthProvider";
import { discoveryDocument } from "../models/DiscoveryDocument";
import Totp from "../classes/TOTP";

export type SignPayload = {
  status: string;
  decoded: JWT;
  token: string;
};

export const CreateRefreshToken = function (UID: string, IP: string): string {
  const token = GetRandomString(30);
  const query = db.persistent.prepare(
    `INSERT INTO '${refresh_token_table_name}' ( token_id , token , created , ip , UID ) VALUES( ? , ? , ? , ? , ? );`
  );
  const result = query.run(
    crypto.randomUUID(),
    token,
    Date.now() / 1000,
    IP,
    UID
  );
  if (result.changes !== 1) throw "CreateRefreshToken(): database error";
  return token;
};

export const ProcessSignUpResponse = function (
  reply: FastifyReply,
  response: RabbitMQResponse,
  jwt: JWT,
  jwt_token: string,
  ip: string
) {
  try {
    reply.raw.statusCode = response.status;
    const refresh_token = CreateRefreshToken(jwt.sub, ip);
    const expiresDate = new Date(jwt.exp * 1000).toUTCString();
    reply.raw.appendHeader(
      "set-cookie",
      `jwt=${jwt_token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly`
    );
    reply.raw.appendHeader(
      "set-cookie",
      `refresh_token=${refresh_token}; Path=/; Expires=${new Date(
        2100,
        0
      ).toUTCString()}; Secure; HttpOnly`
    );
    reply.raw.appendHeader("Location", `${discoveryDocument.ServerUrl}/signin`);
    reply.raw.statusCode = 301;
    reply.raw.end();
  } catch (error) {
    console.log(error);
    reply.raw.statusCode = 500;
    reply.raw.end("internal server error");
  }
};

export const isRequestAuthorizedHook = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    if (!AuthProvider.isReady) throw `OAuth class not ready`;
    if (!request.headers.cookie) throw `jwt cookie null`;
    const verification = AuthProvider.ValidateJWT_Cookie(
      request.headers.cookie
    );
    if (typeof verification === "string")
      request.jwt = AuthProvider.RefreshJwtToken(verification, reply);
    else
      request.jwt = verification;
  } catch (error) {
    console.log(`ERROR: isRequestAuthorizedHook(): ${error}`);
    reply.code(401);
    return reply.send();
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
  Totp.states.set(state, {
    created: Date.now() / 1000,
    UID: uid,
    totp_key: totp_key,
    jwt_token: jwt_token,
  });
  setTimeout(() => Totp.states.delete(state), state_expiree_sec * 1000);
  return `${discoveryDocument.ServerUrl}/2fa/verify?state=${state}`;
};

export const GetUsernamesByUIDs = function (uids: string[]): Map<string, string> {
  let querystring = `SELECT UID, username FROM ${users_table_name} WHERE `;
  for (let i = 0; i < uids.length; i++) {
    querystring += 'UID = ? ';
    if (i < uids.length - 1)
      querystring += 'OR ';
  }
  querystring += ';';
  const query = db.persistent.prepare(querystring);
  const res = query.all(...uids) as UserModel[];
  return new Map(res.map(elem => [elem.UID, elem.username]));
}