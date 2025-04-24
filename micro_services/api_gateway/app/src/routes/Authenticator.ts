import { FastifyInstance } from "fastify";
import { discoverDocument } from "../models/DiscoveryDocument";
import {
  IsDisplayNameAvailable,
  ListActiveConnection,
  RefreshToken,
  RemoveRefreshToken,
  SignInStandardUser,
  SignUpNewStandardUser,
} from "../controllers/Authenticator";
import { Verify2FACode } from "../controllers/Authenticator";
import { isRequestAuthorizedHook } from "../controllers/Common";

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
  },
};

export async function AuthenticatorRoutes(fastify: FastifyInstance) {
  fastify.get(
    discoverDocument.StandardAuthRoutes.CheckUserDisplayNameAvailableRoute
      .route,
    CheckDisplayNameOpts,
    IsDisplayNameAvailable
  );
  fastify.post(
    discoverDocument.StandardAuthRoutes.SignUpUserRoute.route,
    SignUpNewStandardUser
  );
  fastify.post(
    discoverDocument.StandardAuthRoutes.SignInUserRoute.route,
    SignInStandardUser
  );
  fastify.post(
    discoverDocument.TwoFactorAuthRoutes.VerifyCode.route,
    Verify2FAOpts,
    Verify2FACode
  );
  fastify.post(
    discoverDocument.RefreshTokenRoutes.RefreshJWT.route,
    RefreshToken
  );
}

export async function RefreshTokenManagementRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoverDocument.RefreshTokenRoutes.ListActiveConnection.route,
    ListActiveConnection
  );
  fastify.post(
    discoverDocument.RefreshTokenRoutes.RemoveAccess.route,
    RemoveRefreshTokenOpts,
    RemoveRefreshToken
  )
}
