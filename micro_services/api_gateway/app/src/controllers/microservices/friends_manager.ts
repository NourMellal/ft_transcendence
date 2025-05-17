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
    let uids: string[] = [];
    let querystring = `SELECT UID, username FROM ${users_table_name} WHERE `;
    for (let i = 0; i < RequestsPayload.length; i++) {
      uids.push(RequestsPayload[i].from_uid);
      querystring += 'UID = ? ';
      if (i < RequestsPayload.length - 1)
        querystring += 'OR ';
    }
    querystring += ';';
    const query = db.persistent.prepare(querystring);
    const Users = query.all(...uids) as UserModel[];
    const UserNameMap = new Map(Users.map(item => [item.UID, item.username]));
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
  rabbitmq.sendToUserManagerQueue(RmqRequest, (RawResponse) => {
    try {
      const FriendsBioPictures = JSON.parse(RawResponse.message as string) as {
        UID: string;
        picture_url: string;
        bio: string;
      }[];
      if (FriendsBioPictures.length === 0)
        return reply.raw.end('[]');
      let uids: string[] = [];
      let querystring = `SELECT UID, username FROM ${users_table_name} WHERE `;
      for (let i = 0; i < FriendsBioPictures.length; i++) {
        uids.push(FriendsBioPictures[i].UID);
        querystring += 'UID = ? ';
        if (i < FriendsBioPictures.length - 1)
          querystring += 'OR ';
      }
      querystring += ';';
      const query = db.persistent.prepare(querystring);
      const Users = query.all(...uids) as {
        UID: string,
        username: string,
        active_status?: number
      }[];
      for (let i = 0; i < Users.length; i++) {
        const sockets = PushNotificationSocketsMap.get(Users[i].UID);
        if (sockets && sockets.length > 0)
          Users[i].active_status = 1;
        else
          Users[i].active_status = 0;
      }
      const InfoMap = new Map(Users.map(item => [item.UID, item]));
      const payload = FriendsBioPictures.map(extra_info => {
        return {
          ...extra_info,
          ...(InfoMap.get(extra_info.UID) || {})
        };
      });
      reply.raw.end(JSON.stringify(payload));
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
    rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
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
    rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
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
    rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
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
};
