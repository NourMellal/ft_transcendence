import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { AuthHeaderValidation } from "../../types/AuthProvider";
import { ListAllRank, ListUserRank } from "../../controllers/microservices/leaderboard";


async function LeaderboardRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.LeaderboardRoutes.ListAllRank.route,
    AuthHeaderValidation,
    ListAllRank
  );
  fastify.get(
    discoveryDocument.LeaderboardRoutes.ListUserRank.route,
    AuthHeaderValidation,
    ListUserRank
  );
}

export default LeaderboardRoutes;
