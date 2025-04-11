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
    fastify.get(discoverDocument.CheckUserDisplayNameAvailableRoute.route, CheckDisplayNameOpts, IsDisplayNameAvailable);
    fastify.post(discoverDocument.StandardSignUpUserRoute.route, SignUpNewStandardUser);
    fastify.post(discoverDocument.StandardSignInUserRoute.route, SignInStandardUser);
}

export default AuthenticatorRoutes;