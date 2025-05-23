import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { discoveryDocument } from "../models/DiscoveryDocument";
import { Disable2FA, Enable2FA, Get2FAString } from "../controllers/2FA";
import { isRequestAuthorizedHook } from "../controllers/Common";
import { AuthCookieValidation } from "./schemas";

async function TwoFactorAuthRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.TwoFactorAuthRoutes.Get2FAString.route,
    AuthCookieValidation,
    Get2FAString
  );
  fastify.post(
    discoveryDocument.TwoFactorAuthRoutes.Enable2FA.route,
    AuthCookieValidation,
    Enable2FA
  );
  fastify.post(
    discoveryDocument.TwoFactorAuthRoutes.Disable2FA.route,
    AuthCookieValidation,
    Disable2FA
  );
}

export default TwoFactorAuthRoutes;
