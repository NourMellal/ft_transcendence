import { FastifyInstance } from 'fastify'
import { FetchUserInfo, RemoveUserProfile, UpdateUserInfo } from '../../controllers/microservices/user_manager';
import { discoverDocument } from '../../models/DiscoveryDocument';
import { isRequestAuthorizedHook } from '../OAuth';

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

async function UserManagerRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', isRequestAuthorizedHook);
    fastify.get(discoverDocument.UserManagementRoutes.FetchUserInfoRoute.route, GetUserInfoOpts, FetchUserInfo);
    fastify.post(discoverDocument.UserManagementRoutes.UpdateUserInfoRoute.route, AuthHeaderValidation, UpdateUserInfo);
    fastify.delete(discoverDocument.UserManagementRoutes.RemoveUserProfileRoute.route, AuthHeaderValidation, RemoveUserProfile);
}

export default UserManagerRoutes;