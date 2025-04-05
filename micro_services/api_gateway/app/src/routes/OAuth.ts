import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { GetOAuthCode, AuthenticateUser } from '../controllers/OAuth'

const AuthCodeOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                state: { type: 'string' },
                code: { type: 'string' },
                scope: { type: 'string' }
            },
            required: ['state', 'code', 'scope']
        }
    }
};

const discoverDocument = {
    OAuthStateCodeRoute: '/OAuth/state',
    OAuthRedirectUrl: 'https://server.transcendence.fr/OAuth/code'
};

const discoverDocumentSerialized = JSON.stringify(discoverDocument);

const GetDiscoveryDocument = async (request: FastifyRequest, reply: FastifyReply) => {
    reply.code(200).send(discoverDocumentSerialized);
}

async function OAuthRoutes(fastify: FastifyInstance) {
    fastify.get(discoverDocument.OAuthStateCodeRoute, GetOAuthCode);
    fastify.get('/.well-known/discovery', GetDiscoveryDocument)
    fastify.get('/OAuth/code', AuthCodeOpts, AuthenticateUser);
}

export default OAuthRoutes;