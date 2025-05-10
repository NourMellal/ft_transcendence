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
import { AuthHeaderValidation } from "../types/AuthProvider";

const CheckDisplayNameOpts = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        username: { type: "string" },
      },
      required: ["username"],
    },
  },
};

const Verify2FAOpts = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        state: { type: "string" },
      },
      required: ["state"],
    },
  },
};

const RemoveRefreshTokenOpts = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        token_id: { type: "string" },
      },
      required: ["token_id"],
    },
    headers: AuthHeaderValidation.schema.headers,
  },
};

export async function AuthenticatorRoutes(fastify: FastifyInstance) {
  fastify.get(
    discoveryDocument.StandardAuthRoutes.CheckUserDisplayNameAvailableRoute
      .route,
    CheckDisplayNameOpts,
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
    Verify2FAOpts,
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
    RemoveRefreshTokenOpts,
    RemoveRefreshToken
  )
  fastify.post(
    discoveryDocument.LogOutRoute.route,
    AuthHeaderValidation,
    LogOutCurrentUser
  )
}
