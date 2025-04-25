import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { WebSocketServer } from "ws";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { PushNotificationHandler } from "../../controllers/microservices/notifications";

export const SetupWebSocketServer = function (fastify: FastifyInstance) {
  const Server = new WebSocketServer({
    server: fastify.server,
    path: discoveryDocument.Notifications.PushNotification.route,
  });
  Server.on("connection", PushNotificationHandler);
};

export async function NotificationRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
}
