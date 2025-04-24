import { JWT } from "../types/AuthProvider";
import multipart_fields from "../types/multipart";
import multipart_files from "../types/multipart";

declare module "fastify" {
  export interface FastifyRequest {
    jwt: JWT;
    files_uploaded: multipart_files[];
    fields: multipart_fields[];
    is_valid_multipart: boolean;
  }
}
