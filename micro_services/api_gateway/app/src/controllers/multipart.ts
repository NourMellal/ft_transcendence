import Busboy, { BusboyFileStream, BusboyHeaders } from "@fastify/busboy";
import { FastifyRequest } from "fastify";
import { multipart_fields, multipart_files } from "../types/multipart";

export const ParseMultipart = async (request: FastifyRequest, payload: NodeJS.ReadableStream) => {
    const bb = new Busboy({ limits: { parts: 25, fields: 20, files: 5, fileSize: 5 * 1024 * 1024 }, headers: request.headers as BusboyHeaders });
    request.fields = new Array<multipart_fields>;
    request.files_uploaded = new Array<multipart_files>;
    bb.on('field', (fieldname: string, fieldvalue: string, fieldnameTruncated: boolean, valueTruncated: boolean, transferEncoding: string, mimeType: string) => {
        request.fields.push({ field_name: fieldname, field_value: fieldvalue });
    });
    bb.on('file', (fieldname: string, stream: BusboyFileStream, filename: string, transferEncoding: string, mimeType: string) => {
        request.files_uploaded.push({ field_name: fieldname, mime_type: mimeType, field_file: stream });
    })
    bb.on('fieldsLimit', () => {
        throw 'multipart exceeded limits';
    });
    bb.on('filesLimit', () => {
        throw 'multipart exceeded limits';
    });
    bb.on('error', (error) => {
        console.log(`ERROR: ParseMultipart(): ${error}`);
        throw 'error parsing multipart';
    });
    payload.pipe(bb);
}

export default ParseMultipart;