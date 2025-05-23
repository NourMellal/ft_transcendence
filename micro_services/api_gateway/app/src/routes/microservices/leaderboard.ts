import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { ListAllRank, GetUserRank } from "../../controllers/microservices/leaderboard";
import { AuthCookieValidation, RequirePage, RequireUid } from "../schemas";

async function LeaderboardRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.LeaderboardRoutes.ListAllRank.route,
    RequirePage,
    ListAllRank
  );
  fastify.get(
    discoveryDocument.LeaderboardRoutes.ListUserRank.route,
    AuthCookieValidation,
    GetUserRank
  );
}

export default LeaderboardRoutes;
