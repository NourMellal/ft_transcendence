import { FastifyReply, FastifyRequest } from "fastify";
import { RabbitMQRequest, RabbitMQUserManagerOp, UpdateUser } from "../types/RabbitMQMessages";
import rabbitmq from "../classes/RabbitMQ";
import multipart from '@fastify/multipart'
import fs from "fs";
import { pipeline } from "stream/promises";
import { discoverDocument } from "../models/DiscoveryDocument";

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

export const UpdateUserInfo = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const UpdatedInfo: UpdateUser = {
            display_name: null,
            bio: null,
            picture_url: null
        };
        var form_data = request.parts();
        for await (const part of form_data) {
            switch (part.fieldname) {
                case discoverDocument.UpdateUserInfoRoute.params[0].name:
                    if (part.type !== 'field')
                        return reply.code(400).send('bad request');
                    UpdatedInfo.display_name = part.value as string;
                    break;
                case discoverDocument.UpdateUserInfoRoute.params[1].name:
                    if (part.type !== 'field')
                        return reply.code(400).send('bad request');
                    UpdatedInfo.bio = part.value as string;
                    break;
                case discoverDocument.UpdateUserInfoRoute.params[2].name:
                    if (part.type !== 'file' || part.mimetype !== 'image/jpeg')
                        return reply.code(400).send('bad request');
                    UpdatedInfo.picture_url = `/static/${request.jwt.sub}.jpg`;
                    await pipeline(part.file, fs.createWriteStream(UpdatedInfo.picture_url));
                    break;
                default:
                    return reply.code(400).send('bad request');
            }
        }
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