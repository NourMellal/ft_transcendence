import { FastifyReply, FastifyRequest } from "fastify";
import { RabbitMQRequest, RabbitMQUserManagerOp, UpdateUser } from "../types/RabbitMQMessages";
import rabbitmq from "../classes/RabbitMQ";
import fs from "fs";
import { pipeline } from "stream/promises";
import { discoverDocument } from "../models/DiscoveryDocument";
import Busboy, { BusboyHeaders } from "@fastify/busboy";
import { multipart_fields, multipart_files } from "../types/multipart";

export const FetchUserInfo = async (request: FastifyRequest<{ Querystring: { uid: string } }>, reply: FastifyReply) => {
    try {
        reply.hijack();
        const { uid } = request.query;
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.FETCH,
            message: uid === 'me' ? request.jwt.sub : uid,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, reply);
    } catch (error) {
        console.log(`ERROR: FetchUserInfo(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
}

export const IsDisplayNameAvailable = async (request: FastifyRequest<{ Querystring: { name: string } }>, reply: FastifyReply) => {
    try {
        reply.hijack();
        const { name } = request.query;
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.IsDisplayNameAvailable,
            message: name,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, reply);
    } catch (error) {
        console.log(`ERROR: FetchUserInfo(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
}

export const UpdateUserInfo = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const UpdatedInfo: UpdateUser = {
            display_name: null,
            bio: null,
            picture_url: null
        };
        const name: multipart_fields | undefined = request.fields.find((field: multipart_fields, i) => field.field_name === 'name');
        const bio: multipart_fields | undefined = request.fields.find((field: multipart_fields, i) => field.field_name === 'bio');
        const image: multipart_files | undefined = request.files_uploaded.find((file: multipart_files) => file.field_name === 'picture');
        if (image) {
            if (image.mime_type !== 'image/jpeg')
                return reply.code(400).send(`$got ${image.mime_type} only image jpeg are allowed`);
            UpdatedInfo.picture_url = `/static/profile/${request.jwt.sub}.jpg`;
            fs.writeFileSync(UpdatedInfo.picture_url, image.field_file.read());
        }
        if (name)
            UpdatedInfo.display_name = name.field_value;
        if (bio)
            UpdatedInfo.bio = bio.field_value;
        if (UpdatedInfo.display_name === null && UpdatedInfo.bio === null && UpdatedInfo.picture_url === null)
            return reply.code(400).send('bad request no field is supplied');
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.UPDATE,
            message: JSON.stringify(UpdatedInfo),
            id: '',
            JWT: request.jwt
        };
        reply.hijack();
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, reply);
    } catch (error) {
        console.log(`ERROR: FetchUserInfo(): ${error}`);
        reply.raw.statusCode = 500;
        return reply.raw.end("ERROR: internal error, try again later.");
    }
}

export const RemoveUserProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const UpdatedInfo: UpdateUser = {
            display_name: null,
            bio: null,
            picture_url: `/static/profile/default.jpg`
        };
        fs.unlinkSync(`/static/profile/${request.jwt.sub}.jpg`);
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.UPDATE,
            message: JSON.stringify(UpdatedInfo),
            id: '',
            JWT: request.jwt
        };
        reply.hijack();
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, reply);
    } catch (error) {
        console.log(`ERROR: RemoveUserProfile(): ${error}`);
        reply.raw.statusCode = 500;
        return reply.raw.end("ERROR: internal error, try again later.");
    }
}