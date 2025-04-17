import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { discoverDocument } from '../models/DiscoveryDocument';
import AuthProvider from '../classes/AuthProvider';
import { Disable2FA, Enable2FA, Verify2FACode } from '../controllers/2FA';

const AuthHeaderValidation = {
    schema: {
        headers: {
            type: 'object',
            properties: {
                'Cookie': { type: 'string' }
            },
            required: ['Cookie']
        }
    }
};

const Verify2FAOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                state: { type: 'string' },
            },
            required: ['state']
        }
    }
};

async function TwoFactorAuth(fastify: FastifyInstance) {
    fastify.post(discoverDocument.TwoFactorAuthRoutes.Enable2FA.route, AuthHeaderValidation, Enable2FA);
    fastify.post(discoverDocument.TwoFactorAuthRoutes.Disable2FA.route, AuthHeaderValidation, Disable2FA);
    fastify.post(discoverDocument.TwoFactorAuthRoutes.VerifyCode.route, Verify2FAOpts, Verify2FACode);
}

export default TwoFactorAuth;