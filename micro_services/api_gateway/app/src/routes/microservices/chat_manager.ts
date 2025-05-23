import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { BlockUser, CheckBlocked, CreateConversation, ListBlocked, ListConversations, MarkConversationAsRead, ReadConversation, RenameConversation, SendMessageToConversation, UnBlockUser } from "../../controllers/microservices/chat_manager";
import { AuthCookieValidation, ReadConversationOpts, RequireUid } from "../schemas";

async function ChatManagerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.ChatManagerRoutes.ListConversations.route,
    AuthCookieValidation,
    ListConversations
  );
  fastify.get(
    discoveryDocument.ChatManagerRoutes.ReadConversation.route,
    ReadConversationOpts,
    ReadConversation
  );
  fastify.get(
    discoveryDocument.ChatManagerRoutes.ListBlocked.route,
    AuthCookieValidation,
    ListBlocked
  );
  fastify.get(
    discoveryDocument.ChatManagerRoutes.CheckBlock.route,
    RequireUid,
    CheckBlocked
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.CreateConversation.route,
    AuthCookieValidation,
    CreateConversation
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.RenameConversation.route,
    RequireUid,
    RenameConversation
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.SendMessageToConversation.route,
    RequireUid,
    SendMessageToConversation
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.BlockUser.route,
    RequireUid,
    BlockUser
  );
  fastify.post(
    discoveryDocument.ChatManagerRoutes.UnBlockUser.route,
    RequireUid,
    UnBlockUser
  );
    fastify.post(
    discoveryDocument.ChatManagerRoutes.MarkConversationAsRead.route,
    RequireUid,
    MarkConversationAsRead
  );
}

export default ChatManagerRoutes;
