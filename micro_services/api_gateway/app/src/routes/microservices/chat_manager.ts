import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { AuthHeaderValidation } from "../../types/AuthProvider";
import { BlockUser, CreateConversation, ListBlocked, ListConversations, MarkConversationAsRead, ReadConversation, RenameConversation, SendMessageToConversation, UnBlockUser } from "../../controllers/microservices/chat_manager";

const EditPostOpts = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        uid: { type: "string" },
      },
      required: ["uid"],
    },
    headers: AuthHeaderValidation.schema.headers,
  },
};

const ReadConversationOpts = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        uid: { type: "string" },
        page: { type: "number" },
      },
      required: ["uid", "page"],
    },
    headers: AuthHeaderValidation.schema.headers,
  },
};

async function ChatManagerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.ChatManagerRoutes.ListConversations.route,
    AuthHeaderValidation,
    ListConversations
  );
  fastify.get(
    discoveryDocument.ChatManagerRoutes.ReadConversation.route,
    ReadConversationOpts,
    ReadConversation
  );
  fastify.get(
    discoveryDocument.ChatManagerRoutes.ListBlocked.route,
    AuthHeaderValidation,
    ListBlocked
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.CreateConversation.route,
    AuthHeaderValidation,
    CreateConversation
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.RenameConversation.route,
    EditPostOpts,
    RenameConversation
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.SendMessageToConversation.route,
    EditPostOpts,
    SendMessageToConversation
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.BlockUser.route,
    EditPostOpts,
    BlockUser
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.UnBlockUser.route,
    EditPostOpts,
    UnBlockUser
  );
    fastify.post(
    discoveryDocument.ChatManagerRoutes.MarkConversationAsRead.route,
    EditPostOpts,
    MarkConversationAsRead
  );
}

export default ChatManagerRoutes;
