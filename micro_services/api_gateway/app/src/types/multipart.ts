import { BusboyFileStream } from "@fastify/busboy"

export type multipart_files = {
        field_name: string,
        mime_type: string,
        field_file: BusboyFileStream
}

export type multipart_fields = {
        field_name: string,
        field_value: string
}

