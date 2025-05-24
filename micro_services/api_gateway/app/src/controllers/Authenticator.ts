import { FastifyReply, FastifyRequest } from "fastify";
import {
  refresh_token_table_name,
  state_expiree_sec,
  UserModel,
  users_table_name,
} from "../types/DbTables";
import fs from "fs";
import { multipart_fields, multipart_files } from "../types/multipart";
import db from "../classes/Databases";
import crypto from "crypto";
import {
  RabbitMQRequest,
  RabbitMQUserManagerOp,
} from "../types/RabbitMQMessages";
import AuthProvider from "../classes/AuthProvider";
import rabbitmq from "../classes/RabbitMQ";
import {
  CreateRefreshToken,
  GetTOTPRedirectionUrl,
  ProcessSignUpResponse,
} from "./Common";
import Totp from "../classes/TOTP";
import JWTFactory from "../classes/JWTFactory";

export const IsDisplayNameAvailable = async (
  request: FastifyRequest<{ Querystring: { username: string } }>,
  reply: FastifyReply
) => {
  try {
    const { username } = request.query;
    if (username.length < 3) return reply.code(400).send();
    const query = db.persistent.prepare(
      `SELECT UID FROM '${users_table_name}' where username = ? ;`
    );
    const res = query.get(username) as UserModel;
    if (res === undefined) return reply.code(200).send();
    return reply.code(406).send(res.UID);
  } catch (error) {
    console.log(`ERROR: IsDisplayNameAvailable(): ${error}`);
    return reply.code(500).send("ERROR: internal error, try again later.");
  }
};

export const SignUpNewStandardUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.is_valid_multipart) return reply.code(400).send("bad request");
  const username: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "username"
  );
  const psswd: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "password"
  );
  const image: multipart_files | undefined = request.files_uploaded.find(
    (file: multipart_files) => file.field_name === "picture"
  );
  if (
    !username ||
    !psswd ||
    username.field_value.length < 3 ||
    psswd.field_value.length < 8
  )
    return reply
      .code(400)
      .send("Provide a valid username and a password more than 7 chars");
  if (image && image.mime_type !== "image/jpeg")
    return reply.code(400).send(`only image jpeg are allowed`);
  var NewUser: UserModel;
  try {
    const hasher = crypto.createHash("sha256");
    hasher.update(Buffer.from(psswd.field_value));
    db.persistent.exec('BEGIN TRANSACTION;')
    NewUser = db.CreateNewStandardUser(
      username.field_value,
      hasher.digest().toString()
    );
    var picture_url = process.env.DEFAULT_PROFILE_PATH as string;
    if (image) {
      picture_url = `/static/profile/${NewUser.UID}.jpg`;
      fs.writeFileSync(picture_url, image.field_file.read());
    }
  } catch (error) {
    db.persistent.exec('ROLLBACK;')
    console.log(`ERROR: SignUpNewStandardUser(): ${error}`);
    return reply.code(400).send("username already taken try another one.");
  }
  try {
    reply.hijack();
    const jwt = JWTFactory.CreateJWT(
      NewUser.UID,
      username.field_value,
      picture_url
    );
    const jwt_token = AuthProvider.jwtFactory.SignJWT(jwt);
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQUserManagerOp.CREATE_STANDARD,
      id: "",
      JWT: jwt,
    };
    rabbitmq.sendToQueue(rabbitmq.user_manager_queue, RabbitMQReq, (response) => {
      if (response.status !== 200) {
        db.persistent.exec('ROLLBACK;')
        reply.raw.statusCode = response.status;
        reply.raw.end(response.message);
        return;
      }
      ProcessSignUpResponse(reply, response, jwt, jwt_token, request.ip);
      db.persistent.exec('COMMIT;')
    });
    return Promise.resolve();
  } catch (error) {
    db.persistent.exec('ROLLBACK;')
    if (image && fs.existsSync(picture_url))
      fs.unlinkSync(picture_url);
    console.log(`ERROR: SignUpNewStandardUser(): ${error}`);
    reply.raw.statusCode = 500;
    return reply.raw.end("ERROR: internal error, try again later.");
  }
};

export const SignInStandardUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.is_valid_multipart) return reply.code(400).send("bad request");
  const username: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "username"
  );
  const psswd: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "password"
  );
  if (
    !username ||
    !psswd ||
    username.field_value.length < 3 ||
    psswd.field_value.length < 8
  )
    return reply
      .code(400)
      .send("Provide a valid username and a password more than 7 chars");
  try {
    const hasher = crypto.createHash("sha256");
    hasher.update(Buffer.from(psswd.field_value));
    const query = db.persistent.prepare(
      `SELECT * from '${users_table_name}' WHERE username = ? AND password_hash = ? ;`
    );
    const res = query.get(
      username.field_value,
      hasher.digest().toString()
    ) as UserModel;
    if (res) {
      const jwt = JWTFactory.CreateJWT(res.UID, res.username);
      const jwt_token = AuthProvider.jwtFactory.SignJWT(jwt);
      if (res.totp_key && res.totp_enabled === 1) {
        try {
          const redirectUrl = GetTOTPRedirectionUrl(
            res.UID,
            jwt_token,
            res.totp_key
          );
          return reply.code(301).redirect(redirectUrl);
        } catch (error) {
          return reply.code(500).send("internal error try again");
        }
      }
      const expiresDate = new Date(jwt.exp * 1000).toUTCString();
      const refresh_token = CreateRefreshToken(jwt.sub, request.ip);
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
      return reply.code(200).send();
    }
    return reply.code(401).send("invalid credentials");
  } catch (error) {
    console.log(`ERROR: SignInStandardUser(): ${error}`);
    return reply.code(500).send("internal server error please try again.");
  }
};

export const Verify2FACode = async (
  request: FastifyRequest<{ Querystring: { state: string } }>,
  reply: FastifyReply
) => {
  if (!request.is_valid_multipart) return reply.code(400).send("bad request");
  const state = Totp.states.get(request.query.state);
  if (!state) return reply.code(400).send("request unauthorized");
  if (Date.now() / 1000 - state.created > state_expiree_sec) {
    Totp.states.delete(request.query.state);
    return reply.code(400).send("request expired");
  }
  const requestCode: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "code"
  );
  if (!requestCode || requestCode.field_value.length !== 6)
    return reply.code(400).send("invalid totp_code");
  const code = Totp.generateTOTP(state.totp_key);
  if (code !== requestCode.field_value)
    return reply.code(400).send("invalid totp_code");
  try {
    const refresh_token = CreateRefreshToken(state.UID, request.ip);
    Totp.states.delete(request.query.state);
    const jwt = JWTFactory.ParseJwt(state.jwt_token);
    const expiresDate = new Date(jwt.exp * 1000).toUTCString();
    reply.raw.appendHeader(
      "set-cookie",
      `jwt=${state.jwt_token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly`
    );
    reply.raw.appendHeader(
      "set-cookie",
      `refresh_token=${refresh_token}; Path=/; Expires=${new Date(
        2100,
        0
      ).toUTCString()}; Secure; HttpOnly`
    );
    return reply.code(200).send();
  } catch (error) {
    console.log(error);
    return reply.code(500).redirect("internal server error");
  }
};

export const ListActiveConnection = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  type refresh_tokens = {
    token_id: string;
    ip: string;
    created: number;
  };
  const query = db.persistent.prepare(
    `SELECT token_id, ip, created FROM '${refresh_token_table_name}' WHERE UID = ? ;`
  );
  const res = query.all(request.jwt.sub) as refresh_tokens[];
  return reply.send(res);
};

export const RemoveRefreshToken = async (
  request: FastifyRequest<{ Querystring: { token_id: string } }>,
  reply: FastifyReply
) => {
  const query = db.persistent.prepare(
    `DELETE FROM '${refresh_token_table_name}' WHERE token_id = ? ;`
  );
  const res = query.run(request.query.token_id);
  if (res.changes === 1) return reply.code(200).send("token removed");
  return reply.code(400).send("bad request");
};

export const LogOutCurrentUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (request.headers.cookie) {
    const cookies = request.headers.cookie.split("; ");
    var refresh_token: string | undefined = undefined;
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split("=");
      if (cookie[0] !== "refresh_token") continue;
      if (cookie.length !== 2) return reply.code(400).send("bad request");
      refresh_token = cookie[1];
    }
    if (!refresh_token) return reply.code(400).send("bad request");
    const query = db.persistent.prepare(
      `DELETE FROM ${refresh_token_table_name} WHERE UID = ? AND token = ?`
    );
    const res = query.run(request.jwt.sub, refresh_token);
    // This check is unneccessary in case a user revoked all active session
    // if (res.changes !== 1) return reply.code(400).send("bad request");
  }
  reply.raw.appendHeader("set-cookie", `jwt=; Path=/; Secure; HttpOnly`);
  reply.raw.appendHeader(
    "set-cookie",
    `refresh_token=; Path=/; Secure; HttpOnly`
  );
  return reply.code(200).send();
};
