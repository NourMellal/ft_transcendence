import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { discoverDocument } from "../models/DiscoveryDocument";
import { Disable2FA, Enable2FA } from "../controllers/2FA";
import { AuthHeaderValidation } from "../types/AuthProvider";
import { isRequestAuthorizedHook } from "../controllers/Common";

async function TwoFactorAuthRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.post(
    discoverDocument.TwoFactorAuthRoutes.Enable2FA.route,
    AuthHeaderValidation,
    Enable2FA
  );
  fastify.post(
    discoverDocument.TwoFactorAuthRoutes.Disable2FA.route,
    AuthHeaderValidation,
    Disable2FA
  );
}

export default TwoFactorAuthRoutes;
