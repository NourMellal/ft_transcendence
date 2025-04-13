import { FastifyReply, FastifyRequest } from "fastify";
import { RabbitMQFriendsManagerOp, RabbitMQRequest } from "../../types/RabbitMQMessages";
import rabbitmq from "../../classes/RabbitMQ";
import { JWT } from "../../types/AuthProvider"
import db from "../../classes/Databases";

export const ListFriends = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        reply.hijack();
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQFriendsManagerOp.LIST_FRIENDS,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
            reply.raw.statusCode = response.status;
            reply.raw.setHeader('Content-Type', 'application/json');
            reply.raw.end(response.message);
        });
    } catch (error) {
        console.log(`ERROR: RemoveUserProfile(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
    return Promise.resolve();
}

export const ListRequests = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        reply.hijack();
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQFriendsManagerOp.LIST_REQUESTS,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
            reply.raw.statusCode = response.status;
            reply.raw.setHeader('Content-Type', 'application/json');
            reply.raw.end(response.message);
        });
    } catch (error) {
        console.log(`ERROR: RemoveUserProfile(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
    return Promise.resolve();
}

export const SendFriendRequest = async (request: FastifyRequest<{ Querystring: { uid: string } }>, reply: FastifyReply) => {
    if (!request.query.uid || request.query.uid === '' || request.query.uid === request.jwt.sub)
        return reply.code(400).send('bad request');
    // Check is uid valid user id:
    {
        const query = db.persistent.prepare('SELECT uid FROM users WHERE UID = ? ;');
        const res = query.get(request.query.uid);
        if (!res)
            return reply.code(400).send('bad request');
    }
    try {
        reply.hijack();
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQFriendsManagerOp.ADD_FRIEND,
            message: request.query.uid,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
            reply.raw.statusCode = response.status;
            reply.raw.end(response.message);
        });
    } catch (error) {
        console.log(`ERROR: RemoveUserProfile(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
    return Promise.resolve();
}

export const AcceptFriendRequest = async (request: FastifyRequest<{ Querystring: { uid: string } }>, reply: FastifyReply) => {
    if (!request.query.uid || request.query.uid === '')
        return reply.code(400).send('bad request');
    try {
        reply.hijack();
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQFriendsManagerOp.ACCEPT_REQUEST,
            message: request.query.uid,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
            reply.raw.statusCode = response.status;
            reply.raw.end(response.message);
        });
    } catch (error) {
        console.log(`ERROR: RemoveUserProfile(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
    return Promise.resolve();
}

export const DenyFriendRequest = async (request: FastifyRequest<{ Querystring: { uid: string } }>, reply: FastifyReply) => {
    if (!request.query.uid || request.query.uid === '')
        return reply.code(400).send('bad request');
    try {
        reply.hijack();
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQFriendsManagerOp.DENY_REQUEST,
            message: request.query.uid,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
            reply.raw.statusCode = response.status;
            reply.raw.end(response.message);
        });
    } catch (error) {
        console.log(`ERROR: RemoveUserProfile(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
    return Promise.resolve();
}

export const RemoveFriend = async (request: FastifyRequest<{ Querystring: { uid: string } }>, reply: FastifyReply) => {
    if (!request.query.uid || request.query.uid === '' || request.query.uid === request.jwt.sub)
        return reply.code(400).send('bad request');
    // Check is uid valid user id:
    {
        const query = db.persistent.prepare('SELECT uid FROM users WHERE UID = ? ;');
        const res = query.get(request.query.uid);
        if (!res)
            return reply.code(400).send('bad request');
    }
    try {
        reply.hijack();
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQFriendsManagerOp.REMOVE_FRIEND,
            message: request.query.uid,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
            reply.raw.statusCode = response.status;
            reply.raw.end(response.message);
        });
    } catch (error) {
        console.log(`ERROR: RemoveUserProfile(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
    return Promise.resolve();
}