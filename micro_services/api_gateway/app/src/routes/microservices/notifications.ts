import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { WebSocketServer } from "ws";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { GetPushNotificationTicket, PushNotificationHandler } from "../../controllers/microservices/notifications";
import { AuthHeaderValidation } from "../../types/AuthProvider";

export const SetupWebSocketServer = function (fastify: FastifyInstance) {
  const Server = new WebSocketServer({
    server: fastify.server,
    path: discoveryDocument.Notifications.PushNotification.route,
  });
  Server.on("connection", PushNotificationHandler);
};

export async function NotificationRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(discoveryDocument.Notifications.GetPushNotificationTicket.route, AuthHeaderValidation, GetPushNotificationTicket);
}

