import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GetOAuthCode, AuthenticateUser } from "../controllers/OAuth";
import { discoveryDocument } from "../models/DiscoveryDocument";
import { OAuthCodeOpts } from "./schemas";

async function OAuthRoutes(fastify: FastifyInstance) {
  fastify.get(discoveryDocument.OAuthRoutes.OAuthStateRoute.route, GetOAuthCode);
  fastify.get(
    discoveryDocument.OAuthRoutes.OAuthRedirectRoute.route,
    OAuthCodeOpts,
    AuthenticateUser
  );
}

export default OAuthRoutes;
