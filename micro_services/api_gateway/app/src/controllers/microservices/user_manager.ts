import { FastifyReply, FastifyRequest } from "fastify";
import {
  RabbitMQRequest,
  RabbitMQUserManagerOp,
  UpdateUser,
} from "../../types/RabbitMQMessages";
import rabbitmq from "../../classes/RabbitMQ";
import fs from "fs";
import { multipart_fields, multipart_files } from "../../types/multipart";
import db from "../../classes/Databases";
import { UserModel, users_table_name } from "../../types/DbTables";
import crypto from "crypto";
import { escapeHtml } from "../Common";

export const FetchUserInfo = async (
  request: FastifyRequest<{ Querystring: { uid: string; uname: string } }>,
  reply: FastifyReply
) => {
  try {
    const { uid, uname } = request.query;
    if (!uid && !uname) return reply.code(400).send("bad request");
    var UID: string = '';
    if (uid) {
      if (uid === "me") UID = request.jwt.sub;
      else UID = uid;
    } else if (uname) {
      try {
        const query = db.persistent.prepare(
          `SELECT UID FROM '${users_table_name}' WHERE username = ? ;`
        );
        const res = query.get(uname) as UserModel;
        if (!res) throw "no user found";
        UID = res.UID;
      } catch (err) {
        return reply.code(404).send("user not found");
      }
    }
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQUserManagerOp.FETCH,
      message: UID,
      id: "",
      JWT: request.jwt,
    };
    reply.hijack();
    rabbitmq.sendToUserManagerQueue(RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      if (response.status !== 200 || response.message === undefined)
        return reply.raw.end(response.message);
      var payload = JSON.parse(response.message);
      const query = db.persistent.prepare(
        `SELECT username, totp_enabled FROM '${users_table_name}' WHERE UID = ? ;`
      );
      const res = query.get(UID) as UserModel;
      if (!res) {
        reply.raw.statusCode = 500;
        reply.raw.end("database error");
        return;
      }
      payload.username = res.username;
      if (UID === request.jwt.sub)
        payload.totp_enabled = res.totp_enabled;
      reply.raw.end(reply.serialize(payload));
    });
  } catch (error) {
    console.log(`ERROR: FetchUserInfo(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};

export const UpdateUserInfo = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.is_valid_multipart) return reply.code(400).send("bad request");
  try {
    const UpdatedInfo: UpdateUser = {
      bio: null,
      picture_url: null,
    };
    const username: multipart_fields | undefined = request.fields.find(
      (field: multipart_fields, i) => field.field_name === "username"
    );
    const bio: multipart_fields | undefined = request.fields.find(
      (field: multipart_fields, i) => field.field_name === "bio"
    );
    const image: multipart_files | undefined = request.files_uploaded.find(
      (file: multipart_files) => file.field_name === "picture"
    );
    if (image) {
      if (image.mime_type !== "image/jpeg")
        return reply.code(400).send(`only image jpeg are allowed`);
      UpdatedInfo.picture_url = `/static/profile/${request.jwt.sub}.jpg`;
      fs.writeFileSync(UpdatedInfo.picture_url, image.field_file.read());
    }
    if (bio) {
      UpdatedInfo.bio = bio.field_value;
    }
    if (
      username === undefined &&
      UpdatedInfo.bio === null &&
      UpdatedInfo.picture_url === null
    )
      return reply.code(400).send("bad request no field is supplied");
    if (username) {
      if (username.field_value.length < 3)
        return reply.code(400).send("bad request provide a valid username");
      try {
        const query = db.persistent.prepare(
          `UPDATE '${users_table_name}' SET username = ? WHERE UID = ? ;`
        );
        const res = query.run(escapeHtml(username.field_value), request.jwt.sub);
        if (res.changes !== 1) throw "UpdateUserInfo(): database error";
      } catch (error) {
        console.log(`ERROR: UpdateUserInfo(): query.run(): ${error}`);
        return reply.code(400).send("username is taken");
      }
    }
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQUserManagerOp.UPDATE,
      message: JSON.stringify(UpdatedInfo),
      id: "",
      JWT: request.jwt,
    };
    rabbitmq.sendToUserManagerQueue(RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      reply.raw.end(response.message);
    });
  } catch (error) {
    console.log(`ERROR: UpdateUserInfo(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};

export const UpdateUserPassword = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.is_valid_multipart) return reply.code(400).send("bad request");
  try {
    const new_password: multipart_fields | undefined = request.fields.find(
      (field: multipart_fields, i) => field.field_name === "new_password"
    );
    {
      if (!new_password || new_password.field_value.length < 8)
        return reply.code(401).send("provide valid credentials > 7 chars");
      const query = db.persistent.prepare(
        `SELECT password_hash FROM '${users_table_name}' WHERE UID = ? ;`
      );
      const result = query.get(request.jwt.sub) as UserModel;
      if (result && result.password_hash && result.password_hash != null) {
        const old_password: multipart_fields | undefined = request.fields.find(
          (field: multipart_fields, i) => field.field_name === "old_password"
        );
        if (!old_password || old_password.field_value.length < 8)
          return reply.code(401).send("provide valid credentials > 7 chars");
        const hasher = crypto.createHash("sha256");
        hasher.update(Buffer.from(old_password.field_value));
        if (hasher.digest().toString() !== result.password_hash)
          return reply.code(401).send("invalid old password");
      }
    }
    const hasher = crypto.createHash("sha256");
    hasher.update(Buffer.from(new_password.field_value));
    const query = db.persistent.prepare(
      `UPDATE '${users_table_name}' SET password_hash = ? WHERE UID = ? ;`
    );
    const result = query.run(hasher.digest().toString(), request.jwt.sub);
    if (result.changes !== 1) return reply.code(500).send("database error");
    return reply.code(200).send("password updated");
  } catch (error) {
    console.log(`ERROR: UpdateUserPassword(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
};

export const RemoveUserProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const UpdatedInfo: UpdateUser = {
      bio: null,
      picture_url: process.env.DEFAULT_PROFILE_PATH as string,
    };
    const picture_path = `/static/profile/${request.jwt.sub}.jpg`;
    if (fs.existsSync(picture_path)) fs.unlinkSync(picture_path);
    else return reply.status(403).send("Picture already removed.");
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQUserManagerOp.UPDATE,
      message: JSON.stringify(UpdatedInfo),
      id: "",
      JWT: request.jwt,
    };
    rabbitmq.sendToUserManagerQueue(RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      reply.raw.end(response.message);
    });
  } catch (error) {
    console.log(`ERROR: RemoveUserProfile(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};
