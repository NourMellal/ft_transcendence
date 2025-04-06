import { FastifyInstance, FastifyReply } from 'fastify'
import { discoverDocumentSerialized } from '../models/DiscoveryDocument'

const GetDiscoveryDocument = async (request: any, reply: FastifyReply) => {
    reply.code(200).type('application/json').send(discoverDocumentSerialized);
}

async function DiscoveryDocumentRoute(fastify: FastifyInstance) {
    fastify.get('/.well-known/discovery', GetDiscoveryDocument)
}

export default DiscoveryDocumentRoute;