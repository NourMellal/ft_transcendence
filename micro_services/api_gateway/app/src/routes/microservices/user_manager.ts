import { FastifyInstance } from "fastify";
import {
  FetchUserInfo,
  RemoveUserProfile,
  SearchByUsername,
  UpdateUserInfo,
  UpdateUserPassword,
} from "../../controllers/microservices/user_manager";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { AuthCookieValidation, RequireUsername } from "../schemas";

async function UserManagerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.UserManagementRoutes.SearchByUsername.route,
    RequireUsername,
    SearchByUsername
  );
  fastify.get(
    discoveryDocument.UserManagementRoutes.FetchUserInfoRoute.route,
    AuthCookieValidation,
    FetchUserInfo
  );
  fastify.post(
    discoveryDocument.UserManagementRoutes.UpdateUserInfoRoute.route,
    AuthCookieValidation,
    UpdateUserInfo
  );
  fastify.post(
    discoveryDocument.UserManagementRoutes.UpdateUserPassword.route,
    AuthCookieValidation,
    UpdateUserPassword
  );
  fastify.delete(
    discoveryDocument.UserManagementRoutes.RemoveUserProfileRoute.route,
    AuthCookieValidation,
    RemoveUserProfile
  );
}

export default UserManagerRoutes;
