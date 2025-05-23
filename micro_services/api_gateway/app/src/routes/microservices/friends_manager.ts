import { FastifyInstance } from "fastify";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import {
  AcceptFriendRequest,
  DenyFriendRequest,
  ListFriends,
  ListRequests,
  ListSentRequests,
  RemoveFriend,
  SendFriendRequest,
} from "../../controllers/microservices/friends_manager";
import { AuthCookieValidation, RequireUid } from "../schemas";

async function FriendsManagerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.FriendsRoutes.ListFriendsRoute.route,
    AuthCookieValidation,
    ListFriends
  );
  fastify.get(
    discoveryDocument.FriendsRoutes.ListFriendsRequestsRoute.route,
    AuthCookieValidation,
    ListRequests
  );
  fastify.get(
    discoveryDocument.FriendsRoutes.ListSentFriendsRequestsRoute.route,
    AuthCookieValidation,
    ListSentRequests
  );
  fastify.post(
    discoveryDocument.FriendsRoutes.SendFriendRequestRoute.route,
    RequireUid,
    SendFriendRequest
  );
  fastify.post(
    discoveryDocument.FriendsRoutes.AcceptFriendRequestRoute.route,
    RequireUid,
    AcceptFriendRequest
  );
  fastify.post(
    discoveryDocument.FriendsRoutes.DenyFriendRequestRoute.route,
    RequireUid,
    DenyFriendRequest
  );
  fastify.post(
    discoveryDocument.FriendsRoutes.RemoveFriendRoute.route,
    RequireUid,
    RemoveFriend
  );
}

export default FriendsManagerRoutes;
