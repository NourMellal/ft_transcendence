import Busboy, { BusboyFileStream, BusboyHeaders } from "@fastify/busboy";
import { FastifyRequest } from "fastify";
import { multipart_fields, multipart_files } from "../types/multipart";
import { Transform } from "node:stream";

export const ParseMultipart = function (
  request: FastifyRequest,
  payload: NodeJS.ReadableStream,
  done: (err: any, ...args: any) => any
) {
  const bb = new Busboy({
    limits: { parts: 25, fields: 20, files: 5, fileSize: 5 * 1024 * 1024 },
    headers: request.headers as BusboyHeaders,
  });
  request.fields = new Array<multipart_fields>();
  request.files_uploaded = new Array<multipart_files>();
  bb.on(
    "field",
    (
      fieldname: string,
      fieldvalue: string,
      fieldnameTruncated: boolean,
      valueTruncated: boolean,
      transferEncoding: string,
      mimeType: string
    ) => {
      request.fields.push({ field_name: fieldname, field_value: fieldvalue });
    }
  );
  bb.on(
    "file",
    (
      fieldname: string,
      stream: BusboyFileStream,
      filename: string,
      transferEncoding: string,
      mimeType: string
    ) => {
      const file: multipart_files = {
        field_name: fieldname,
        mime_type: mimeType,
        field_file: new Transform(),
      };
      stream.on("data", (chunk) => file.field_file.push(chunk));
      stream.on("error", (err: Error) => {
        console.log(`ParseMultipart(): ${err}`);
        request.is_valid_multipart = false;
      });
      request.files_uploaded.push(file);
    }
  );
  bb.on("fieldsLimit", () => {
    request.is_valid_multipart = false;
  });
  bb.on("filesLimit", () => {
    request.is_valid_multipart = false;
  });
  bb.on("partsLimit", () => {
    request.is_valid_multipart = false;
  });
  bb.on("error", (error: Error) => {
    console.log(`ERROR: ParseMultipart(): ${error}`);
    request.is_valid_multipart = false;
    done(null);
  });
  bb.on("finish", () => {
    done(null);
  });
  request.is_valid_multipart = true;
  payload.pipe(bb);
};

export default ParseMultipart;
