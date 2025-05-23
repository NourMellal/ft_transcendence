import { FastifyInstance } from "fastify";
import { discoveryDocument } from "../models/DiscoveryDocument";
import {
  IsDisplayNameAvailable,
  ListActiveConnection,
  LogOutCurrentUser,
  RemoveRefreshToken,
  SignInStandardUser,
  SignUpNewStandardUser,
} from "../controllers/Authenticator";
import { Verify2FACode } from "../controllers/Authenticator";
import { isRequestAuthorizedHook } from "../controllers/Common";
import { AuthCookieValidation, RequireState, RequireToken_id, RequireUsername } from "./schemas";


export async function AuthenticatorRoutes(fastify: FastifyInstance) {
  fastify.get(
    discoveryDocument.StandardAuthRoutes.CheckUserDisplayNameAvailableRoute
      .route,
    RequireUsername,
    IsDisplayNameAvailable
  );
  fastify.post(
    discoveryDocument.StandardAuthRoutes.SignUpUserRoute.route,
    SignUpNewStandardUser
  );
  fastify.post(
    discoveryDocument.StandardAuthRoutes.SignInUserRoute.route,
    SignInStandardUser
  );
  fastify.post(
    discoveryDocument.TwoFactorAuthRoutes.VerifyCode.route,
    RequireState,
    Verify2FACode
  );
}

export async function RefreshTokenManagementRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.RefreshTokenRoutes.ListActiveConnection.route,
    ListActiveConnection
  );
  fastify.post(
    discoveryDocument.RefreshTokenRoutes.RemoveAccess.route,
    RequireToken_id,
    RemoveRefreshToken
  )
  fastify.post(
    discoveryDocument.LogOutRoute.route,
    AuthCookieValidation,
    LogOutCurrentUser
  )
}
