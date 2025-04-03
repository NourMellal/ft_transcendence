import { FastifyInstance } from 'fastify'
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

async function OAuthRoutes(fastify: FastifyInstance) {
    fastify.get('/OAuth/signin', GetOAuthCode);
    fastify.get('/OAuth/code', AuthCodeOpts, AuthenticateUser);
}

export default OAuthRoutes;