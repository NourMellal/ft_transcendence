import { FastifyInstance, FastifyReply } from "fastify";
import {
  discoverDocument,
  discoverDocumentSerialized,
} from "../models/DiscoveryDocument";

const GetDiscoveryDocument = async (request: any, reply: FastifyReply) => {
  reply.code(200).type("application/json").send(discoverDocumentSerialized);
};

async function DiscoveryDocumentRoute(fastify: FastifyInstance) {
  fastify.get(discoverDocument.DiscoverDocumentRoute, GetDiscoveryDocument);
}

export default DiscoveryDocumentRoute;
