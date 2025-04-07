import { FastifyInstance } from 'fastify'
import { FetchUserInfo, UpdateUserInfo } from '../controllers/User';
import { discoverDocument } from '../models/DiscoveryDocument';
import { isRequestAuthorizedHook } from './OAuth';

const GetUserInfoOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                uid: { type: 'string' },
            },
            required: ['uid']
        },
        headers: {
            type: 'object',
            properties: {
                'Authorization': { type: 'string' }
            },
            required: ['Authorization']
        }
    }
};

const PostUserInfoOpts = {
    schema: {
        headers: {
            type: 'object',
            properties: {
                'Authorization': { type: 'string' }
            },
            required: ['Authorization']
        }
    }
}

async function UserRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', isRequestAuthorizedHook);
    fastify.get(discoverDocument.FetchUserInfoRoute.route, GetUserInfoOpts, FetchUserInfo);
    fastify.post(discoverDocument.UpdateUserInfoRoute.route, PostUserInfoOpts, UpdateUserInfo);
}

export default UserRoutes;