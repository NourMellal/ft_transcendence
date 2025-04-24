import { FastifyInstance } from "fastify";
import { discoverDocument } from "../../models/DiscoveryDocument";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import {
  AcceptFriendRequest,
  DenyFriendRequest,
  ListFriends,
  ListRequests,
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
    discoverDocument.FriendsRoutes.ListFriendsRoute.route,
    AuthHeaderValidation,
    ListFriends
  );
  fastify.get(
    discoverDocument.FriendsRoutes.ListFriendsRequestsRoute.route,
    AuthHeaderValidation,
    ListRequests
  );
  fastify.post(
    discoverDocument.FriendsRoutes.SendFriendRequestRoute.route,
    FriendRequestOpts,
    SendFriendRequest
  );
  fastify.post(
    discoverDocument.FriendsRoutes.AcceptFriendRequestRoute.route,
    FriendRequestOpts,
    AcceptFriendRequest
  );
  fastify.post(
    discoverDocument.FriendsRoutes.DenyFriendRequestRoute.route,
    FriendRequestOpts,
    DenyFriendRequest
  );
  fastify.post(
    discoverDocument.FriendsRoutes.RemoveFriendRoute.route,
    FriendRequestOpts,
    RemoveFriend
  );
}

export default FriendsManagerRoutes;
