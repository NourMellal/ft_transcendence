import crypto from "crypto";
import { FastifyReply, FastifyRequest } from "fastify";
import { GetRandomString, isRequestAuthorizedHook } from "./Common";
import {
  state_expiree_sec,
  totp_states_table_name,
  TOTPStatesModel,
  UserModel,
  users_table_name,
} from "../types/DbTables";
import db from "../classes/Databases";
import base32 from "base32-encode";
import { multipart_fields } from "../types/multipart";
import { JWT } from "../types/AuthProvider";

function generateTOTP(keyString: string): string {
  const codeDigitsCount = 6;
  const timeStamp = Math.floor(Date.now() / (1000 * 30));
  var step = timeStamp.toString(16).toUpperCase();
  while (step.length < 16) step = "0" + step;
  const msg = Buffer.from(step, "hex");
  const key = Buffer.from(keyString);
  const Hmac = crypto.createHmac("sha256", key);
  Hmac.update(msg);
  const hash = Hmac.digest();
  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  const otp = binary % 10 ** codeDigitsCount;
  var result = otp.toString();
  while (result.length < codeDigitsCount) {
    result = "0" + result;
  }
  return result;
}

export const Enable2FA = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    await isRequestAuthorizedHook(request, reply);
  } catch (error) {
    return reply.send("request unauthorized");
  }
  {
    const query = db.persistent.prepare(
      `SELECT totp_key FROM '${users_table_name}' WHERE UID = ? ;`
    );
    const result = query.get(request.jwt.sub) as UserModel;
    if (result && result.totp_key !== null)
      return reply.code(401).send(`totp already enabled`);
  }
  {
    const keyPlain = GetRandomString(16);
    const query = db.persistent.prepare(
      `UPDATE '${users_table_name}' SET totp_key = ? WHERE UID = ? ;`
    );
    const result = query.run(keyPlain, request.jwt.sub);
    if (result.changes !== 1) return reply.code(500).send("database error");
    const keyBase32 = base32(Buffer.from(keyPlain), "RFC3548");
    const totp_uri = `otpauth://totp/ft_transcendence:${request.jwt.sub}?secret=${keyBase32}&issuer=ft_transcendence&algorithm=SHA256&digits=6&period=30`;
    return reply.code(200).send(totp_uri);
  }
};

export const Disable2FA = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    await isRequestAuthorizedHook(request, reply);
  } catch (error) {
    return reply.send("request unauthorized");
  }
  const requestCode: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "code"
  );
  if (!requestCode || requestCode.field_value.length !== 6)
    return reply.code(401).send("invalid totp_code");
  var totp_key: string;
  {
    const query = db.persistent.prepare(
      `SELECT totp_key FROM '${users_table_name}' WHERE UID = ? ;`
    );
    const result = query.get(request.jwt.sub) as UserModel;
    if (result === undefined || result.totp_key === null)
      return reply.code(401).send("totp not enabled");
    totp_key = result.totp_key as string;
  }
  {
    const code = generateTOTP(totp_key);
    if (code !== requestCode.field_value)
      return reply.code(401).send("invalid totp_code");
    const query = db.persistent.prepare(
      `UPDATE '${users_table_name}' SET totp_key = ? WHERE UID = ? ;`
    );
    const result = query.run(null, request.jwt.sub);
    if (result.changes !== 1) return reply.code(500).send("database error");
    return reply.code(200).send("totp disabled.");
  }
};

export const Verify2FACode = async (
  request: FastifyRequest<{ Querystring: { state: string } }>,
  reply: FastifyReply
) => {
  const query = db.transient.prepare(
    `SELECT * FROM '${totp_states_table_name}' WHERE state = ? ;`
  );
  const result = query.get(request.query.state) as TOTPStatesModel | undefined;
  if (!result) return reply.code(401).send("request unauthorized");
  const requestCode: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "code"
  );
  if (!requestCode || requestCode.field_value.length !== 6)
    return reply.code(401).send("invalid totp_code");
  const code = generateTOTP(result.totp_key);
  if (code !== requestCode.field_value)
    return reply.code(401).send("invalid totp_code");
  {
    const query = db.transient.prepare(
      `DELETE FROM '${totp_states_table_name}' WHERE state = ? ;`
    );
    const result = query.run(request.query.state);
    if (result.changes !== 1)
      console.log(
        `Verify2FACode(): database error can't remove state=${request.query.state}`
      );
  }
  if (Date.now() / 1000 - result.created > state_expiree_sec)
    return reply.code(401).send("request expired");
  const jwt = JSON.parse(
    Buffer.from(result.jwt_token.split(".")[1], "base64url").toString()
  ) as JWT;
  const expiresDate = new Date(jwt.exp * 1000).toUTCString();
  reply.headers({
    "set-cookie": `jwt=${result.jwt_token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly`,
  });
  return reply.code(200).send(result.jwt_token);
};
