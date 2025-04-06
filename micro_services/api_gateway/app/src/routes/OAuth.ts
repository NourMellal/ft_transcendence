import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { GetOAuthCode, AuthenticateUser } from '../controllers/OAuth'
import { discoverDocument } from '../models/DiscoveryDocument';

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

async function OAuthRoutes(fastify: FastifyInstance) {
    fastify.get(discoverDocument.OAuthStateCodeRoute.route, GetOAuthCode);
    fastify.get(discoverDocument.OAuthRedirectRoute.route, AuthCodeOpts, AuthenticateUser);
}

export default OAuthRoutes;