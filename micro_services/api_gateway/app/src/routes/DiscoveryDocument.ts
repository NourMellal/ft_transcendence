import { FastifyInstance, FastifyReply } from "fastify";
import {
  discoveryDocument,
  discoveryDocumentSerialized,
} from "../models/DiscoveryDocument";

const GetDiscoveryDocument = async (request: any, reply: FastifyReply) => {
  reply.code(200).type("application/json").send(discoveryDocumentSerialized);
};

async function DiscoveryDocumentRoute(fastify: FastifyInstance) {
  fastify.get(discoveryDocument.discoveryDocumentRoute, GetDiscoveryDocument);
}

export default DiscoveryDocumentRoute;
