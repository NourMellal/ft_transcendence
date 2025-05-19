import { FastifyReply, FastifyRequest } from "fastify";
import { RabbitMQMatchManagerOp, RabbitMQRequest } from "../../types/RabbitMQMessages";
import rabbitmq from "../../classes/RabbitMQ";
import { multipart_fields } from "../../types/multipart";

export const ListMatchHistory = async (
    request: FastifyRequest<{ Querystring: { uid: string, page: number } }>,
    reply: FastifyReply
) => {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
        op: RabbitMQMatchManagerOp.LIST_MATCHS,
        id: "",
        message: JSON.stringify({ UID: !request.query.uid ? request.jwt.sub : request.query.uid, page: request.query.page }),
        JWT: request.jwt,
    };
    rabbitmq.sendToMatchManagerQueue(RabbitMQReq, (response) => {
        reply.raw.statusCode = response.status;
        reply.raw.setHeader("Content-Type", "application/json");
        reply.raw.end(response.message);
    });
}

export const CreateNewMatch = async (
    request: FastifyRequest<{ Querystring: { match_type: string } }>,
    reply: FastifyReply
) => {
    if (!request.query.match_type)
        return reply.code(400).send('bad request');
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
        op: RabbitMQMatchManagerOp.CREATE_MATCH,
        id: "",
        message: request.query.match_type,
        JWT: request.jwt,
    };
    rabbitmq.sendToMatchManagerQueue(RabbitMQReq, (response) => {
        reply.raw.statusCode = response.status;
        reply.raw.setHeader("Content-Type", "application/json");
        reply.raw.end(response.message);
    });
}

export const WinMatch = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    if (!request.is_valid_multipart)
        return reply.code(400).send('bad request');
    const match_uid: multipart_fields | undefined = request.fields.find(
        (field: multipart_fields, i) => field.field_name === "match_uid"
    );
    if (!match_uid || !match_uid.field_value)
        return reply.code(400).send('bad request');
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
        op: RabbitMQMatchManagerOp.WIN_MATCH,
        id: "",
        message: match_uid.field_value,
        JWT: request.jwt,
    };
    rabbitmq.sendToMatchManagerQueue(RabbitMQReq, (response) => {
        reply.raw.statusCode = response.status;
        reply.raw.end(response.message);
    });
}

export const LoseMatch = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    if (!request.is_valid_multipart)
        return reply.code(400).send('bad request');
    const match_uid: multipart_fields | undefined = request.fields.find(
        (field: multipart_fields, i) => field.field_name === "match_uid"
    );
    if (!match_uid || !match_uid.field_value)
        return reply.code(400).send('bad request');
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
        op: RabbitMQMatchManagerOp.LOSE_MATCH,
        id: "",
        message: match_uid.field_value,
        JWT: request.jwt,
    };
    rabbitmq.sendToMatchManagerQueue(RabbitMQReq, (response) => {
        reply.raw.statusCode = response.status;
        reply.raw.end(response.message);
    });
}