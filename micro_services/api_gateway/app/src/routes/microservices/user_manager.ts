import { FastifyInstance } from "fastify";
import {
  FetchUserInfo,
  RemoveUserProfile,
  UpdateUserInfo,
  UpdateUserPassword,
} from "../../controllers/microservices/user_manager";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { AuthHeaderValidation } from "../../types/AuthProvider";

const GetUserInfoOpts = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        uid: { type: "string" },
        uname: { type: "string" },
      },
    },
    headers: AuthHeaderValidation.schema.headers,
  },
};

async function UserManagerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.UserManagementRoutes.FetchUserInfoRoute.route,
    GetUserInfoOpts,
    FetchUserInfo
  );
  fastify.post(
    discoveryDocument.UserManagementRoutes.UpdateUserInfoRoute.route,
    AuthHeaderValidation,
    UpdateUserInfo
  );
  fastify.post(
    discoveryDocument.UserManagementRoutes.UpdateUserPassword.route,
    AuthHeaderValidation,
    UpdateUserPassword
  );
  fastify.delete(
    discoveryDocument.UserManagementRoutes.RemoveUserProfileRoute.route,
    AuthHeaderValidation,
    RemoveUserProfile
  );
}

export default UserManagerRoutes;
