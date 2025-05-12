import { FastifyReply, FastifyRequest } from "fastify";
import AuthProvider from "../../classes/AuthProvider";
import WebSocket from "ws";
import { GetRandomString } from "../Common";
import { state_expiree_sec } from "../../types/DbTables";
import {
  NotificationBody,
  RabbitMQFriendsManagerOp,
  RabbitMQNotificationsOp,
  RabbitMQRequest,
} from "../../types/RabbitMQMessages";
import rabbitmq from "../../classes/RabbitMQ";

const PushNotificationSocketsMap = new Map<string, WebSocket[]>();
const PushNotificationStates = new Map<string, string>();

const removeSocket = function (socket: WebSocket, uid: string) {
  const sockets = PushNotificationSocketsMap.get(uid);
  if (sockets) {
    const index = sockets.indexOf(socket);
    if (index !== -1) {
      sockets.splice(index, 1);
    }
    if (sockets.length === 0) {
      PushNotificationSocketsMap.delete(uid);
    }
  }
};

export const pingUser = function (notificationRaw: string) {
  const notification = JSON.parse(notificationRaw) as NotificationBody;
  console.log(`Ping Request for uid=${notification.to_uid}:`);
  const sockets = PushNotificationSocketsMap.get(notification.to_uid);
  if (sockets) {
    for (let i = 0; i < sockets.length; i++) {
      try {
        sockets[i].send(notificationRaw);
        console.log(
          `pinging uid=${notification.to_uid} on registred web socket.`
        );
      } catch (error) {
        console.log(`error pinging user uid=${notification.to_uid}: ${error}`);
      }
    }
  }
};

export const PushNotificationHandler = function (socket: WebSocket) {
  const uid = PushNotificationStates.get(socket.protocol);
  if (!uid) {
    socket.close(undefined, "request unauthorized");
    return;
  }
  PushNotificationStates.delete(socket.protocol);
  const sockets = PushNotificationSocketsMap.get(uid);
  if (sockets) sockets.push(socket);
  else PushNotificationSocketsMap.set(uid, [socket]);
  socket.on("close", () => removeSocket(socket, uid));
  socket.on("error", (ws: WebSocket, error: Error) => {
    removeSocket(socket, uid);
    console.log(`PushNotificationHandler(): socket error ${error}`);
    ws.close();
  });
  socket.on("message", (RawData: WebSocket.Data) => {
    socket.send(JSON.stringify({ type: "pong" }));
  });
};

export const GetPushNotificationTicket = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const state = GetRandomString(8);
  if (PushNotificationStates.has(state))
    return reply.code(500).send("Try Again");
  PushNotificationStates.set(state, request.jwt.sub);
  setTimeout(
    () => PushNotificationStates.delete(state),
    state_expiree_sec * 1000
  );
  return reply.code(200).send(state);
};

export const GetUnreadNotification = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  reply.hijack();
  const RabbitMQReq: RabbitMQRequest = {
    op: RabbitMQNotificationsOp.LIST_UNREAD,
    message: "",
    id: "",
    JWT: request.jwt,
  };
  rabbitmq.sendToNotificationQueue(RabbitMQReq, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};

export const GetAllNotification = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  reply.hijack();
  const RabbitMQReq: RabbitMQRequest = {
    op: RabbitMQNotificationsOp.LIST_ALL,
    message: "",
    id: "",
    JWT: request.jwt,
  };
  rabbitmq.sendToNotificationQueue(RabbitMQReq, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};

export const MarkNotificationAsRead = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  reply.hijack();
  const RabbitMQReq: RabbitMQRequest = {
    op: RabbitMQNotificationsOp.MARK_READ,
    message: request.query.uid,
    id: "",
    JWT: request.jwt,
  };
  rabbitmq.sendToNotificationQueue(RabbitMQReq, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};

export const DeleteNotification = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  reply.hijack();
  const RabbitMQReq: RabbitMQRequest = {
    op: RabbitMQNotificationsOp.DELETE,
    message: request.query.uid,
    id: "",
    JWT: request.jwt,
  };
  rabbitmq.sendToNotificationQueue(RabbitMQReq, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};

export const PokeFriend = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  reply.hijack();
  const RabbitMQReq: RabbitMQRequest = {
    op: RabbitMQFriendsManagerOp.POKE_FRIEND,
    message: request.query.uid,
    id: "",
    JWT: request.jwt,
  };
  rabbitmq.sendToFriendsManagerQueue(RabbitMQReq, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};
