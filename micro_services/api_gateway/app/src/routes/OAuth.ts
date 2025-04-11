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

export const isRequestAuthorizedHook = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!AuthProvider.isReady)
            throw `OAuth class not ready`;
        console.log('cookie: ' + request.headers.cookie as string);
        request.jwt = AuthProvider.ValidateJWT_Cookie(request.headers.cookie as string);
    } catch (error) {
        console.log(`ERROR: isRequestAuthorizedHook(): ${error}`);
        reply.code(401);
        throw 'request unauthorized';
    }
}

async function OAuthRoutes(fastify: FastifyInstance) {
    fastify.get(discoverDocument.OAuthStateRoute.route, GetOAuthCode);
    fastify.get(discoverDocument.OAuthRedirectRoute.route, AuthCodeOpts, AuthenticateUser);
}

export default OAuthRoutes;