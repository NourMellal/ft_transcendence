import { FastifyInstance } from 'fastify'
import { FetchUserInfo, IsDisplayNameAvailable, RemoveUserProfile, UpdateUserInfo } from '../controllers/User';
import { discoverDocument } from '../models/DiscoveryDocument';
import { isRequestAuthorizedHook } from './OAuth';

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
}

const GetUserInfoOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                uid: { type: 'string' },
            },
            required: ['uid']
        },
        headers: AuthHeaderValidation.schema.headers
    }
};

const CheckDisplayNameOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                uid: { type: 'string' },
            },
            required: ['name']
        },
        headers: AuthHeaderValidation.schema.headers
    }
};

async function UserRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', isRequestAuthorizedHook);
    fastify.get(discoverDocument.FetchUserInfoRoute.route, GetUserInfoOpts, FetchUserInfo);
    fastify.get(discoverDocument.CheckUserDisplayNameAvailableRoute.route, CheckDisplayNameOpts, IsDisplayNameAvailable);
    fastify.post(discoverDocument.UpdateUserInfoRoute.route, AuthHeaderValidation, UpdateUserInfo);
    fastify.delete(discoverDocument.RemoveUserProfileRoute.route, AuthHeaderValidation, RemoveUserProfile);
}

export default UserRoutes;