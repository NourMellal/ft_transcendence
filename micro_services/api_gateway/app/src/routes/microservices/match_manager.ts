import { FastifyInstance } from "fastify";
import { isRequestAuthorizedHook } from "../../controllers/Common";
import { discoveryDocument } from "../../models/DiscoveryDocument";
import { CreateNewMatch, ListMatchHistory, LoseMatch, WinMatch } from "../../controllers/microservices/match_manager";
import { AuthCookieValidation, MatchHistoryOpts, RequireMatchType } from "../schemas";

async function MatchManagerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isRequestAuthorizedHook);
  fastify.get(
    discoveryDocument.MatchManagerRoutes.ListMatchHistory.route,
    MatchHistoryOpts,
    ListMatchHistory
  );
  fastify.post(
    discoveryDocument.MatchManagerRoutes.CreateNewMatch.route,
    RequireMatchType,
    CreateNewMatch
  );
  fastify.post(
    discoveryDocument.MatchManagerRoutes.WinMatch.route,
    AuthCookieValidation,
    WinMatch
  );
  fastify.post(
    discoveryDocument.MatchManagerRoutes.LoseMatch.route,
    AuthCookieValidation,
    LoseMatch
  );
}

export default MatchManagerRoutes;
