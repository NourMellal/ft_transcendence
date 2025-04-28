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
import { AuthHeaderValidation } from "../../types/AuthProvider";

const FriendRequestOpts = {
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

async function FriendsManagerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.FriendsRoutes.ListFriendsRoute.route,
    AuthHeaderValidation,
    ListFriends
  );
  fastify.get(
    discoveryDocument.FriendsRoutes.ListFriendsRequestsRoute.route,
    AuthHeaderValidation,
    ListRequests
  );
  fastify.get(
    discoveryDocument.FriendsRoutes.ListSentFriendsRequestsRoute.route,
    AuthHeaderValidation,
    ListSentRequests
  );
  fastify.post(
    discoveryDocument.FriendsRoutes.SendFriendRequestRoute.route,
    FriendRequestOpts,
    SendFriendRequest
  );
  fastify.post(
    discoveryDocument.FriendsRoutes.AcceptFriendRequestRoute.route,
    FriendRequestOpts,
    AcceptFriendRequest
  );
  fastify.post(
    discoveryDocument.FriendsRoutes.DenyFriendRequestRoute.route,
    FriendRequestOpts,
    DenyFriendRequest
  );
  fastify.post(
    discoveryDocument.FriendsRoutes.RemoveFriendRoute.route,
    FriendRequestOpts,
    RemoveFriend
  );
}

export default FriendsManagerRoutes;
