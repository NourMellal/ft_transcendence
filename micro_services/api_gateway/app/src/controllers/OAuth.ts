import { FastifyRequest, FastifyReply } from "fastify";
import db from "../classes/Databases";
import AuthProvider from "../classes/AuthProvider";
import {
  state_expiree_sec,
  UserModel,
  users_table_name,
} from "../types/DbTables";
import { OAuthCodeExchangeResponse, OAuthResponse } from "../types/OAuth";
import rabbitmq from "../classes/RabbitMQ";
import {
  RabbitMQRequest,
  RabbitMQUserManagerOp,
} from "../types/RabbitMQMessages";
import {
  CreateRefreshToken,
  GetRandomString,
  GetTOTPRedirectionUrl,
  ProcessSignUpResponse,
} from "./Common";
import { discoveryDocument } from "../models/DiscoveryDocument";

async function OAuthExchangeCode(code: string): Promise<OAuthResponse> {
  const reqOpt: RequestInit = {
    method: "POST",
    headers: {
      host: "oauth2.googleapis.com",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri:
        discoveryDocument.ServerUrl +
        discoveryDocument.OAuthRoutes.OAuthRedirectRoute.route,
      grant_type: "authorization_code",
    }),
  };
  const response = await fetch("https://oauth2.googleapis.com/token", reqOpt);
  if (!response.ok)
    throw "OAuthExchangeCode(): Response from google auth provider is not ok.";
  var responsejson = (await response.json()) as OAuthCodeExchangeResponse;
  var result: OAuthResponse = {} as OAuthResponse;
  result.response = responsejson;
  result.jwt = AuthProvider.ValidateJWT_Token(responsejson.id_token);
  return result;
}

function SignUpNewGoogleUser(OAuthRes: OAuthResponse, reply: FastifyReply, ip: string) {
  var NewUser: UserModel;
  try {
    NewUser = db.CreateNewGoogleUser(OAuthRes);
  } catch (error) {
    reply.raw.statusCode = 500;
    reply.raw.end("Database error.");
    return;
  }
  try {
    const msg: RabbitMQRequest = {
      op: RabbitMQUserManagerOp.CREATE_GOOGLE,
      id: "",
      JWT: OAuthRes.jwt,
    };
    rabbitmq.sendToUserManagerQueue(msg, (response) => {
      ProcessSignUpResponse(
        reply,
        response,
        OAuthRes.jwt,
        OAuthRes.response.id_token,
        ip
      );
    });
  } catch (error) {
    const query = db.persistent.prepare(
      `DELETE FROM '${users_table_name}' WHERE UID = ? ;`
    );
    query.run(NewUser.UID);
    console.log(`ERROR: SignUpNewGoogleUser(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
    return;
  }
}

export const AuthenticateUser = async (
  request: FastifyRequest<{
    Querystring: {
      state: string;
      code: string;
      scope: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    if (!AuthProvider.isReady) throw `OAuth class not ready`;
    const { state, code } = request.query;
    const created = AuthProvider.GoogleSignInStates.get(state);
    if (!created)
      throw `state_code=${state} is invalid.`;
    AuthProvider.GoogleSignInStates.delete(state);
    if (Date.now() / 1000 - created > state_expiree_sec)
      throw `state_code=${state} has been expired.`;
    var OAuthRes = await OAuthExchangeCode(code);
    const getUserQuery = db.persistent.prepare(
      `SELECT * FROM '${users_table_name}' WHERE UID = ?;`
    );
    const getUserResult = getUserQuery.get(OAuthRes.jwt.sub) as UserModel;
    if (getUserResult === undefined) {
      reply.hijack();
      SignUpNewGoogleUser(OAuthRes, reply, request.ip);
      return Promise.resolve();
    }
    if (getUserResult.totp_key && getUserResult.totp_key !== null) {
      try {
        const redirectUrl = GetTOTPRedirectionUrl(
          OAuthRes.jwt.sub,
          OAuthRes.response.id_token,
          getUserResult.totp_key
        );
        return reply.code(301).redirect(redirectUrl);
      } catch (error) {
        return reply.code(500).send("internal error try again");
      }
    }
    try {
      const refresh_token = CreateRefreshToken(OAuthRes.jwt.sub, request.ip);
      const expiresDate = new Date(OAuthRes.jwt.exp * 1000).toUTCString();
      reply.raw.appendHeader("set-cookie", `jwt=${OAuthRes.response.id_token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly`);
      reply.raw.appendHeader("set-cookie", `refresh_token=${refresh_token}; Path=/; Expires=${new Date(2100, 0).toUTCString()}; Secure; HttpOnly`);
      return reply.code(301).redirect(`${discoveryDocument.ServerUrl}/signin`);
    } catch (error) {
      return reply.code(500).send(`internal server error`);
    }
  } catch (error) {
    console.log(`ERROR: AuthenticateUser(): ${error}`);
    return reply.code(500).send(`Invalid credentials.`);
  }
};

export const GetOAuthCode = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    if (!AuthProvider.isReady) throw `OAuth class not ready`;
    var code = GetRandomString(8);
    const created = Date.now() / 1000;
    if (AuthProvider.GoogleSignInStates.has(code))
      throw `Duplicate OAuth state code`;
    AuthProvider.GoogleSignInStates.set(code, created);
    return reply.code(200).send(code);
  } catch (error) {
    console.log(`ERROR: GetOAuthCode(): ${error}`);
    return reply.code(500).send("ERROR: internal error, try again later.");
  }
};
