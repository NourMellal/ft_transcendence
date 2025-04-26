import { Transform } from "node:stream";

export type multipart_files = {
  field_name: string;
  mime_type: string;
  field_file: Transform;
};

export type multipart_fields = {
  field_name: string;
  field_value: string;
};
