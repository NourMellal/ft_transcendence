import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { GetOAuthCode, AuthenticateUser } from '../controllers/OAuth'
import { discoverDocument } from '../models/DiscoveryDocument';
import AuthProvider from '../classes/AuthProvider';

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
    fastify.get(discoverDocument.OAuthRoutes.OAuthStateRoute.route, GetOAuthCode);
    fastify.get(discoverDocument.OAuthRoutes.OAuthRedirectRoute.route, AuthCodeOpts, AuthenticateUser);
}

export default OAuthRoutes;