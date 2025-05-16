import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { AuthHeaderValidation } from "../../types/AuthProvider";
import { ListAllRank, ListUserRank } from "../../controllers/microservices/leaderboard";

const RankOpts = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        page: { type: "number" },
      },
      required: ["page"],
    },
    headers: AuthHeaderValidation.schema.headers,
  },
};

async function LeaderboardRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.LeaderboardRoutes.ListAllRank.route,
    RankOpts,
    ListAllRank
  );
  fastify.get(
    discoveryDocument.LeaderboardRoutes.ListUserRank.route,
    AuthHeaderValidation,
    ListUserRank
  );
}

export default LeaderboardRoutes;
