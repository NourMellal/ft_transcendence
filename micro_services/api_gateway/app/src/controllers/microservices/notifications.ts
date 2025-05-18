import { FastifyReply, FastifyRequest } from "fastify";
import WebSocket from "ws";
import { GetRandomString, GetUsernamesByUIDs } from "../Common";
import {
  state_expiree_sec,
  UserModel,
  users_table_name,
} from "../../types/DbTables";
import {
  NotificationBody,
  NotificationsModel,
  RabbitMQFriendsManagerOp,
  RabbitMQNotificationsOp,
  RabbitMQRequest,
} from "../../types/RabbitMQMessages";
import rabbitmq from "../../classes/RabbitMQ";
import db from "../../classes/Databases";

export const PushNotificationSocketsMap = new Map<string, WebSocket[]>();
const PushNotificationStates = new Map<string, string>();

const decorateNotificationBody = function (notificationsRaw: string) {
  try {
    let payload: any[] = [];
    let notifications = JSON.parse(notificationsRaw) as NotificationsModel[];
    let uids: string[] = [];
    for (let i = 0; i < notifications.length; i++) {
      payload[i] = JSON.parse(notifications[i].messageJson);
      payload[i].notification_uid = notifications[i].UID;
      if (uids.indexOf(payload[i].from_uid) === -1)
        uids.push(payload[i].from_uid);
    }
    if (uids.length > 0) {
      const usernames = GetUsernamesByUIDs(uids);
      payload.forEach(
        (elem) => (elem.from_username = usernames.get(elem.from_uid)!)
      );
    }
    return JSON.stringify(payload);
  } catch (error) {
    console.log(`decorateNotificationBody(): ${error}`);
    return "[]";
  }
};

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
  try {
    let notification: any = JSON.parse(notificationRaw) as NotificationBody;
    const sockets = PushNotificationSocketsMap.get(notification.to_uid);
    console.log(`\t[INFO]: pingUser(): Ping Request for uid=${notification.to_uid}`);
    if (sockets && sockets.length > 0) {
      console.log(`\t[INFO]: pingUser(): Sending notification to uid=${notification.to_uid}`);
      const query = db.persistent.prepare(`SELECT username FROM ${users_table_name} WHERE UID = ? ;`);
      const res = query.all(notification.from_uid) as UserModel[];
      if (res.length === 0)
        throw `username for ${notification.from_uid} not found`;
      notification.from_username = res[0].username;
      const payload = JSON.stringify(notification);
      for (let i = 0; i < sockets.length; i++) {
        sockets[i].send(payload);
      }
    }
  } catch (error) {
    console.log(`\t[INFO]: pingUser(): ${error} | notificationRaw=${notificationRaw}`);
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
    reply.raw.setHeader("Content-Type", "application/json");
    if (response.message)
      reply.raw.end(decorateNotificationBody(response.message));
    else reply.raw.end("[]");
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
    reply.raw.setHeader("Content-Type", "application/json");
    if (response.message)
      reply.raw.end(decorateNotificationBody(response.message));
    else reply.raw.end("[]");
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

export const GetUserActiveStatus = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  const sockets = PushNotificationSocketsMap.get(request.query.uid);
  if (sockets && sockets.length > 0) {
    return reply.code(200).send("online");
  }
  return reply.code(404).send("offline");
};
