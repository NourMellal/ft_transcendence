import { FastifyReply, FastifyRequest } from "fastify";
import { GetRandomString } from "./Common";
import {
  UserModel,
  users_table_name,
} from "../types/DbTables";
import db from "../classes/Databases";
import base32 from "base32-encode";
import { multipart_fields } from "../types/multipart";
import Totp from "../classes/TOTP";
import { discoveryDocument } from "../models/DiscoveryDocument";


export const Get2FAString = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  {
    const query = db.persistent.prepare(
      `SELECT totp_key, totp_enabled FROM '${users_table_name}' WHERE UID = ? ;`
    );
    const result = query.get(request.jwt.sub) as UserModel;
    if (result && result.totp_enabled === 1)
      return reply.code(401).send(`totp already enabled`);
    if (result.totp_key && result.totp_key !== null) {
      const keyBase32 = base32(Buffer.from(result.totp_key), "RFC3548");
      const totp_uri = `otpauth://totp/ft_transcendence:${request.jwt.sub}?secret=${keyBase32}&issuer=ft_transcendence&algorithm=SHA256&digits=6&period=30`;
      return reply.code(200).send(totp_uri);
    }
  }
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

export const Enable2FA = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.is_valid_multipart) return reply.code(400).send("bad request");
  const requestCode: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "code"
  );
  if (!requestCode || requestCode.field_value.length !== 6)
    return reply.code(401).send("invalid totp_code");
  {
    const query = db.persistent.prepare(
      `SELECT totp_key, totp_enabled FROM '${users_table_name}' WHERE UID = ? ;`
    );
    const result = query.get(request.jwt.sub) as UserModel;
    if (result && result.totp_enabled === 1)
      return reply.code(401).send(`totp already enabled`);
    if (!result.totp_key || result.totp_key === null)
      return reply.code(401).send(`bad request`);
    const code = Totp.generateTOTP(result.totp_key);
    if (code !== requestCode.field_value)
      return reply.code(401).send("invalid totp_code");
  }
  {
    const query = db.persistent.prepare(
      `UPDATE '${users_table_name}' SET totp_enabled = ? WHERE UID = ? ;`
    );
    const result = query.run(1, request.jwt.sub);
    if (result.changes !== 1) return reply.code(500).send("database error");
    return reply.code(200).send('2FA TOTP enabled');
  }
};

export const Disable2FA = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.is_valid_multipart) return reply.code(400).send("bad request");
  const requestCode: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "code"
  );
  if (!requestCode || requestCode.field_value.length !== 6)
    return reply.code(401).send("invalid totp_code");
  var totp_key: string;
  {
    const query = db.persistent.prepare(
      `SELECT totp_key, totp_enabled FROM '${users_table_name}' WHERE UID = ? ;`
    );
    const result = query.get(request.jwt.sub) as UserModel;
    if (result === undefined || !result.totp_key || result.totp_enabled === 0)
      return reply.code(401).send("totp not enabled");
    totp_key = result.totp_key;
  }
  {
    const code = Totp.generateTOTP(totp_key);
    if (code !== requestCode.field_value)
      return reply.code(401).send("invalid totp_code");
    const query = db.persistent.prepare(
      `UPDATE '${users_table_name}' SET totp_key = ? , totp_enabled = ? WHERE UID = ? ;`
    );
    const result = query.run(null, 0, request.jwt.sub);
    if (result.changes !== 1) return reply.code(500).send("database error");
    return reply.code(200).send("totp disabled.");
  }
};
