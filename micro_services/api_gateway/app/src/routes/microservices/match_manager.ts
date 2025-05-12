import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { AuthHeaderValidation } from "../../types/AuthProvider";
import { CreateNewMatch, ListMatchHistory, LoseMatch, WinMatch } from "../../controllers/microservices/match_manager";

const CreateNewMatchOpts = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        match_type: { type: "number" },
      },
      required: ["match_type"],
    },
    headers: AuthHeaderValidation.schema.headers,
  },
};

async function MatchManagerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.MatchManagerRoutes.ListMatchHistory.route,
    AuthHeaderValidation,
    ListMatchHistory
  );
  fastify.post(
    discoveryDocument.MatchManagerRoutes.CreateNewMatch.route,
    CreateNewMatchOpts,
    CreateNewMatch
  );
  fastify.post(
    discoveryDocument.MatchManagerRoutes.WinMatch.route,
    AuthHeaderValidation,
    WinMatch
  );
  fastify.post(
    discoveryDocument.MatchManagerRoutes.LoseMatch.route,
    AuthHeaderValidation,
    LoseMatch
  );
}

export default MatchManagerRoutes;
