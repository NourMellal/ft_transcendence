import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { WebSocketServer } from "ws";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { DeleteNotification, GetAllNotification, GetPushNotificationTicket, GetUnreadNotification, GetUserActiveStatus, MarkNotificationAsRead, PokeFriend, PushNotificationHandler } from "../../controllers/microservices/notifications";
import { AuthCookieValidation, RequireUid } from "../schemas";

export const SetupWebSocketServer = function (fastify: FastifyInstance) {
  const Server = new WebSocketServer({
    server: fastify.server,
    path: discoveryDocument.Notifications.PushNotification.route,
  });
  Server.on("connection", PushNotificationHandler);
};

export async function NotificationRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(discoveryDocument.Notifications.GetPushNotificationTicket.route, AuthCookieValidation, GetPushNotificationTicket);
  fastify.get(discoveryDocument.Notifications.ListUnread.route, AuthCookieValidation, GetUnreadNotification);
  fastify.get(discoveryDocument.Notifications.ListAll.route, AuthCookieValidation, GetAllNotification);
  fastify.post(discoveryDocument.Notifications.MarkAsRead.route, RequireUid, MarkNotificationAsRead);
  fastify.post(discoveryDocument.Notifications.Delete.route, RequireUid, DeleteNotification);
  fastify.post(discoveryDocument.Notifications.PokeFriend.route, RequireUid, PokeFriend);
  fastify.get(discoveryDocument.Notifications.GetUserActiveStatus.route, RequireUid, GetUserActiveStatus);
}

