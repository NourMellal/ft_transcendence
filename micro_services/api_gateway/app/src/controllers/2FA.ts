import { FastifyReply, FastifyRequest } from "fastify";
import { GetRandomString, isRequestAuthorizedHook } from "./Common";
import {
  state_expiree_sec,
  UserModel,
  users_table_name,
} from "../types/DbTables";
import db from "../classes/Databases";
import base32 from "base32-encode";
import { multipart_fields } from "../types/multipart";
import Totp from "../classes/TOTP";
import { discoverDocument } from "../models/DiscoveryDocument";


export const Enable2FA = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
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
    const code = Totp.generateTOTP(totp_key);
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
