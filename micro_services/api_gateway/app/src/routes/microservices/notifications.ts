import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { WebSocketServer } from "ws";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { DeleteNotification, GetAllNotification, GetPushNotificationTicket, GetUnreadNotification, MarkNotificationAsRead, PokeFriend, PushNotificationHandler } from "../../controllers/microservices/notifications";
import { AuthHeaderValidation } from "../../types/AuthProvider";

const EditNotificationOps = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        uid: { type: "string" }
      },
      required: ["uid"],
    },
    headers: AuthHeaderValidation.schema.headers,
  },
};

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
  fastify.get(discoveryDocument.Notifications.ListUnread.route, AuthHeaderValidation, GetUnreadNotification);
  fastify.get(discoveryDocument.Notifications.ListAll.route, AuthHeaderValidation, GetAllNotification);
  fastify.post(discoveryDocument.Notifications.MarkAsRead.route, EditNotificationOps, MarkNotificationAsRead);
  fastify.post(discoveryDocument.Notifications.Delete.route, EditNotificationOps, DeleteNotification);
  fastify.post(discoveryDocument.Notifications.PokeFriend.route, EditNotificationOps, PokeFriend);
}

