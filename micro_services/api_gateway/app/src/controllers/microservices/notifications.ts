import { FastifyReply, FastifyRequest } from "fastify";
import AuthProvider from "../../classes/AuthProvider";
import WebSocket from "ws";
import { GetRandomString } from "../Common";
import { state_expiree_sec } from "../../types/DbTables";

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

export const pingUser = function (uid: string) {
  const sockets = PushNotificationSocketsMap.get(uid);
  if (sockets) {
    for (let i = 0; i < sockets.length; i++) {
      try {
        sockets[i].ping();
      } catch (error) {
        console.log(`error pinging user uid=${uid}: ${error}`);
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
};

export const GetPushNotificationTicket = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const state = GetRandomString(8);
  if (PushNotificationStates.has(state))
    return reply.code(500).send('Try Again');
  PushNotificationStates.set(state, request.jwt.sub);
  setTimeout(() => PushNotificationStates.delete(state), state_expiree_sec * 1000);
  return reply.code(200).send(state);
}