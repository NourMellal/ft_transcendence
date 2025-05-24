import { FastifyReply, FastifyRequest } from "fastify";
import {
  RabbitMQFriendsManagerOp,
  RabbitMQRequest,
  RabbitMQUserManagerOp,
} from "../../types/RabbitMQMessages";
import rabbitmq from "../../classes/RabbitMQ";
import db from "../../classes/Databases";
import { UserModel, users_table_name } from "../../types/DbTables";
import { JWT } from "../../types/AuthProvider";
import { PushNotificationSocketsMap } from "./notifications";
import { GetUsernamesByUIDs } from "../Common";

const decorateRequestsWithUsername = function (raw: string, reply: FastifyReply) {
  try {
    let RequestsPayload = JSON.parse(raw) as {
      REQ_ID: string;
      from_uid: string;
      to_uid: string;
      from_username?: string;
    }[];
    if (RequestsPayload.length === 0)
      return reply.raw.end('[]');
    const UserNameMap = GetUsernamesByUIDs(RequestsPayload.map(elem => elem.from_uid));
    RequestsPayload.forEach(element => element.from_username = UserNameMap.get(element.from_uid));
    reply.raw.end(JSON.stringify(RequestsPayload));
  } catch (error) {
    console.log(`decorateFriendListPayload(): ${error}`);
    reply.raw.statusCode = 400;
    reply.raw.end('bad request');
  }
}

const decorateFriendListPayload = function (raw: string, reply: FastifyReply) {
  reply.statusCode = 200;
  if (raw.length === 0)
    return reply.raw.end('[]');
  const RmqRequest: RabbitMQRequest = {
    id: '',
    op: RabbitMQUserManagerOp.FETCH_MULTIPLE_INTERNAL,
    message: raw,
    JWT: {} as JWT
  }
  rabbitmq.sendToQueue(rabbitmq.user_manager_queue, RmqRequest, (RawResponse) => {
    try {
      let FriendsInfo = JSON.parse(RawResponse.message as string) as {
        UID: string;
        picture_url: string;
        bio: string;
        username?: string;
        active_status?: number;
      }[];
      if (FriendsInfo.length === 0)
        return reply.raw.end('[]');
      const UserNames = GetUsernamesByUIDs(FriendsInfo.map(elem => elem.UID));
      for (let i = 0; i < FriendsInfo.length; i++) {
        FriendsInfo[i].username = UserNames.get(FriendsInfo[i].UID);
        const sockets = PushNotificationSocketsMap.get(FriendsInfo[i].UID);
        if (sockets && sockets.length > 0)
          FriendsInfo[i].active_status = 1;
        else
          FriendsInfo[i].active_status = 0;
      }
      reply.raw.end(JSON.stringify(FriendsInfo));
    } catch (error) {
      console.log(`decorateFriendListPayload(): ${error}`);
      reply.raw.statusCode = 400;
      reply.raw.end('bad request');
    }
  });
}

export const ListFriends = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQFriendsManagerOp.LIST_FRIENDS,
      id: "",
      JWT: request.jwt,
    };
    rabbitmq.sendToQueue(rabbitmq.friends_manager_queue, RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      reply.raw.setHeader("Content-Type", "application/json");
      if (response.status === 200 && response.message) {
        decorateFriendListPayload(response.message, reply);
        return Promise.resolve();
      }
      reply.raw.end('[]');
    });
  } catch (error) {
    console.log(`ERROR: RemoveUserProfile(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};

export const ListRequests = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQFriendsManagerOp.LIST_REQUESTS,
      id: "",
      JWT: request.jwt,
    };
    rabbitmq.sendToQueue(rabbitmq.friends_manager_queue, RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      reply.raw.setHeader("Content-Type", "application/json");
      if (response.status === 200 && response.message) {
        decorateRequestsWithUsername(response.message, reply);
        return Promise.resolve();
      }
      reply.raw.end('[]');
    });
  } catch (error) {
    console.log(`ERROR: RemoveUserProfile(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};

export const ListSentRequests = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQFriendsManagerOp.LIST_SENT_REQUESTS,
      id: "",
      JWT: request.jwt,
    };
    rabbitmq.sendToQueue(rabbitmq.friends_manager_queue, RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      reply.raw.setHeader("Content-Type", "application/json");
      if (response.status === 200 && response.message) {
        decorateRequestsWithUsername(response.message, reply);
        return Promise.resolve();
      }
      reply.raw.end('[]');
    });
  } catch (error) {
    console.log(`ERROR: RemoveUserProfile(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};

export const SendFriendRequest = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  if (
    !request.query.uid ||
    request.query.uid === "" ||
    request.query.uid === request.jwt.sub
  )
    return reply.code(400).send("bad request");
  // Check is uid valid user id:
  {
    const query = db.persistent.prepare(
      `SELECT uid FROM '${users_table_name}' WHERE UID = ? ;`
    );
    const res = query.get(request.query.uid);
    if (!res) return reply.code(400).send("bad request");
  }
  try {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQFriendsManagerOp.ADD_FRIEND,
      message: request.query.uid,
      id: "",
      JWT: request.jwt,
    };
    rabbitmq.sendToQueue(rabbitmq.friends_manager_queue, RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      reply.raw.end(response.message);
    });
  } catch (error) {
    console.log(`ERROR: RemoveUserProfile(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};

export const AcceptFriendRequest = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  if (!request.query.uid || request.query.uid === "")
    return reply.code(400).send("bad request");
  try {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQFriendsManagerOp.ACCEPT_REQUEST,
      message: request.query.uid,
      id: "",
      JWT: request.jwt,
    };
    rabbitmq.sendToQueue(rabbitmq.friends_manager_queue, RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      reply.raw.end(response.message);
    });
  } catch (error) {
    console.log(`ERROR: RemoveUserProfile(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};

export const DenyFriendRequest = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  if (!request.query.uid || request.query.uid === "")
    return reply.code(400).send("bad request");
  try {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQFriendsManagerOp.DENY_REQUEST,
      message: request.query.uid,
      id: "",
      JWT: request.jwt,
    };
    rabbitmq.sendToQueue(rabbitmq.friends_manager_queue, RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      reply.raw.end(response.message);
    });
  } catch (error) {
    console.log(`ERROR: RemoveUserProfile(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};

export const RemoveFriend = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  if (
    !request.query.uid ||
    request.query.uid === "" ||
    request.query.uid === request.jwt.sub
  )
    return reply.code(400).send("bad request");
  // Check is uid valid user id:
  {
    const query = db.persistent.prepare(
      `SELECT uid FROM '${users_table_name}' WHERE UID = ? ;`
    );
    const res = query.get(request.query.uid);
    if (!res) return reply.code(400).send("bad request");
  }
  try {
    reply.hijack();
    const RabbitMQReq: RabbitMQRequest = {
      op: RabbitMQFriendsManagerOp.REMOVE_FRIEND,
      message: request.query.uid,
      id: "",
      JWT: request.jwt,
    };
    rabbitmq.sendToQueue(rabbitmq.friends_manager_queue, RabbitMQReq, (response) => {
      reply.raw.statusCode = response.status;
      reply.raw.end(response.message);
    });
  } catch (error) {
    console.log(`ERROR: RemoveUserProfile(): ${error}`);
    reply.raw.statusCode = 500;
    reply.raw.end("ERROR: internal error, try again later.");
  }
  return Promise.resolve();
};
