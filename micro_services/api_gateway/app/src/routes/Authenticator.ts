import { FastifyInstance } from 'fastify'
import { discoverDocument } from '../models/DiscoveryDocument';
import { IsDisplayNameAvailable, SignInStandardUser, SignUpNewStandardUser } from '../controllers/Authenticator';

const CheckDisplayNameOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                username: { type: 'string' }
            },
            required: ['username']
        },
    }
};

async function AuthenticatorRoutes(fastify: FastifyInstance) {
    fastify.get(discoverDocument.MiscRoutes.CheckUserDisplayNameAvailableRoute.route, CheckDisplayNameOpts, IsDisplayNameAvailable);
    fastify.post(discoverDocument.StandardAuthRoutes.SignUpUserRoute.route, SignUpNewStandardUser);
    fastify.post(discoverDocument.StandardAuthRoutes.SignInUserRoute.route, SignInStandardUser);
}

export default AuthenticatorRoutes;